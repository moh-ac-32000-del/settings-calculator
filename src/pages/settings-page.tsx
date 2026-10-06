import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, ChevronDown, CircleHelp, Clipboard, ClipboardPaste, Coins, Hammer, Layers3, Minus, PackageOpen, Pencil, Plus, Settings2, Share2, Trash2, Truck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalculationMode, createId, loadSettings, Material, saveSettings, Section, SettingsState, ShippingExpenseSetting, WorkType, SETTINGS_SCHEMA_VERSION } from '@/lib/settings-store';
import { createSettingsCode, parseSettingsCode } from '@/lib/settings-transfer';
import { reconcileOperationsOrderAfterSettingsChange } from '@/lib/operations-order-store';
import AppBottomNav from '@/components/app-bottom-nav';

type Area = 'materials' | 'sections' | 'work';
type EntityKind = 'material' | 'section' | 'work';
type ModalState =
  | { kind: 'material' | 'section' | 'work'; item?: Material | Section | WorkType }
  | { kind: 'delete'; target: EntityKind; item: Material | Section | WorkType }
  | { kind: 'share-settings'; code: string }
  | { kind: 'import-settings'; code: string }
  | { kind: 'import-preview'; candidate: SettingsState }
  | null;

const modeCopy: Record<CalculationMode, { label: string; description: string; short: string }> = {
  SELECT_ONE_MULTIPLY: { label: 'اختيار واحد', description: 'اختيار مادة واحدة ثم ضربها في الكمية.', short: 'مرجع واحد' },
  SUM_SELECTED_MULTIPLY: { label: 'جمع المختار', description: 'جمع المواد المختارة ثم ضرب مجموعها.', short: 'مراجع متعددة' },
};

const areaCopy: Record<Area, { label: string; title: string; description: string; eyebrow: string }> = {
  materials: {
    label: 'المواد والأسعار',
    title: 'المواد والأسعار',
    description: 'سجل واحد للمواد التي تشتريها أو تستخدمها، مع سعر كل وحدة.',
    eyebrow: '01 / سجل الأسعار',
  },
  sections: {
    label: 'الأقسام',
    title: 'الأقسام',
    description: 'مجموعات قابلة لإعادة الاستخدام من المواد مع قاعدة حساب واضحة.',
    eyebrow: '02 / وحدات الحساب',
  },
  work: {
    label: 'أنواع الأعمال',
    title: 'أنواع الأعمال',
    description: 'اجمع الأقسام في أنواع الأعمال التي تعود إليها باستمرار.',
    eyebrow: '03 / قوالب العمل',
  },
};

function formatWesternNumber(value: number | string) {
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',');
}

function normalizePriceInput(value: number | string) {
  return formatWesternNumber(value)
    .replace(/،/g, '.')
    .replace(/,/g, '');
}

function money(value: number) {
  return formatWesternNumber(new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value));
}

function EmptyState({ icon: Icon, title, detail, action }: { icon: typeof PackageOpen; title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--background)/.36)] px-6 py-9 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.7)] text-[hsl(var(--accent-foreground))]">
        <Icon size={18} strokeWidth={1.7} />
      </div>
      <p className="text-sm font-bold text-[hsl(var(--foreground))]">{title}</p>
      <p className="mt-2 max-w-xs text-xs leading-6 text-[hsl(var(--muted-foreground))]">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[hsl(var(--foreground))]">{label}</span>
      {children}
      {hint && <span className="mt-2 block text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">{hint}</span>}
    </label>
  );
}

function Button({ children, variant = 'secondary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      className={cn(
        'active-elevate inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-45',
        variant === 'primary' && 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110',
        variant === 'secondary' && 'border border-[hsl(var(--border))] bg-[hsl(var(--card)/.72)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]',
        variant === 'ghost' && 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
        variant === 'danger' && 'border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/.15)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({ children, onClose, title, eyebrow }: { children: ReactNode; onClose: () => void; title: string; eyebrow: string }) {
  return (
    <div
      className="dialog-backdrop fixed inset-0 z-40 flex items-end justify-center bg-[hsl(225_30%_2%/.72)] p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="dialog-panel w-full max-w-lg rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl sm:rounded-2xl sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-medium tracking-[.08em] text-[hsl(var(--accent-foreground))]">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-extrabold tracking-[-.04em]">{title}</h2>
          </div>
          <Button variant="ghost" className="size-11 shrink-0 p-0" onClick={onClose} aria-label="إغلاق النافذة" data-testid="button-close-dialog"><X size={17} /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MaterialForm({ initial, onSave, onClose }: { initial?: Material; onSave: (name: string, price: number) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(normalizePriceInput(initial?.price ?? ''));
  const valid = name.trim().length > 0 && Number(price) >= 0 && price !== '';
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (valid) onSave(name, Number(normalizePriceInput(price))); }} className="space-y-5">
      <Field label="اسم المادة"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: معدن ساتان" data-testid="input-material-name" className="field-input" /></Field>
      <Field label="سعر الوحدة" hint="تُحفظ الأسعار محليًا على هذا الجهاز.">
        <div className="relative"><Coins size={15} className="pointer-events-none absolute right-3 top-3.5 text-[hsl(var(--muted-foreground))]" /><input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(normalizePriceInput(e.target.value))} placeholder="0.00" data-testid="input-material-price" className="field-input pr-10" dir="ltr" /></div>
      </Field>
      <div className="flex justify-start gap-2 border-t border-[hsl(var(--border))] pt-5">
        <Button type="submit" variant="primary" disabled={!valid} data-testid="button-save-material"><Check size={14} />{initial ? 'حفظ التعديلات' : 'إضافة المادة'}</Button>
        <Button type="button" variant="ghost" onClick={onClose} data-testid="button-cancel-material">إلغاء</Button>
      </div>
    </form>
  );
}

function SectionForm({ initial, materials, onSave, onClose }: { initial?: Section; materials: Material[]; onSave: (name: string, mode: CalculationMode, materialIds: string[]) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [mode, setMode] = useState<CalculationMode>(initial?.calculationMode ?? 'SELECT_ONE_MULTIPLY');
  const [materialIds, setMaterialIds] = useState<string[]>(initial?.materialIds ?? []);
  const available = materials.filter((material) => !materialIds.includes(material.id));
  const valid = name.trim().length > 0;
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (valid) onSave(name, mode, materialIds); }} className="space-y-5">
      <Field label="اسم القسم"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: تشطيب السطح" data-testid="input-section-name" className="field-input" /></Field>
      <Field label="طريقة الحساب" hint={modeCopy[mode].description}>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(modeCopy) as CalculationMode[]).map((key) => (
            <button type="button" key={key} onClick={() => setMode(key)} data-testid={`button-mode-${key}`} className={cn('rounded-xl border p-3 text-right transition-colors', mode === key ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.13)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]')}>
              <span className="flex items-center justify-between text-xs font-bold"><span>{modeCopy[key].label}</span><span className={cn('size-3 rounded-full border', mode === key ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]' : 'border-[hsl(var(--muted-foreground))]')} /></span>
              <span className="mt-2 block text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">{modeCopy[key].short}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="المواد في هذا القسم" hint="تبقى المراجع مرتبطة بسعر المادة الحالي.">
        <div className="space-y-2">
          {materialIds.length === 0 ? <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-3 py-3 text-xs text-[hsl(var(--muted-foreground))]">لم تتم إضافة مواد بعد.</div> : materialIds.map((id) => {
            const material = materials.find((item) => item.id === id);
            return material ? <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.5)] px-3 py-2.5" key={id}><div><p className="text-xs font-semibold">{material.name}</p><p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{money(material.price)}</p></div><button type="button" onClick={() => setMaterialIds((current) => current.filter((value) => value !== id))} className="flex size-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--destructive))]" aria-label={`إزالة ${material.name}`} data-testid={`button-remove-material-${id}`}><Minus size={14} /></button></div> : null;
          })}</div>
        <div className="relative mt-2"><select value="" onChange={(e) => { if (e.target.value) setMaterialIds((current) => [...current, e.target.value]); }} disabled={!available.length} aria-label="إضافة مادة إلى القسم" data-testid="select-section-material" className="field-input appearance-none pl-8"><option value="">{available.length ? 'إضافة مادة موجودة' : 'تمت إضافة كل المواد'}</option>{available.map((material) => <option key={material.id} value={material.id}>{material.name} · {money(material.price)}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute left-3 top-3.5 text-[hsl(var(--muted-foreground))]" /></div>
      </Field>
      <div className="flex justify-start gap-2 border-t border-[hsl(var(--border))] pt-5"><Button type="submit" variant="primary" disabled={!valid} data-testid="button-save-section"><Check size={14} />{initial ? 'حفظ التعديلات' : 'إضافة القسم'}</Button><Button type="button" variant="ghost" onClick={onClose} data-testid="button-cancel-section">إلغاء</Button></div>
    </form>
  );
}

function WorkForm({ initial, sections, onSave, onClose }: { initial?: WorkType; sections: Section[]; onSave: (name: string, sectionIds: string[]) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [sectionIds, setSectionIds] = useState<string[]>(initial?.sectionIds ?? []);
  const valid = name.trim().length > 0;
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (valid) onSave(name, sectionIds); }} className="space-y-5">
      <Field label="اسم نوع العمل"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: تجهيز متجر" data-testid="input-work-name" className="field-input" /></Field>
      <Field label="الأقسام المضمنة" hint="اختر الأقسام التي يستخدمها نوع العمل هذا.">
        <div className="space-y-2">{sections.length === 0 ? <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-3 py-3 text-xs text-[hsl(var(--muted-foreground))]">أنشئ قسمًا أولًا لربطه هنا.</div> : sections.map((section) => <label key={section.id} className={cn('flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors', sectionIds.includes(section.id) ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.13)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]')}><input type="checkbox" checked={sectionIds.includes(section.id)} onChange={(e) => setSectionIds((current) => e.target.checked ? [...current, section.id] : current.filter((id) => id !== section.id))} data-testid={`checkbox-work-section-${section.id}`} className="size-4 accent-[hsl(var(--primary))]" /><span className="text-xs font-semibold">{section.name}</span><span className="mr-auto font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{formatWesternNumber(section.materialIds.length)} مواد</span></label>)}</div>
      </Field>
      <div className="flex justify-start gap-2 border-t border-[hsl(var(--border))] pt-5"><Button type="submit" variant="primary" disabled={!valid} data-testid="button-save-work"><Check size={14} />{initial ? 'حفظ التعديلات' : 'إضافة نوع العمل'}</Button><Button type="button" variant="ghost" onClick={onClose} data-testid="button-cancel-work">إلغاء</Button></div>
    </form>
  );
}

function ShippingExpensesSection({
  sections,
  shippingExpenses,
  onChange,
}: {
  sections: Section[];
  shippingExpenses: ShippingExpenseSetting[];
  onChange: (next: ShippingExpenseSetting[]) => void;
}) {
  const configuredBySectionId = new Map(shippingExpenses.map((item) => [item.sectionId, item]));

  const toggleSection = (sectionId: string, checked: boolean) => {
    if (checked) {
      if (configuredBySectionId.has(sectionId)) return;
      onChange([...shippingExpenses, { sectionId, referenceQuantity: 1, referenceCost: 0 }]);
      return;
    }
    onChange(shippingExpenses.filter((item) => item.sectionId !== sectionId));
  };

  const updateSetting = (sectionId: string, field: 'referenceQuantity' | 'referenceCost', value: string) => {
    const normalized = normalizePriceInput(value);
    const parsed = Number(normalized);
    const nextValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    onChange(shippingExpenses.map((item) => item.sectionId === sectionId ? { ...item, [field]: nextValue } : item));
  };

  return (
    <section className="section-card mt-5" data-testid="shipping-expenses-settings">
      <div className="section-heading">
        <div>
          <p className="eyebrow">04 / تكلفة إضافية</p>
          <h2>إعداد مصاريف الشحن</h2>
          <p className="section-description">حدد الأقسام التي ترتبط بمصاريف شحن مرجعية. تُحسب تلقائيًا في صفحة العمليات حسب كمية القسم.</p>
        </div>
        <Truck size={21} className="text-[hsl(var(--accent-foreground))]" />
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-4 text-xs leading-6 text-[hsl(var(--muted-foreground))]">
          أضف قسمًا أولًا حتى تتمكن من ربطه بإعدادات مصاريف الشحن.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {sections.map((section) => {
            const setting = configuredBySectionId.get(section.id);
            return (
              <div key={section.id} className={cn('rounded-xl border p-3.5 transition-colors', setting ? 'border-[hsl(var(--accent)/.65)] bg-[hsl(var(--accent)/.06)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--background)/.3)]')} data-testid={`shipping-section-${section.id}`}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(setting)}
                    onChange={(event) => toggleSection(section.id, event.target.checked)}
                    className="size-4 accent-[hsl(var(--primary))]"
                    data-testid={`checkbox-shipping-section-${section.id}`}
                  />
                  <span className="text-xs font-bold">{section.name}</span>
                  <span className="mr-auto text-[10px] text-[hsl(var(--muted-foreground))]">{setting ? 'مفعّل' : 'غير مفعّل'}</span>
                </label>
                {setting && (
                  <div className="mt-3 grid gap-2 border-t border-[hsl(var(--border))] pt-3 sm:grid-cols-2">
                    <Field label="الكمية المرجعية" hint="يجب أن تكون أكبر من صفر.">
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        value={String(setting.referenceQuantity)}
                        onChange={(event) => updateSetting(section.id, 'referenceQuantity', event.target.value)}
                        className="field-input"
                        data-testid={`input-shipping-quantity-${section.id}`}
                      />
                    </Field>
                    <Field label="مصاريف الشحن المرجعية">
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        value={String(setting.referenceCost)}
                        onChange={(event) => updateSetting(section.id, 'referenceCost', event.target.value)}
                        className="field-input"
                        data-testid={`input-shipping-cost-${section.id}`}
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DeleteModal({ target, item, onClose, onConfirm, detail }: { target: EntityKind; item: Material | Section | WorkType; onClose: () => void; onConfirm: () => void; detail: string }) {
  const label = target === 'material' ? 'المادة' : target === 'section' ? 'القسم' : 'نوع العمل';
  return (
    <Modal title={`حذف ${label}؟`} eyebrow="تأكيد مطلوب" onClose={onClose}>
      <div className="flex gap-3 rounded-xl border border-[hsl(var(--destructive)/.28)] bg-[hsl(var(--destructive)/.07)] p-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-[hsl(var(--destructive))]" /><p className="text-xs leading-6 text-[hsl(var(--foreground))]">{detail}</p></div>
      <p className="mt-5 text-sm leading-7">سيتم حذف <strong>{item.name}</strong>. لا يمكن التراجع عن هذا الإجراء.</p>
      <div className="mt-6 flex justify-start gap-2"><Button variant="danger" onClick={onConfirm} data-testid={`button-confirm-delete-${target}`}><Trash2 size={14} />حذف {label}</Button><Button variant="ghost" onClick={onClose} data-testid="button-cancel-delete">الاحتفاظ به</Button></div>
    </Modal>
  );
}

function transferCounts(candidate: SettingsState) {
  return [
    `المواد: ${formatWesternNumber(candidate.materials.length)}`,
    `الأقسام: ${formatWesternNumber(candidate.sections.length)}`,
    `أنواع الأعمال: ${formatWesternNumber(candidate.workTypes.length)}`,
  ];
}

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState>(() => loadSettings());
  const [modal, setModal] = useState<ModalState>(null);
  const [activeArea, setActiveArea] = useState<Area>('materials');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [transferMessage, setTransferMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => { saveSettings(state); setSavedAt(new Date()); }, [state]);
  useEffect(() => { document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl'; }, []);

  const materialById = useMemo(() => new Map(state.materials.map((material) => [material.id, material])), [state.materials]);
  const counts = `${formatWesternNumber(state.materials.length)} مواد · ${formatWesternNumber(state.sections.length)} أقسام · ${formatWesternNumber(state.workTypes.length)} أنواع أعمال`;
  const update = (next: SettingsState) => setState({ ...next, schemaVersion: SETTINGS_SCHEMA_VERSION });
  const updateShippingExpenses = (shippingExpenses: ShippingExpenseSetting[]) => update({ ...state, shippingExpenses });
  const openCreate = (kind: EntityKind) => { setActiveArea(kind === 'work' ? 'work' : kind === 'section' ? 'sections' : 'materials'); setModal({ kind }); };
  const saveMaterial = (id: string | undefined, name: string, price: number) => { update({ ...state, materials: id ? state.materials.map((item) => item.id === id ? { ...item, name, price } : item) : [...state.materials, { id: createId('mat'), name, price }] }); setModal(null); };
  const saveSection = (id: string | undefined, name: string, calculationMode: CalculationMode, materialIds: string[]) => { update({ ...state, sections: id ? state.sections.map((item) => item.id === id ? { ...item, name, calculationMode, materialIds } : item) : [...state.sections, { id: createId('sec'), name, calculationMode, materialIds }] }); setModal(null); };
  const saveWork = (id: string | undefined, name: string, sectionIds: string[]) => {
    const nextState = {
      ...state,
      workTypes: id
        ? state.workTypes.map((item) => item.id === id ? { ...item, name, sectionIds } : item)
        : [...state.workTypes, { id: createId('work'), name, sectionIds }],
    };
    reconcileOperationsOrderAfterSettingsChange(state, nextState);
    update(nextState);
    setModal(null);
  };
  const openShareSettings = () => {
    setTransferMessage(null);
    setModal({ kind: 'share-settings', code: createSettingsCode(state) });
  };
  const openImportSettings = () => {
    setTransferMessage(null);
    setModal({ kind: 'import-settings', code: '' });
  };
  const updateTransferCode = (code: string) => {
    if (modal?.kind === 'import-settings') setModal({ ...modal, code });
  };
  const copySettingsCode = async (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        if (!document.execCommand('copy')) throw new Error('copy-failed');
        textarea.remove();
      }
      setTransferMessage({ type: 'success', text: 'تم نسخ كود الإعدادات' });
    } catch (error) {
      setTransferMessage({ type: 'error', text: 'تعذر نسخ الكود. حدده وانسخه يدويًا.' });
    }
  };
  const pasteSettingsCode = async () => {
    try {
      if (!navigator.clipboard?.readText) throw new Error('clipboard-unavailable');
      updateTransferCode(await navigator.clipboard.readText());
      setTransferMessage(null);
    } catch {
      setTransferMessage({ type: 'error', text: 'تعذر القراءة من الحافظة. الصق الكود يدويًا.' });
    }
  };
  const submitImportCode = (code: string) => {
    try {
      const candidate = parseSettingsCode(code);
      setTransferMessage(null);
      setModal({ kind: 'import-preview', candidate });
    } catch (error) {
      setTransferMessage({ type: 'error', text: error instanceof Error ? error.message : 'كود الإعدادات غير صالح.' });
    }
  };
  const confirmImport = () => {
    if (modal?.kind !== 'import-preview') return;
    setState(modal.candidate);
    setModal(null);
    setTransferMessage({ type: 'success', text: 'تم استيراد الإعدادات بنجاح.' });
  };
  const confirmDelete = () => {
    if (!modal || modal.kind !== 'delete') return;
    const { target, item } = modal;
    if (target === 'material') update({ ...state, materials: state.materials.filter((value) => value.id !== item.id), sections: state.sections.map((section) => ({ ...section, materialIds: section.materialIds.filter((id) => id !== item.id) })) });
    if (target === 'section') {
      const nextState = {
        ...state,
        sections: state.sections.filter((value) => value.id !== item.id),
        workTypes: state.workTypes.map((work) => ({ ...work, sectionIds: work.sectionIds.filter((id) => id !== item.id) })),
        shippingExpenses: state.shippingExpenses.filter((expense) => expense.sectionId !== item.id),
      };
      reconcileOperationsOrderAfterSettingsChange(state, nextState);
      update(nextState);
    }
    if (target === 'work') {
      const nextState = { ...state, workTypes: state.workTypes.filter((value) => value.id !== item.id) };
      reconcileOperationsOrderAfterSettingsChange(state, nextState);
      update(nextState);
    }
    setModal(null);
  };
  const deleteDetail = modal?.kind === 'delete' && modal.target === 'material' && state.sections.some((section) => section.materialIds.includes(modal.item.id))
    ? 'هذه المادة مستخدمة في قسم واحد أو أكثر. سيؤدي حذفها إلى إزالة مراجعها بأمان.'
    : modal?.kind === 'delete' && modal.target === 'section' && state.workTypes.some((work) => work.sectionIds.includes(modal.item.id))
      ? 'هذا القسم مستخدم في نوع عمل واحد أو أكثر. سيؤدي حذفه إلى إزالة مراجعها بأمان.'
      : 'سيُحذف هذا العنصر من إعداداتك المحلية.';

  const active = areaCopy[activeArea];
  return (
    <div className="paper-noise min-h-[100dvh] bg-[hsl(var(--background))]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-5xl px-4 pb-28 sm:px-6 lg:px-8">
        <header className="pb-5 pt-5 sm:pb-7 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-medium text-[hsl(var(--accent-foreground))]"><span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.13)]"><Hammer size={14} /></span><span>إعدادات الحاسبة</span></div>
              <h1 className="text-2xl font-extrabold tracking-[-.06em] sm:text-3xl">إعداداتك المحلية</h1>
              <p className="mt-2 max-w-md text-xs leading-6 text-[hsl(var(--muted-foreground))]">أدر المواد والأسعار والأقسام وأنواع الأعمال من مكان واحد.</p>
            </div>
            <div className="stat-chip hidden shrink-0 px-3 py-2 text-left sm:block">
              <p className="font-mono text-[9px] text-[hsl(var(--muted-foreground))]">محفوظ على الجهاز</p>
              <p className="mt-1 text-xs font-bold text-[hsl(var(--accent-foreground))]">{counts}</p>
            </div>
          </div>
          <nav className="top-nav mt-6 grid grid-cols-3 gap-1 rounded-xl p-1" aria-label="أقسام الإعدادات">
            {(['materials', 'sections', 'work'] as Area[]).map((key) => {
              const Icon = key === 'materials' ? PackageOpen : key === 'sections' ? Layers3 : Settings2;
              const count = key === 'materials' ? state.materials.length : key === 'sections' ? state.sections.length : state.workTypes.length;
              return <button key={key} onClick={() => setActiveArea(key)} data-active={activeArea === key} data-testid={`nav-${key}`} className="nav-item flex items-center justify-center gap-1.5 px-2 text-[10px] font-bold sm:gap-2 sm:text-xs"><Icon size={15} strokeWidth={1.8} /><span>{areaCopy[key].label}</span><span className="font-mono text-[9px] opacity-60">{formatWesternNumber(count)}</span></button>;
            })}
          </nav>
        </header>

        <main>
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] px-3.5 py-3 text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2"><CircleHelp size={15} className="shrink-0 text-[hsl(var(--accent-foreground))]" /><span>تُحفظ التغييرات تلقائيًا على هذا المتصفح.</span></div>
            {savedAt && <span className="hidden font-mono text-[10px] sm:inline">آخر حفظ {formatWesternNumber(savedAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }))}</span>}
          </div>
          <section className="mb-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent)/.13)] text-[hsl(var(--accent-foreground))]"><Share2 size={17} /></div>
              <div>
                <h2 className="text-sm font-extrabold">مشاركة واستيراد الإعدادات</h2>
                <p className="mt-1 text-xs leading-6 text-[hsl(var(--muted-foreground))]">انقل المواد والأقسام وأنواع الأعمال عبر كود نصي محلي.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={openShareSettings} data-testid="button-share-settings"><Share2 size={14} />مشاركة الإعدادات</Button>
              <Button variant="secondary" onClick={openImportSettings} data-testid="button-import-settings"><ClipboardPaste size={14} />استيراد الإعدادات</Button>
            </div>
            {transferMessage && <p role="status" className={cn('mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs leading-5', transferMessage.type === 'error' ? 'border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))]' : 'border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.08)] text-[hsl(var(--accent-foreground))]')}><span className="size-1.5 shrink-0 rounded-full bg-current" />{transferMessage.text}</p>}
          </section>
          <section className="section-card">
            <div className="section-heading">
              <div><p className="eyebrow">{active.eyebrow}</p><h2>{active.title}</h2><p className="section-description">{active.description}</p></div>
              <Button variant="primary" onClick={() => openCreate(activeArea === 'materials' ? 'material' : activeArea === 'sections' ? 'section' : 'work')} data-testid={`button-add-${activeArea === 'work' ? 'work' : activeArea.slice(0, -1)}`}><Plus size={15} />{activeArea === 'materials' ? 'إضافة مادة' : activeArea === 'sections' ? 'إضافة قسم' : 'إضافة نوع عمل'}</Button>
            </div>

            {activeArea === 'materials' && (state.materials.length === 0
              ? <EmptyState icon={PackageOpen} title="سجل الأسعار فارغ" detail="أضف مادة للبدء في بناء أقسام حساب قابلة لإعادة الاستخدام." action={<Button variant="primary" onClick={() => openCreate('material')} data-testid="button-empty-add-material"><Plus size={14} />إضافة أول مادة</Button>} />
              : <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]"><div className="list-header"><span>المادة</span><span>سعر الوحدة</span><span className="text-left">الإجراءات</span></div>{state.materials.map((material, index) => <div key={material.id} className="list-row" data-testid={`row-material-${material.id}`}><div className="flex min-w-0 items-center gap-3"><span className="index-mark">{formatWesternNumber(String(index + 1).padStart(2, '0'))}</span><span className="truncate text-sm font-semibold">{material.name}</span></div><span className="font-mono text-xs">{money(material.price)}</span><div className="flex justify-end gap-1"><Button variant="ghost" className="size-10 p-0" onClick={() => setModal({ kind: 'material', item: material })} aria-label={`تعديل ${material.name}`} data-testid={`button-edit-material-${material.id}`}><Pencil size={14} /></Button><Button variant="ghost" className="size-10 p-0 hover:text-[hsl(var(--destructive))]" onClick={() => setModal({ kind: 'delete', target: 'material', item: material })} aria-label={`حذف ${material.name}`} data-testid={`button-delete-material-${material.id}`}><Trash2 size={14} /></Button></div></div>)}</div>)}
            {activeArea === 'sections' && (state.sections.length === 0
              ? <EmptyState icon={Layers3} title="لا توجد أقسام بعد" detail="حوّل مجموعة من المواد إلى جزء قابل لإعادة الاستخدام." action={<Button variant="primary" onClick={() => openCreate('section')} data-testid="button-empty-add-section"><Plus size={14} />إضافة أول قسم</Button>} />
              : <div className="grid gap-3 lg:grid-cols-2">{state.sections.map((section, index) => <div className="section-tile" key={section.id} data-testid={`card-section-${section.id}`}><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="index-mark mt-0.5">{formatWesternNumber(String(index + 1).padStart(2, '0'))}</span><div><h3 className="text-sm font-extrabold">{section.name}</h3><span className="mt-2 inline-flex rounded-full bg-[hsl(var(--accent)/.14)] px-2 py-1 text-[9px] font-bold text-[hsl(var(--accent-foreground))]">{modeCopy[section.calculationMode].label}</span></div></div><div className="flex gap-1"><Button variant="ghost" className="size-10 p-0" onClick={() => setModal({ kind: 'section', item: section })} aria-label={`تعديل ${section.name}`} data-testid={`button-edit-section-${section.id}`}><Pencil size={14} /></Button><Button variant="ghost" className="size-10 p-0 hover:text-[hsl(var(--destructive))]" onClick={() => setModal({ kind: 'delete', target: 'section', item: section })} aria-label={`حذف ${section.name}`} data-testid={`button-delete-section-${section.id}`}><Trash2 size={14} /></Button></div></div><div className="mt-5 border-t border-[hsl(var(--border))] pt-3">{section.materialIds.length ? <div className="flex flex-wrap gap-1.5">{section.materialIds.map((id) => { const material = materialById.get(id); return material ? <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.55)] px-2 py-1.5 text-[11px] font-semibold"><span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" />{material.name}<span className="font-mono text-[10px] font-normal text-[hsl(var(--muted-foreground))]">{money(material.price)}</span></span> : null; })}</div> : <p className="text-xs italic leading-6 text-[hsl(var(--muted-foreground))]">لا توجد مواد مرتبطة — عدّل القسم لإضافة مراجع.</p>}</div></div>)}</div>)}
            {activeArea === 'work' && (state.workTypes.length === 0
              ? <EmptyState icon={Settings2} title="لا توجد أنواع أعمال بعد" detail="أنشئ نوع عمل عندما تتكرر مجموعة من الأقسام." action={<Button variant="primary" onClick={() => openCreate('work')} data-testid="button-empty-add-work"><Plus size={14} />إضافة أول نوع عمل</Button>} />
              : <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]"><div className="list-header"><span>نوع العمل</span><span>الأقسام المضمنة</span><span className="text-left">الإجراءات</span></div>{state.workTypes.map((work, index) => <div key={work.id} className="list-row" data-testid={`row-work-${work.id}`}><div className="flex min-w-0 items-center gap-3"><span className="index-mark">{formatWesternNumber(String(index + 1).padStart(2, '0'))}</span><span className="truncate text-sm font-semibold">{work.name}</span></div><div className="flex flex-wrap gap-1">{work.sectionIds.length ? work.sectionIds.map((id) => <span key={id} className="rounded-lg bg-[hsl(var(--muted))] px-2 py-1 text-[10px] font-semibold">{state.sections.find((section) => section.id === id)?.name ?? 'قسم غير موجود'}</span>) : <span className="text-xs italic text-[hsl(var(--muted-foreground))]">لا توجد أقسام</span>}</div><div className="flex justify-end gap-1"><Button variant="ghost" className="size-10 p-0" onClick={() => setModal({ kind: 'work', item: work })} aria-label={`تعديل ${work.name}`} data-testid={`button-edit-work-${work.id}`}><Pencil size={14} /></Button><Button variant="ghost" className="size-10 p-0 hover:text-[hsl(var(--destructive))]" onClick={() => setModal({ kind: 'delete', target: 'work', item: work })} aria-label={`حذف ${work.name}`} data-testid={`button-delete-work-${work.id}`}><Trash2 size={14} /></Button></div></div>)}</div>)}
          </section>
          <ShippingExpensesSection sections={state.sections} shippingExpenses={state.shippingExpenses} onChange={updateShippingExpenses} />
        </main>
      </div>

      {modal?.kind === 'material' && <Modal title={modal.item ? 'تعديل مادة' : 'إضافة مادة'} eyebrow="سجل الأسعار" onClose={() => setModal(null)}><MaterialForm initial={modal.item as Material | undefined} onClose={() => setModal(null)} onSave={(name, price) => saveMaterial((modal.item as Material | undefined)?.id, name, price)} /></Modal>}
      {modal?.kind === 'section' && <Modal title={modal.item ? 'تعديل قسم' : 'إضافة قسم'} eyebrow="وحدة حساب" onClose={() => setModal(null)}><SectionForm initial={modal.item as Section | undefined} materials={state.materials} onClose={() => setModal(null)} onSave={(name, mode, ids) => saveSection((modal.item as Section | undefined)?.id, name, mode, ids)} /></Modal>}
      {modal?.kind === 'work' && <Modal title={modal.item ? 'تعديل نوع عمل' : 'إضافة نوع عمل'} eyebrow="قالب عمل" onClose={() => setModal(null)}><WorkForm initial={modal.item as WorkType | undefined} sections={state.sections} onClose={() => setModal(null)} onSave={(name, ids) => saveWork((modal.item as WorkType | undefined)?.id, name, ids)} /></Modal>}
      {modal?.kind === 'delete' && <DeleteModal target={modal.target} item={modal.item} detail={deleteDetail} onClose={() => setModal(null)} onConfirm={confirmDelete} />}
      {modal?.kind === 'share-settings' && <Modal title="مشاركة الإعدادات" eyebrow="كود الإعدادات" onClose={() => setModal(null)}>
        <p className="text-xs leading-6 text-[hsl(var(--muted-foreground))]">انسخ الكود وأرسله للشخص الذي تريد مشاركة إعداداتك معه.</p>
        <textarea value={modal.code} readOnly spellCheck={false} dir="ltr" className="field-input mt-4 min-h-28 resize-y font-mono text-[10px] leading-5" aria-label="كود الإعدادات" />
        <div className="mt-4 flex justify-start gap-2"><Button variant="primary" onClick={() => copySettingsCode(modal.code)} data-testid="button-copy-settings-code"><Clipboard size={14} />نسخ الكود</Button><Button variant="ghost" onClick={() => setModal(null)} data-testid="button-close-share-settings">إغلاق</Button></div>
        {transferMessage && <p role="status" className={cn('mt-3 rounded-lg border px-3 py-2 text-xs leading-5', transferMessage.type === 'error' ? 'border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))]' : 'border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.08)] text-[hsl(var(--accent-foreground))]')}>{transferMessage.text}</p>}
      </Modal>}
      {modal?.kind === 'import-settings' && <Modal title="استيراد الإعدادات" eyebrow="لصق كود الإعدادات" onClose={() => setModal(null)}>
        <label className="block"><span className="mb-2 block text-xs font-bold">الصق كود الإعدادات هنا</span><textarea autoFocus value={modal.code} onChange={(event) => updateTransferCode(event.target.value)} spellCheck={false} dir="ltr" className="field-input min-h-36 resize-y font-mono text-[10px] leading-5" aria-label="الصق كود الإعدادات هنا" placeholder="SC1...." /></label>
        <div className="mt-4 flex flex-wrap justify-start gap-2"><Button variant="secondary" onClick={pasteSettingsCode} data-testid="button-paste-settings-code"><ClipboardPaste size={14} />لصق من الحافظة</Button><Button variant="primary" onClick={() => submitImportCode(modal.code)} disabled={!modal.code.trim()} data-testid="button-submit-settings-code"><Check size={14} />استيراد الإعدادات</Button><Button variant="ghost" onClick={() => setModal(null)} data-testid="button-cancel-settings-code">إلغاء</Button></div>
        {transferMessage && <p role="status" className={cn('mt-3 rounded-lg border px-3 py-2 text-xs leading-5', transferMessage.type === 'error' ? 'border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))]' : 'border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.08)] text-[hsl(var(--accent-foreground))]')}>{transferMessage.text}</p>}
      </Modal>}
      {modal?.kind === 'import-preview' && <Modal title="معاينة الاستيراد" eyebrow="ملف الإعدادات" onClose={() => setModal(null)}>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.38)] p-4">
          <p className="text-sm font-bold">معاينة الإعدادات</p>
          <div className="mt-4 grid gap-2 text-xs text-[hsl(var(--muted-foreground))]">{transferCounts(modal.candidate).map((count) => <div key={count} className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted)/.45)] px-3 py-2"><span>{count.split(': ')[0]}</span><span className="font-mono text-[hsl(var(--foreground))]">{count.split(': ')[1]}</span></div>)}</div>
        </div>
        <div className="mt-5 flex gap-3 rounded-xl border border-[hsl(var(--destructive)/.28)] bg-[hsl(var(--destructive)/.07)] p-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-[hsl(var(--destructive))]" /><p className="text-xs leading-6">استيراد هذه الإعدادات سيستبدل الإعدادات الحالية.</p></div>
        <div className="mt-6 flex justify-start gap-2"><Button variant="danger" onClick={confirmImport} data-testid="button-confirm-import"><Check size={14} />تأكيد الاستيراد</Button><Button variant="ghost" onClick={() => setModal(null)} data-testid="button-cancel-import-preview">إلغاء</Button></div>
      </Modal>}
      <AppBottomNav />
    </div>
  );
}
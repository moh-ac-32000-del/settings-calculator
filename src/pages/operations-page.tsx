import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Calculator, Check, ChevronLeft, Delete, GripVertical, Layers3, ListOrdered, MoreVertical, MoveRight, Settings2, SlidersHorizontal, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { loadSettings, Material, Section, SettingsState } from '@/lib/settings-store';
import { appendQuantityKey, calculateShippingExpense, formatAmount, formatWesternNumber, quantityValue, resolveShippingExpense } from '@/lib/operations-utils';
import { getOperationFromArchive, saveOperationToArchive, updateOperationInArchive, type ArchivedOperation, type ArchivedOperationDraft } from '@/lib/operations-archive-store';
import { FREE_WORK_ORDER_ID, getSectionOrderForWork, loadOperationsOrder, normalizeOperationsOrder, OperationsOrder, saveOperationsOrder } from '@/lib/operations-order-store';
import { transferEntriesByPosition, type TransferIssue } from '@/lib/operation-transfer';
import AppBottomNav from '@/components/app-bottom-nav';
import { translateKey } from '@/lib/i18n';

type WorkChoice = 'free' | string;
type OperationEntry = {
  sectionId: string;
  quantity: string;
  selectedMaterialIds: string[];
  materialSelectionTouched?: boolean;
};

const CUSTOMER_NAME_REQUIRED_MESSAGE = 'يرجى إدخال اسم العميل أولًا';

function hexToHslChannels(hex: string) {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case red:
        hue = 60 * (((green - blue) / delta) % 6);
        break;
      case green:
        hue = 60 * ((blue - red) / delta + 2);
        break;
      default:
        hue = 60 * ((red - green) / delta + 4);
    }
  }

  return `${Math.round((hue + 360) % 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

const ORDER_THEME_STYLE = {
  '--background': '168 23% 9%',
  '--foreground': '147 28% 89%',
  '--border': '164 19% 21%',
  '--input': '160 29% 18%',
  '--ring': '160 62% 68%',
  '--card': '166 22% 11%',
  '--card-foreground': '147 28% 89%',
  '--card-border': 'hsl(164 19% 21%)',
  '--popover': '165 22% 11%',
  '--popover-foreground': '147 28% 89%',
  '--popover-border': 'hsl(164 19% 21%)',
  '--primary': '160 62% 68%',
  '--primary-foreground': '160 30% 10%',
  '--primary-border': 'hsl(160 62% 68%)',
  '--secondary': '161 26% 15%',
  '--secondary-foreground': '153 25% 87%',
  '--muted': '160 24% 17%',
  '--muted-foreground': '156 12% 58%',
  '--accent': '39 64% 67%',
  '--accent-foreground': '39 47% 12%',
  '--destructive': '5 76% 73%',
  '--destructive-foreground': '5 43% 12%',
  '--app-font-sans': 'Noto Kufi Arabic, Tahoma, sans-serif',
  '--app-font-mono': 'IBM Plex Mono, monospace',
  '--radius': '0.625rem',
} as CSSProperties;

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="operations-empty" data-testid="empty-operations">
      <span className="operations-empty-icon"><Layers3 size={19} /></span>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-6 text-[hsl(var(--muted-foreground))]">{detail}</p>
      <Link href="/settings" className="operation-link mt-5" data-testid="link-empty-settings">
        <Settings2 size={14} />
        فتح الإعدادات
      </Link>
    </div>
  );
}

function QuantityKeypad({
  value,
  onKey,
}: {
  value: string;
  onKey: (key: string) => void;
}) {
  const keypadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    keypadRef.current?.focus();
  }, []);

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'clear', '0', 'backspace'];
  return (
    <div ref={keypadRef} tabIndex={-1} className="quantity-keypad" aria-label={translateKey('quantityInputPanel')} data-testid="quantity-keypad">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-[hsl(var(--accent-foreground))]">{translateKey('quickInput')}</p>
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{translateKey('editOnlyThisSectionQuantity')}</p>
        </div>
         <span className="keypad-value" dir="ltr">{value || '0'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onKey(key)}
            className={cn('keypad-key', key === 'backspace' && 'keypad-key-muted', key === 'clear' && 'keypad-key-clear')}
            aria-label={key === 'backspace' ? 'حذف آخر رقم' : key === 'clear' ? 'مسح الكمية' : `إدخال ${key}`}
            data-testid={`keypad-${key}`}
          >
            {key === 'backspace' ? <Delete size={17} /> : key === 'clear' ? 'مسح' : key}
          </button>
        ))}
      </div>
    </div>
  );
}

function FinishOperationModal({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="dialog-backdrop fixed inset-0 z-40 flex items-end justify-center bg-[hsl(225_30%_2%/.72)] p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="dialog-panel w-full max-w-md rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl sm:rounded-2xl sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))]"><AlertTriangle size={18} /></span>
          <div>
            <p className="eyebrow">{translateKey('confirmOperation')}</p>
            <h2 className="mt-2 text-lg font-extrabold">{title}</h2>
            <p className="mt-2 text-xs leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-start gap-2">
          <button type="button" className="finish-confirm-button" onClick={onConfirm} data-testid="button-confirm-finish-operation">{confirmLabel}</button>
          <button type="button" className="finish-cancel-button" onClick={onClose} data-testid="button-cancel-finish-operation">{translateKey('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

function TransferWorkTypeModal({
  choices,
  onChoose,
  onClose,
}: {
  choices: { id: WorkChoice; name: string }[];
  onChoose: (choice: WorkChoice) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="dialog-backdrop fixed inset-0 z-40 flex items-end justify-center bg-[hsl(225_30%_2%/.72)] p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="dialog-panel w-full max-w-md rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl sm:rounded-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="transfer-work-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{translateKey('moveOperation')}</p>
            <h2 id="transfer-work-title" className="mt-2 text-lg font-extrabold">{translateKey('chooseTheWorkTypeToMoveTheOperationTo')}</h2>
            <p className="mt-2 text-xs leading-6 text-[hsl(var(--muted-foreground))]">{translateKey('theCurrentWorkWillBeSavedToTheArchiveBeforeMovingAndThe')}</p>
          </div>
          <button type="button" className="dialog-close-button shrink-0" onClick={onClose} aria-label={translateKey('closeMoveOperationWindow')} data-testid="button-close-transfer">
            <X size={17} />
          </button>
        </div>
        {choices.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-[hsl(var(--border))] p-4 text-xs text-[hsl(var(--muted-foreground))]">{translateKey('noOtherWorkTypesAreAvailableForTransfer')}</p>
        ) : (
          <div className="mt-5 grid max-h-[50dvh] gap-2 overflow-y-auto">
            {choices.map((choice) => (
              <button
                type="button"
                key={choice.id}
                className="work-pill flex w-full items-center justify-between text-right"
                onClick={() => onChoose(choice.id)}
                data-testid={`button-transfer-to-${choice.id}`}
              >
                <span>{choice.name}</span>
                <MoveRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-start">
          <button type="button" className="finish-cancel-button" onClick={onClose} data-testid="button-cancel-transfer">{translateKey('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

function MaterialChoice({
  material,
  selected,
  onSelect,
}: {
  material: Material;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn('material-choice', selected && 'material-choice-selected')}
      data-testid={`button-material-${material.id}`}
    >
      {selected && <Check size={13} strokeWidth={2.5} />}
      <span className="truncate">{material.name}</span>
      <span className="font-mono text-[10px]" dir="ltr">{formatAmount(material.price)}</span>
    </button>
  );
}

function SectionOperation({
  section,
  materials,
  entry,
  active,
  onQuantityOpen,
  onQuantityKey,
  onMaterialSelect,
}: {
  section: Section;
  materials: Map<string, Material>;
  entry: OperationEntry;
  active: boolean;
  onQuantityOpen: () => void;
  onQuantityKey: (key: string) => void;
  onMaterialSelect: (materialId: string) => void;
}) {
  const sectionMaterials = section.materialIds.map((id) => materials.get(id)).filter((item): item is Material => Boolean(item));
  const selectedMaterials = sectionMaterials.filter((material) => entry.selectedMaterialIds.includes(material.id));
  const resultBase = section.calculationMode === 'SELECT_ONE_MULTIPLY'
    ? (selectedMaterials[0]?.price ?? 0)
    : sectionMaterials.reduce((sum, material) => sum + material.price, 0);
  const result = resultBase * quantityValue(entry.quantity);
  const isSingle = section.calculationMode === 'SELECT_ONE_MULTIPLY';

  return (
    <article className="operation-card" data-testid={`card-operation-section-${section.id}`}>
      <div className="operation-card-heading">
        <div className="min-w-0">
          <p className="eyebrow">{translateKey('calculationSection')}</p>
          <h2 className="mt-1 truncate text-base font-extrabold tracking-[-.035em]">{section.name}</h2>
        </div>
        <span className="mode-tag">{isSingle ? 'اختيار واحد' : 'جمع المختار'}</span>
      </div>

      {sectionMaterials.length === 0 ? (
        <div className="safe-empty" data-testid={`empty-materials-${section.id}`}>
          <SlidersHorizontal size={15} />
          <span>{translateKey('noMaterialsAreCurrentlyAvailableForThisSection')}</span>
        </div>
      ) : isSingle ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold">{translateKey('materials')}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{translateKey('chooseOneMaterial')}</p>
          </div>
          <div className="material-choice-list">
            {sectionMaterials.map((material) => (
              <MaterialChoice
                key={material.id}
                material={material}
                selected={entry.selectedMaterialIds.includes(material.id)}
                onSelect={() => onMaterialSelect(material.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold">{translateKey('materials')}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{translateKey('definedBySectionSettings')}</p>
          </div>
          <div className="material-summary">
            {sectionMaterials.map((material) => (
              <span key={material.id} className="material-summary-item">
                <span className="truncate">{material.name}</span>
                <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]" dir="ltr">{formatAmount(material.price)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="quantity-row">
        <div>
          <p className="text-xs font-bold">{translateKey('quantity')}</p>
          <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{translateKey('tapToEnterANumber')}</p>
        </div>
        <button
          type="button"
          onClick={onQuantityOpen}
          className={cn('quantity-display', active && 'quantity-display-active')}
          aria-label={`تعديل كمية ${section.name}`}
          data-testid={`button-quantity-${section.id}`}
          dir="ltr"
        >
          {entry.quantity || '0'}
        </button>
      </div>

      {active && <QuantityKeypad value={entry.quantity} onKey={onQuantityKey} />}

      <div className="operation-result" data-testid={`result-section-${section.id}`}>
        <span>{translateKey('sectionResult')}</span>
        <strong dir="ltr">{formatAmount(result)}</strong>
      </div>
    </article>
  );
}

function WorkPicker({
  workChoices,
  onSelect,
  onOpenOrder,
}: {
  workChoices: { id: WorkChoice; name: string }[];
  onSelect: (choice: WorkChoice) => void;
  onOpenOrder: () => void;
}) {
  return (
    <section className="work-picker work-choice-screen" data-testid="work-picker">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{translateKey('chooseWorkType')}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{translateKey('chooseATemplateToStartCalculating')}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="order-operations-button" onClick={onOpenOrder} data-testid="button-open-operations-order">
          <ListOrdered size={15} />
          ترتيب العمليات
        </Button>
      </div>
      <div className="work-choice-grid">
        {workChoices.map((work) => (
          <Button
            type="button"
            key={work.id}
            onClick={() => onSelect(work.id)}
            variant="outline"
            className="work-choice-button"
            data-testid={`button-work-${work.id}`}
          >
            {work.name}
          </Button>
        ))}
      </div>
    </section>
  );
}

type OrderListItem = { id: string; label: string };

function reorderItems(items: string[], fromId: string, toId: string) {
  const fromIndex = items.indexOf(fromId);
  const toIndex = items.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function moveItem(items: string[], id: string, direction: -1 | 1) {
  const index = items.indexOf(id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function SortableOrderList({
  items,
  onChange,
  onItemOpen,
  showPositionNumbers = false,
}: {
  items: OrderListItem[];
  onChange: (ids: string[]) => void;
  onItemOpen?: (item: OrderListItem) => void;
  showPositionNumbers?: boolean;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const pointerRef = useRef<{ pointerId: number; sourceId: string } | null>(null);
  const dragOverRef = useRef<string | null>(null);
  const didDragRef = useRef(false);
  const displayItems = showPositionNumbers ? [...items].reverse() : items;
  const ids = displayItems.map((item) => item.id);
  const saveDisplayOrder = (displayOrder: string[]) => {
    onChange(showPositionNumbers ? [...displayOrder].reverse() : displayOrder);
  };

  const finishPointerDrag = () => {
    const sourceId = pointerRef.current?.sourceId;
    const targetId = dragOverRef.current;
    if (sourceId && targetId) saveDisplayOrder(reorderItems(ids, sourceId, targetId));
    pointerRef.current = null;
    dragOverRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="order-list">
      {displayItems.map((item, index) => (
        <div
          key={item.id}
          ref={(element) => {
            if (element) rowRefs.current.set(item.id, element);
            else rowRefs.current.delete(item.id);
          }}
          className={cn(
            'order-list-item',
            draggedId === item.id && 'order-list-item-dragging',
            dragOverId === item.id && draggedId !== item.id && 'order-list-item-drag-over',
          )}
          role={onItemOpen ? 'button' : undefined}
          tabIndex={onItemOpen ? 0 : undefined}
          aria-grabbed={draggedId === item.id}
          onClick={() => {
            if (onItemOpen && !didDragRef.current) onItemOpen(item);
          }}
          onKeyDown={(event) => {
            if (onItemOpen && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onItemOpen(item);
            }
          }}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest('button')) return;
            pointerRef.current = { pointerId: event.pointerId, sourceId: item.id };
            dragOverRef.current = item.id;
            didDragRef.current = false;
            setDraggedId(item.id);
            setDragOverId(item.id);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (pointerRef.current?.pointerId !== event.pointerId) return;
            if (Math.abs(event.movementY) > 3) didDragRef.current = true;
            const target = displayItems.find((candidate) => {
              const element = rowRefs.current.get(candidate.id);
              if (!element) return false;
              const rect = element.getBoundingClientRect();
              return event.clientY >= rect.top && event.clientY <= rect.bottom;
            });
            if (target) {
              dragOverRef.current = target.id;
              setDragOverId(target.id);
            }
          }}
          onPointerUp={(event) => {
            if (pointerRef.current?.pointerId !== event.pointerId) return;
            finishPointerDrag();
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={finishPointerDrag}
          data-testid={`order-item-${item.id}`}
        >
          <GripVertical size={17} className="order-drag-icon" aria-hidden="true" />
          {showPositionNumbers && (
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--primary)/.55)] bg-[hsl(var(--primary)/.16)] text-sm font-black text-[hsl(var(--primary))]"
              aria-label={`الترتيب ${displayItems.length - index}`}
              data-testid={`order-position-${item.id}`}
            >
              {displayItems.length - index <= 20
                ? String.fromCodePoint(0x2460 + displayItems.length - index - 1)
                : displayItems.length - index}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {onItemOpen && (
            <span className="order-item-open-hint" aria-hidden="true">
              <ChevronLeft size={15} />
            </span>
          )}
          <div className="order-item-actions" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="order-move-button"
              onClick={() => saveDisplayOrder(moveItem(ids, item.id, -1))}
              disabled={index === 0}
              aria-label={`تحريك ${item.label} إلى الأعلى`}
              data-testid={`button-order-up-${item.id}`}
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              className="order-move-button"
              onClick={() => saveDisplayOrder(moveItem(ids, item.id, 1))}
              disabled={index === displayItems.length - 1}
              aria-label={`تحريك ${item.label} إلى الأسفل`}
              data-testid={`button-order-down-${item.id}`}
            >
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderEditorModal({
  order,
  workItems,
  generalSectionItems,
  workSectionItems,
  onChange,
  onClose,
  onSave,
}: {
  order: OperationsOrder;
  workItems: OrderListItem[];
  generalSectionItems: OrderListItem[];
  workSectionItems: { workId: string; workLabel: string; items: OrderListItem[] }[];
  onChange: (next: OperationsOrder) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const activeWork = activeWorkId
    ? workSectionItems.find((work) => work.workId === activeWorkId)
    : undefined;

  return (
    <div className="operations-order-modal" style={ORDER_THEME_STYLE}>
      <div className="order-modal-backdrop dialog-backdrop fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <div className="order-dialog-panel w-full max-w-lg rounded-t-2xl border p-5 shadow-2xl sm:rounded-2xl sm:p-6" role="dialog" aria-modal="true" aria-label={translateKey('orderOperations')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{translateKey('customizeView')}</p>
            <h2 className="mt-2 text-lg font-extrabold">{translateKey('orderOperations')}</h2>
            <p className="mt-2 text-xs leading-6 text-[hsl(var(--muted-foreground))]">{translateKey('orderWorkTypesFirstThenOpenATypeToOrderItsSections')}</p>
          </div>
          <button type="button" className="dialog-close-button" onClick={onClose} aria-label={translateKey('close')} data-testid="button-close-operations-order">
            <X size={17} />
          </button>
        </div>

        <section className="order-editor-section">
          {activeWork ? (
            <>
              <button
                type="button"
                className="order-back-button"
                onClick={() => setActiveWorkId(null)}
                data-testid="button-back-work-order"
              >
                <ArrowRight size={16} />
                العودة إلى أنواع الأعمال
              </button>
              <div className="order-subview-heading">
                <div>
                  <p className="eyebrow">{translateKey('orderSections2')}</p>
                  <h3 className="mt-2 text-base font-extrabold">ترتيب أقسام {activeWork.workLabel}</h3>
                  <p className="mt-1 text-[10px] leading-5 text-[hsl(var(--muted-foreground))]">{translateKey("اسحب الصف كاملًا لترتيب الأقسام، أو استخدم الأسهم.")}</p>
                </div>
                <Layers3 size={18} className="text-[hsl(var(--accent-foreground))]" />
              </div>
              {activeWork.items.length === 0 ? (
                <p className="order-empty-note">{translateKey("لا توجد أقسام مرتبطة بهذا النوع بعد.")}</p>
              ) : (
                <SortableOrderList
                  items={activeWork.items}
                  showPositionNumbers
                  onChange={(sectionOrder) => onChange(
                    activeWork.workId === FREE_WORK_ORDER_ID
                      ? { ...order, sectionOrder }
                      : {
                        ...order,
                        workSectionOrders: { ...order.workSectionOrders, [activeWork.workId]: sectionOrder },
                      },
                  )}
                />
              )}
            </>
          ) : (
            <>
              <div className="order-editor-heading">
                <div>
                  <p className="text-xs font-bold">{translateKey('orderWorkTypes')}</p>
                  <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{translateKey('freeWorkIsIncludedAsAnIndependentOptionTapAnyRowToOrder')}</p>
                </div>
                <Calculator size={17} className="text-[hsl(var(--accent-foreground))]" />
              </div>
              <SortableOrderList
                items={workItems}
                onChange={(workOrder) => onChange({ ...order, workOrder })}
                onItemOpen={(item) => setActiveWorkId(item.id)}
              />
            </>
          )}
        </section>

        {!activeWork && (
          <section className="order-editor-section">
            <div className="order-editor-heading">
              <div>
                <p className="text-xs font-bold">{translateKey('orderSections')}</p>
                <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{translateKey("هذا الترتيب هو fallback لأي نوع عمل لا يملك تخصيصًا مستقلًا.")}</p>
              </div>
              <Layers3 size={17} className="text-[hsl(var(--accent-foreground))]" />
            </div>
            <SortableOrderList
              items={generalSectionItems}
              showPositionNumbers
              onChange={(sectionOrder) => onChange({ ...order, sectionOrder })}
            />
          </section>
        )}

        <div className="order-dialog-actions">
          <button type="button" className="order-save-button" onClick={onSave} data-testid="button-save-operations-order">
            <Check size={15} />
            حفظ الترتيب
          </button>
          <button type="button" className="order-cancel-button" onClick={onClose} data-testid="button-cancel-operations-order">
            إلغاء
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

function SectionProgress({
  sections,
  activeId,
  autoAdvanceEnabled,
  countdown,
  onAutoAdvanceChange,
  onPrevious,
  onNext,
}: {
  sections: Section[];
  activeId: string | null;
  autoAdvanceEnabled: boolean;
  countdown: number | null;
  onAutoAdvanceChange: (enabled: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const activeIndex = sections.findIndex((section) => section.id === activeId);
  const activeSection = activeIndex >= 0 ? sections[activeIndex] : null;
  if (!activeSection) return null;

  return (
    <section className="operation-progress" data-testid="section-picker">
      <div className="operation-progress-heading">
        <div className="min-w-0">
          <p className="operation-progress-count" data-testid="section-progress" aria-live="polite">
            {formatWesternNumber(String(activeIndex + 1))} / {formatWesternNumber(String(sections.length))}
          </p>
          <h2 className="operation-progress-title" data-testid="active-section-name">{activeSection.name}</h2>
        </div>
        <div className="auto-advance-toggle">
          <span id="auto-advance-label">{translateKey('autoAdvance')}</span>
          <Switch
            checked={autoAdvanceEnabled}
            onCheckedChange={onAutoAdvanceChange}
            aria-label={translateKey("الانتقال التلقائي بين الأقسام")}
            aria-labelledby="auto-advance-label"
            data-testid="switch-auto-advance"
          />
        </div>
      </div>
      <div className="section-navigation">
        <Button
          type="button"
          variant="outline"
          className="section-navigation-button"
          onClick={onPrevious}
          disabled={activeIndex <= 0}
          data-testid="button-previous-section"
        >
          السابق
        </Button>
        {countdown !== null && (
          <p className="auto-advance-countdown" role="status" data-testid="auto-advance-countdown">
            الانتقال خلال {countdown}...
          </p>
        )}
        <Button
          type="button"
          variant="default"
          className="section-navigation-button"
          onClick={onNext}
          disabled={activeIndex >= sections.length - 1}
          data-testid="button-next-section"
        >
          التالي
        </Button>
      </div>
    </section>
  );
}

export default function OperationsPage() {
  const [location, setLocation] = useLocation();
  const archiveEditId = location.match(/^\/operations\/edit\/([^/]+)$/)?.[1] ?? null;
  const isArchiveEditing = Boolean(archiveEditId);
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());
  const [operationOrder, setOperationOrder] = useState<OperationsOrder>(() => loadOperationsOrder(loadSettings()));
  const [archiveRecord, setArchiveRecord] = useState<ArchivedOperation | null>(null);
  const initializedArchiveIdRef = useRef<string | null>(null);
  const [archiveSaveError, setArchiveSaveError] = useState('');
  const [workNameValidationError, setWorkNameValidationError] = useState('');
  const [selectedWork, setSelectedWork] = useState<WorkChoice | null>(null);
  const [entries, setEntries] = useState<OperationEntry[]>([]);
  const [workName, setWorkName] = useState('');
  const [customerNameVisible, setCustomerNameVisible] = useState(false);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const focusCustomerNameAfterMenuCloseRef = useRef(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [includeShipping, setIncludeShipping] = useState(true);
  const [manualShippingEnabled, setManualShippingEnabled] = useState(false);
  const [manualShippingValue, setManualShippingValue] = useState('0');
  const [additionalExpensesEnabled, setAdditionalExpensesEnabled] = useState(false);
  const [additionalExpensesValue, setAdditionalExpensesValue] = useState('0');
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const [backNavigationNotice, setBackNavigationNotice] = useState('');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showTransferPicker, setShowTransferPicker] = useState(false);
  const [transferNotice, setTransferNotice] = useState('');
  const transferInProgressRef = useRef(false);
  const [showOrderEditor, setShowOrderEditor] = useState(false);
  const [draftOrder, setDraftOrder] = useState<OperationsOrder>(() => loadOperationsOrder(loadSettings()));

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (!archiveEditId) {
      if (initializedArchiveIdRef.current !== null) {
        initializedArchiveIdRef.current = null;
        setArchiveRecord(null);
        setSelectedWork(null);
        setEntries([]);
        setWorkName('');
        setCustomerNameVisible(false);
        setActiveSectionId(null);
        setIncludeShipping(true);
        setManualShippingEnabled(false);
        setManualShippingValue('0');
        setAdditionalExpensesEnabled(false);
        setAdditionalExpensesValue('0');
        setArchiveSaveError('');
        setWorkNameValidationError('');
        setBackNavigationNotice('');
      }
      return;
    }
    if (initializedArchiveIdRef.current === archiveEditId) return;
    initializedArchiveIdRef.current = archiveEditId;
    const record = getOperationFromArchive(archiveEditId);
    if (!record) {
      setLocation('/archive');
      return;
    }
    setArchiveRecord(record);
    setWorkName(record.name);
    setCustomerNameVisible(true);
    const matchingWork = settings.workTypes.find((work) => work.id === record.workTypeId)
      ?? settings.workTypes.find((work) => work.name === record.workTypeName);
    setSelectedWork(record.workTypeId ?? matchingWork?.id ?? FREE_WORK_ORDER_ID);
    setEntries(record.sections.map((section) => ({
      sectionId: section.id,
      quantity: String(section.quantity),
      selectedMaterialIds: section.selectedMaterialIds ?? section.materials.map((material) => material.id),
      materialSelectionTouched: true,
    })));
    setActiveSectionId(record.sections[0]?.id ?? null);
    setIncludeShipping(record.shipping.included);
    setManualShippingEnabled(record.shipping.mode === 'manual');
    setManualShippingValue(String(record.shipping.manualAmount));
    setAdditionalExpensesEnabled((record.additionalExpenses ?? 0) > 0);
    setAdditionalExpensesValue(String(record.additionalExpenses ?? 0));
    setArchiveSaveError('');
    setWorkNameValidationError('');
  }, [archiveEditId, settings.workTypes, setLocation]);

  useEffect(() => {
    const normalized = normalizeOperationsOrder(operationOrder, settings);
    const changed = normalized.workOrder.join('|') !== operationOrder.workOrder.join('|')
      || normalized.sectionOrder.join('|') !== operationOrder.sectionOrder.join('|');
    if (changed) setOperationOrder(normalized);
    saveOperationsOrder(normalized);
  }, [settings.sections, settings.workTypes]);

  const materialById = useMemo(() => {
    const materials = new Map(settings.materials.map((material) => [material.id, material]));
    if (archiveRecord) {
      for (const section of archiveRecord.sections) {
        const savedMaterials = section.availableMaterials
          ?? (settings.sections.some((current) => current.id === section.id) ? [] : section.materials);
        for (const material of savedMaterials) materials.set(material.id, material);
      }
    }
    return materials;
  }, [archiveRecord, settings.materials, settings.sections]);
  const sectionById = useMemo(() => {
    const sections = new Map(settings.sections.map((section) => [section.id, section]));
    if (archiveRecord) {
      for (const saved of archiveRecord.sections) {
        const current = sections.get(saved.id);
        const availableMaterials = saved.availableMaterials
          ?? (current
            ? current.materialIds.map((id) => materialById.get(id)).filter((material): material is Material => Boolean(material))
            : saved.materials);
        sections.set(saved.id, {
          id: saved.id,
          name: saved.name,
          calculationMode: saved.calculationMode ?? current?.calculationMode
            ?? (saved.materials.length > 1 ? 'SUM_SELECTED_MULTIPLY' : 'SELECT_ONE_MULTIPLY'),
          materialIds: availableMaterials.map((material) => material.id),
        });
      }
    }
    return sections;
  }, [archiveRecord, materialById, settings.sections]);
  const workById = useMemo(() => new Map(settings.workTypes.map((work) => [work.id, work])), [settings.workTypes]);
  const orderedWorkChoices = operationOrder.workOrder
    .map((id) => id === FREE_WORK_ORDER_ID ? { id: FREE_WORK_ORDER_ID, name: 'عمل حر' } : workById.get(id))
    .filter((work): work is { id: string; name: string } => Boolean(work));
  const selectedWorkRecord = selectedWork && selectedWork !== 'free'
    ? settings.workTypes.find((work) => work.id === selectedWork)
    : undefined;
  const availableSectionIds = isArchiveEditing && archiveRecord
    ? archiveRecord.sections.map((section) => section.id)
    : selectedWork === 'free'
      ? settings.sections.map((section) => section.id)
      : (selectedWorkRecord?.sectionIds ?? []);
  const availableSections = availableSectionIds
    .map((id) => sectionById.get(id))
    .filter((section): section is Section => Boolean(section));
  const sectionOrderIndex = useMemo(() => {
    if (selectedWork && selectedWork !== FREE_WORK_ORDER_ID) {
      return new Map(getSectionOrderForWork(operationOrder, selectedWork, selectedWorkRecord?.sectionIds ?? []).map((id, index) => [id, index]));
    }
    return new Map(operationOrder.sectionOrder.map((id, index) => [id, index]));
  }, [operationOrder, selectedWork, selectedWorkRecord?.sectionIds]);
  const orderedAvailableSections = [...availableSections].sort((a, b) => (sectionOrderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (sectionOrderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  const activeSection = activeSectionId ? sectionById.get(activeSectionId) : undefined;
  const visibleSections = activeSection ? [activeSection] : [];
  const getShippingReference = (sectionId: string) => {
    const archivedSection = isArchiveEditing ? archiveRecord?.sections.find((section) => section.id === sectionId) : undefined;
    if (archivedSection && Object.prototype.hasOwnProperty.call(archivedSection, 'shippingReference')) {
      return archivedSection.shippingReference ?? null;
    }
    return settings.shippingExpenses.find((item) => item.sectionId === sectionId) ?? null;
  };
  const sectionTotal = entries.reduce((total, entry) => {
    const section = sectionById.get(entry.sectionId);
    if (!section) return total;
    const selected = section.materialIds
      .map((id) => materialById.get(id))
      .filter((item): item is Material => item !== undefined && entry.selectedMaterialIds.includes(item.id));
    const base = section.calculationMode === 'SELECT_ONE_MULTIPLY'
      ? (selected[0]?.price ?? 0)
      : section.materialIds
        .map((id) => materialById.get(id))
        .filter((item): item is Material => item !== undefined)
        .reduce((sum, material) => sum + material.price, 0);
    return total + base * quantityValue(entry.quantity);
  }, 0);
  const calculatedShippingTotal = Math.round(entries.reduce((total, entry) => {
    const reference = getShippingReference(entry.sectionId);
    if (!reference) return total;
    return total + calculateShippingExpense(reference.referenceCost, reference.referenceQuantity, quantityValue(entry.quantity));
  }, 0));
  const manualShippingAmount = Number(formatWesternNumber(manualShippingValue).replace(/,/g, ''));
  const shippingTotal = resolveShippingExpense(
    calculatedShippingTotal,
    manualShippingEnabled,
    manualShippingAmount,
    includeShipping,
  );
  const additionalExpensesAmount = additionalExpensesEnabled ? Math.max(0, Number(formatWesternNumber(additionalExpensesValue).replace(/,/g, '')) || 0) : 0;
  const finalTotal = sectionTotal + shippingTotal + additionalExpensesAmount;
  const hasStartedOperation = entries.some((entry) => (
    quantityValue(entry.quantity) > 0 || (entry.materialSelectionTouched && entry.selectedMaterialIds.length > 0)
  ))
    || !includeShipping
    || manualShippingEnabled
    || (Number.isFinite(manualShippingAmount) && manualShippingAmount !== 0)
    || additionalExpensesEnabled
    || additionalExpensesAmount !== 0;

  const focusCustomerName = (afterMenuClose = false) => {
    focusCustomerNameAfterMenuCloseRef.current = afterMenuClose;
    setCustomerNameVisible(true);
    setWorkNameValidationError(CUSTOMER_NAME_REQUIRED_MESSAGE);
    customerNameInputRef.current?.focus();
  };

  useEffect(() => {
    if (workNameValidationError) customerNameInputRef.current?.focus();
  }, [workNameValidationError]);

  const cancelAutoAdvance = () => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearInterval(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);
  };

  const updateEntry = (sectionId: string, update: (entry: OperationEntry) => OperationEntry) => {
    setEntries((current) => current.map((entry) => entry.sectionId === sectionId ? update(entry) : entry));
  };

  const selectWork = (choice: WorkChoice) => {
    if (choice === selectedWork) return;
    if (hasStartedOperation && !workName.trim()) {
      focusCustomerName();
      return;
    }
    setWorkNameValidationError('');
    setBackNavigationNotice('');
    cancelAutoAdvance();
    setAutoAdvanceEnabled(true);
    setSelectedWork(choice);
    setEntries([]);
    setActiveSectionId(null);
    setIncludeShipping(true);
    setManualShippingEnabled(false);
    setManualShippingValue('0');
    setAdditionalExpensesEnabled(false);
    setAdditionalExpensesValue('0');
  };

  const returnToWorkChoices = () => {
    if (isArchiveEditing || !selectedWork) return;
    cancelAutoAdvance();
    if (hasStartedOperation) {
      if (!workName.trim()) focusCustomerName();
      else setBackNavigationNotice('أكمل العملية أو انقلها قبل الرجوع إلى اختيار نوع العمل.');
      return;
    }
    setBackNavigationNotice('');
    setWorkNameValidationError('');
    if (!workName.trim()) setCustomerNameVisible(false);
    setSelectedWork(null);
    setEntries([]);
    setActiveSectionId(null);
    setIncludeShipping(true);
    setManualShippingEnabled(false);
    setManualShippingValue('0');
    setAdditionalExpensesEnabled(false);
    setAdditionalExpensesValue('0');
  };

  const selectSection = (sectionId: string) => {
    const section = sectionById.get(sectionId);
    if (!section) return;
    cancelAutoAdvance();
    setEntries((current) => current.some((entry) => entry.sectionId === sectionId)
      ? current
      : [...current, {
        sectionId,
        quantity: '0',
        selectedMaterialIds: section.calculationMode === 'SELECT_ONE_MULTIPLY' && section.materialIds[0] ? [section.materialIds[0]] : [],
      }]);
    setBackNavigationNotice('');
    setActiveSectionId(sectionId);
  };

  useEffect(() => {
    if (selectedWork && !activeSectionId && orderedAvailableSections.length > 0 && !isArchiveEditing) {
      selectSection(orderedAvailableSections[0].id);
    }
  }, [activeSectionId, isArchiveEditing, orderedAvailableSections, selectedWork]);

  const scheduleAutoAdvance = (sectionId: string) => {
    cancelAutoAdvance();
    if (!autoAdvanceEnabled) return;
    const currentIndex = orderedAvailableSections.findIndex((section) => section.id === sectionId);
    const nextSection = currentIndex >= 0 ? orderedAvailableSections[currentIndex + 1] : undefined;
    if (!nextSection) return;

    let secondsRemaining = 3;
    setAutoAdvanceCountdown(secondsRemaining);
    autoAdvanceTimerRef.current = window.setInterval(() => {
      secondsRemaining -= 1;
      if (secondsRemaining <= 0) {
        if (autoAdvanceTimerRef.current !== null) {
          window.clearInterval(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
        setAutoAdvanceCountdown(null);
        selectSection(nextSection.id);
        return;
      }
      setAutoAdvanceCountdown(secondsRemaining);
    }, 1000);
  };

  const handleQuantityKey = (sectionId: string, key: string) => {
    const currentEntry = entries.find((entry) => entry.sectionId === sectionId);
    const nextQuantity = appendQuantityKey(currentEntry?.quantity ?? '', key);
    updateEntry(sectionId, (current) => ({ ...current, quantity: nextQuantity }));
    cancelAutoAdvance();
    if (/^\d$/.test(key) && quantityValue(nextQuantity) > 0) {
      scheduleAutoAdvance(sectionId);
    }
  };

  const navigateSection = (direction: -1 | 1) => {
    cancelAutoAdvance();
    const currentIndex = orderedAvailableSections.findIndex((section) => section.id === activeSectionId);
    const target = orderedAvailableSections[currentIndex + direction];
    if (target) selectSection(target.id);
  };

  useEffect(() => {
    if (!autoAdvanceEnabled || !selectedWork || showFinishConfirm || showTransferPicker || showOrderEditor) {
      cancelAutoAdvance();
    }
  }, [autoAdvanceEnabled, selectedWork, showFinishConfirm, showTransferPicker, showOrderEditor]);

  useEffect(() => () => {
    if (autoAdvanceTimerRef.current !== null) window.clearInterval(autoAdvanceTimerRef.current);
  }, []);

  useEffect(() => {
    const handleKeyboardInput = (event: KeyboardEvent) => {
      if (!activeSectionId || !selectedWork || showFinishConfirm || showTransferPicker || showOrderEditor) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        handleQuantityKey(activeSectionId, event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleQuantityKey(activeSectionId, 'backspace');
      }
    };

    window.addEventListener('keydown', handleKeyboardInput);
    return () => window.removeEventListener('keydown', handleKeyboardInput);
  }, [activeSectionId, handleQuantityKey, selectedWork, showFinishConfirm, showTransferPicker, showOrderEditor]);

  const buildArchivedDraft = (): ArchivedOperationDraft => {
    const archivedSections = entries.flatMap((entry) => {
      const section = sectionById.get(entry.sectionId);
      if (!section) return [];
      const sectionMaterials = section.materialIds
        .map((id) => materialById.get(id))
        .filter((material): material is Material => Boolean(material));
      const usedMaterials = section.calculationMode === 'SELECT_ONE_MULTIPLY'
        ? sectionMaterials.filter((material) => entry.selectedMaterialIds.includes(material.id))
        : sectionMaterials;
      const resultBase = section.calculationMode === 'SELECT_ONE_MULTIPLY'
        ? (usedMaterials[0]?.price ?? 0)
        : sectionMaterials.reduce((sum, material) => sum + material.price, 0);
      const shippingReference = getShippingReference(section.id);
      return [{
        id: section.id,
        name: section.name,
        quantity: quantityValue(entry.quantity),
        materials: usedMaterials.map((material) => ({
          id: material.id,
          name: material.name,
          price: material.price,
        })),
        result: resultBase * quantityValue(entry.quantity),
        calculationMode: section.calculationMode,
        selectedMaterialIds: [...entry.selectedMaterialIds],
        availableMaterials: sectionMaterials.map((material) => ({
          id: material.id,
          name: material.name,
          price: material.price,
        })),
        shippingReference: shippingReference
          ? { referenceQuantity: shippingReference.referenceQuantity, referenceCost: shippingReference.referenceCost }
          : null,
      }];
    });
    const draft: ArchivedOperationDraft = {
      name: workName,
      workTypeName: isArchiveEditing && archiveRecord
        ? archiveRecord.workTypeName
        : selectedWork === FREE_WORK_ORDER_ID
        ? 'عمل حر'
        : selectedWork
          ? (workById.get(selectedWork)?.name ?? (archiveRecord?.workTypeId === selectedWork ? archiveRecord.workTypeName : null))
          : null,
      workTypeId: isArchiveEditing && archiveRecord
        ? archiveRecord.workTypeId ?? null
        : selectedWork && selectedWork !== FREE_WORK_ORDER_ID ? selectedWork : null,
      sections: archivedSections,
      sectionTotal,
      shipping: {
        amount: shippingTotal,
        automaticAmount: calculatedShippingTotal,
        manualAmount: manualShippingEnabled && Number.isFinite(manualShippingAmount) && manualShippingAmount >= 0
          ? Math.round(manualShippingAmount)
          : 0,
        mode: manualShippingEnabled ? 'manual' : 'automatic',
        included: includeShipping,
      },
      additionalExpenses: additionalExpensesAmount,
      finalTotal,
    };
    return draft;
  };

  const openTransferPicker = () => {
    cancelAutoAdvance();
    if (!workName.trim()) {
      focusCustomerName(true);
      return;
    }
    setWorkNameValidationError('');
    setTransferNotice('');
    setShowTransferPicker(true);
  };

  const transferToWork = (targetWork: WorkChoice) => {
    if (transferInProgressRef.current || !selectedWork || targetWork === selectedWork) return;
    cancelAutoAdvance();
    if (!workName.trim()) {
      setShowTransferPicker(false);
      focusCustomerName();
      return;
    }
    transferInProgressRef.current = true;
    try {
      const savedSource = isArchiveEditing ? archiveRecord : saveOperationToArchive(buildArchivedDraft());
      if (!savedSource) {
        setShowTransferPicker(false);
        setTransferNotice('تعذر حفظ نسخة العملية الحالية؛ لم يتم نقلها.');
        return;
      }

      const targetWorkRecord = targetWork === FREE_WORK_ORDER_ID ? undefined : workById.get(targetWork);
      const targetSectionIds = targetWork === FREE_WORK_ORDER_ID
        ? operationOrder.sectionOrder.filter((id) => sectionById.has(id))
        : getSectionOrderForWork(operationOrder, targetWork, targetWorkRecord?.sectionIds ?? [])
          .filter((id) => sectionById.has(id));
      const transfer = transferEntriesByPosition({
        sourceSectionIds: orderedAvailableSections.map((section) => section.id),
        targetSectionIds,
        sectionsById: sectionById,
        entries,
      });
      const targetName = orderedWorkChoices.find((choice) => choice.id === targetWork)?.name ?? 'نوع العمل المحدد';
      const issueMessages = transfer.issues.map((issue: TransferIssue) => {
        if (issue.type === 'incompatible') {
          return `تعذر نقل القسم رقم ${issue.position} (${issue.sourceName} إلى ${issue.targetName}) لأن طريقة الحساب غير متوافقة.`;
        }
        if (issue.type === 'missing-target') {
          return `لم يُنقل القسم رقم ${issue.position} (${issue.sourceName}) لعدم وجود موضع مقابل؛ بياناته محفوظة في سجل المصدر بالأرشيف.`;
        }
        return issue.fallback
          ? `لم تتوفر مادة القسم المحددة في الموضع رقم ${issue.position}؛ استُخدمت المادة الافتراضية في ${issue.targetName}.`
          : `لم تتوفر المادة المحددة للقسم ${issue.targetName} في الموضع رقم ${issue.position}؛ تُرك اختيار المادة فارغًا.`;
      });
      if (transfer.unfilledTargetPositions.length > 0) {
        issueMessages.push(`الأقسام في المواضع ${transfer.unfilledTargetPositions.join('، ')} لا يقابلها مصدر وبقيت فارغة.`);
      }

      setSelectedWork(targetWork);
      setEntries(transfer.entries.map((entry) => ({
        ...entry,
        materialSelectionTouched: entry.selectedMaterialIds.length > 0,
      })));
      setActiveSectionId(transfer.entries[0]?.sectionId ?? null);
      setWorkNameValidationError('');
      setShowTransferPicker(false);
      setTransferNotice(`نُقلت العملية إلى ${targetName}، وحُفظت نسخة ${savedSource.workTypeName ?? 'العمل السابق'} في الأرشيف.${issueMessages.length ? ` ${issueMessages.join(' ')}` : ''}`);
    } catch {
      setShowTransferPicker(false);
      setTransferNotice('تعذر حفظ نسخة العملية الحالية؛ لم يتم نقلها.');
    } finally {
      transferInProgressRef.current = false;
    }
  };

  const finishOperation = () => {
    cancelAutoAdvance();
    if (isArchiveEditing && !archiveRecord) return;
    if (!workName.trim()) {
      focusCustomerName();
      setShowFinishConfirm(false);
      return;
    }
    const draft = buildArchivedDraft();
    if (isArchiveEditing && archiveRecord) {
      const updated = updateOperationInArchive(archiveRecord.id, draft);
      if (!updated) {
        setArchiveSaveError('تعذر تحديث السجل؛ ربما انتهت مدة الاحتفاظ به. ارجع إلى الأرشيف للتحقق.');
        setShowFinishConfirm(false);
        return;
      }
      setLocation('/archive');
      return;
    }
    saveOperationToArchive(draft);
    setSelectedWork(null);
    setEntries([]);
    setWorkName('');
    setCustomerNameVisible(false);
    setActiveSectionId(null);
    setIncludeShipping(true);
    setManualShippingEnabled(false);
    setManualShippingValue('0');
    setShowFinishConfirm(false);
    setWorkNameValidationError('');
    setBackNavigationNotice('');
  };

  const requestFinishOperation = (fromMenu = false) => {
    cancelAutoAdvance();
    if (!workName.trim()) {
      focusCustomerName(fromMenu);
      return;
    }
    setWorkNameValidationError('');
    setShowFinishConfirm(true);
  };

  const openOrderEditor = () => {
    cancelAutoAdvance();
    setDraftOrder(operationOrder);
    setShowOrderEditor(true);
  };

  const saveOrder = () => {
    const normalized = normalizeOperationsOrder(draftOrder, settings);
    setOperationOrder(normalized);
    saveOperationsOrder(normalized);
    setShowOrderEditor(false);
  };

  const orderWorkItems = draftOrder.workOrder
    .map((id) => id === FREE_WORK_ORDER_ID ? { id: FREE_WORK_ORDER_ID, label: 'عمل حر' } : workById.get(id) ? { id, label: workById.get(id)!.name } : null)
    .filter((item): item is OrderListItem => Boolean(item));
  const orderSectionItems = draftOrder.sectionOrder
    .map((id) => sectionById.get(id) ? { id, label: sectionById.get(id)!.name } : null)
    .filter((item): item is OrderListItem => Boolean(item));
  const orderWorkSectionItems = orderWorkItems.map((workItem) => {
    const work = workItem.id === FREE_WORK_ORDER_ID
      ? undefined
      : workById.get(workItem.id);
    const sectionIds = workItem.id === FREE_WORK_ORDER_ID
      ? draftOrder.sectionOrder
      : getSectionOrderForWork(draftOrder, workItem.id, work?.sectionIds ?? []);
    return {
      workId: workItem.id,
      workLabel: workItem.label,
      items: sectionIds
        .map((id) => sectionById.get(id) ? { id, label: sectionById.get(id)!.name } : null)
        .filter((item): item is OrderListItem => Boolean(item)),
    };
  });

  const noWorkTypes = settings.workTypes.length === 0;
  const noSectionsForWork = Boolean(selectedWork && selectedWork !== 'free' && availableSections.length === 0);
  const hasCurrentOperation = Boolean(selectedWork) || entries.length > 0;
  const finishOperationButton = (
    <Button
      type="button"
      className="finish-operation-fab"
      onClick={() => requestFinishOperation()}
      data-testid="button-finish-operation"
    >
      <Check size={16} aria-hidden="true" />
      {isArchiveEditing ? 'حفظ التعديلات' : 'إنهاء العملية'}
    </Button>
  );

  return (
    <div className="paper-noise min-h-[100dvh] bg-[hsl(var(--background))]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-3xl px-4 pb-32 sm:px-6 lg:px-8">
        <header className={cn('operations-header', selectedWork && 'operations-header-active')}>
          {selectedWork ? (
            <div className="operation-toolbar">
              {!isArchiveEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="operation-back-button"
                  onClick={returnToWorkChoices}
                  aria-label={translateKey('backToWorkTypeSelection')}
                  data-testid="button-back-work-choice"
                >
                  <ChevronLeft size={15} />
                  رجوع
                </Button>
              )}
              <div className="min-w-0 flex-1">
                <p className="eyebrow">{isArchiveEditing ? 'تعديل عملية محفوظة' : 'العمل الحالي'}</p>
                <h1 className="operation-toolbar-title" data-testid="current-work-title">
                  {selectedWork === FREE_WORK_ORDER_ID ? 'عمل حر' : selectedWorkRecord?.name ?? archiveRecord?.workTypeName ?? 'نوع العمل'}
                </h1>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="operation-menu-button" aria-label={translateKey('operationActions')} data-testid="button-open-operation-menu">
                    <MoreVertical size={17} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onCloseAutoFocus={(event) => {
                    if (!focusCustomerNameAfterMenuCloseRef.current) return;
                    event.preventDefault();
                    focusCustomerNameAfterMenuCloseRef.current = false;
                    window.setTimeout(() => customerNameInputRef.current?.focus(), 0);
                  }}
                >
                  <DropdownMenuItem onSelect={openTransferPicker} data-testid="button-transfer-operation">
                    <MoveRight size={15} />
                    نقل العملية
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => requestFinishOperation(true)} data-testid="button-finish-operation-menu">
                    <Check size={15} />
                    {isArchiveEditing ? 'حفظ التعديلات' : 'إنهاء العملية'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={openOrderEditor} data-testid="button-open-operations-order">
                    <ListOrdered size={15} />
                    ترتيب العمليات
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[10px] font-medium text-[hsl(var(--accent-foreground))]">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.13)]"><Calculator size={14} /></span>
                  <span>{translateKey('operationCalculator')}</span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-[-.06em] sm:text-3xl">{isArchiveEditing ? 'تعديل عملية محفوظة' : 'اختر نوع العمل'}</h1>
                <p className="mt-2 max-w-md text-xs leading-6 text-[hsl(var(--muted-foreground))]">
                  {isArchiveEditing ? 'عدّل مدخلات السجل، وستُعاد جميع النتائج تلقائيًا قبل حفظه في الأرشيف.' : 'اختر نوع العمل للبدء مباشرة.'}
                </p>
              </div>
              {!isArchiveEditing && (
                <Link href="/settings" className="settings-link" data-testid="link-settings">
                  <Settings2 size={15} />
                  <span className="hidden sm:inline">{translateKey('settings')}</span>
                </Link>
              )}
            </div>
          )}
        </header>

        <main>
          <>
            {noWorkTypes && !isArchiveEditing && (
              <div className="operations-notice" data-testid="notice-no-work-types">
                <span>{translateKey("لا توجد أنواع أعمال محفوظة. يمكنك استخدام «عمل حر» أو فتح الإعدادات لإنشاء قالب.")}</span>
                <Link href="/settings" className="operation-link" data-testid="link-notice-settings">
                  <Settings2 size={14} />
                  الإعدادات
                </Link>
              </div>
            )}
            {(isArchiveEditing || customerNameVisible || workName.trim() || workNameValidationError) && (
              <section className="customer-name-panel" data-testid="current-work-name">
                <label htmlFor="input-current-work-name" className="eyebrow">{translateKey('customerName')}</label>
                <input
                  id="input-current-work-name"
                  ref={customerNameInputRef}
                  type="text"
                  className="field-input mt-2"
                  value={workName}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setWorkName(nextName);
                    if (nextName.trim()) {
                      setWorkNameValidationError('');
                      setBackNavigationNotice('');
                    }
                  }}
                  placeholder={translateKey('exampleAhmed')}
                  autoComplete="off"
                  aria-invalid={Boolean(workNameValidationError)}
                  aria-describedby={workNameValidationError ? 'work-name-validation-error' : undefined}
                  data-testid="input-current-work-name"
                />
              </section>
            )}
            {workNameValidationError && (
              <div id="work-name-validation-error" className="operations-notice mt-3" role="alert" data-testid="work-name-validation-error">
                {workNameValidationError}
              </div>
            )}
            {backNavigationNotice && (
              <div className="operations-notice mt-3" role="status" data-testid="back-navigation-notice">
                {backNavigationNotice}
              </div>
            )}
            {!isArchiveEditing && !selectedWork && (
              <WorkPicker
                workChoices={orderedWorkChoices}
                onSelect={selectWork}
                onOpenOrder={openOrderEditor}
              />
            )}

            {archiveSaveError && <div className="operations-notice" role="alert" data-testid="archive-edit-error">{archiveSaveError}</div>}
            {transferNotice && <div className="operations-notice" role="status" data-testid="transfer-notice">{transferNotice}</div>}

              {selectedWork && orderedAvailableSections.length > 0 && (
                <SectionProgress
                  sections={orderedAvailableSections}
                  activeId={activeSectionId}
                  autoAdvanceEnabled={autoAdvanceEnabled}
                  countdown={autoAdvanceCountdown}
                  onAutoAdvanceChange={(enabled) => {
                    setAutoAdvanceEnabled(enabled);
                    if (!enabled) cancelAutoAdvance();
                  }}
                  onPrevious={() => navigateSection(-1)}
                  onNext={() => navigateSection(1)}
                />
              )}

              {selectedWork && (noSectionsForWork || orderedAvailableSections.length === 0) ? (
                <EmptyState title="لا توجد أقسام لهذا العمل" detail="اربط قسمًا بنوع العمل من الإعدادات، ثم عد إلى الحاسبة." />
              ) : selectedWork && entries.length === 0 ? (
                <EmptyState title="جارٍ تجهيز القسم الأول" detail="ستظهر بيانات القسم الحالي هنا." />
              ) : selectedWork ? (
                <div className="mt-3 space-y-2">
                  {visibleSections.map((section) => {
                    const entry = entries.find((item) => item.sectionId === section.id);
                    if (!entry) return null;
                    return (
                      <SectionOperation
                        key={section.id}
                        section={section}
                        materials={materialById}
                        entry={entry}
                        active={activeSectionId === section.id}
                        onQuantityOpen={() => {
                          cancelAutoAdvance();
                          setActiveSectionId(section.id);
                        }}
                        onQuantityKey={(key) => handleQuantityKey(section.id, key)}
                        onMaterialSelect={(materialId) => {
                          cancelAutoAdvance();
                          updateEntry(section.id, (current) => {
                            if (section.calculationMode === 'SELECT_ONE_MULTIPLY') return { ...current, selectedMaterialIds: [materialId], materialSelectionTouched: true };
                            const selected = current.selectedMaterialIds.includes(materialId);
                            return { ...current, selectedMaterialIds: selected ? current.selectedMaterialIds.filter((id) => id !== materialId) : [...current.selectedMaterialIds, materialId], materialSelectionTouched: true };
                          });
                        }}
                      />
                    );
                  })}
                </div>
              ) : null}

              {selectedWork && visibleSections.length > 0 && (
                <>
                  <div className="shipping-total" data-testid="shipping-expenses-total">
                    <span>{translateKey('shippingExpense')}</span>
                    <strong dir="ltr">{formatWesternNumber(Math.round(shippingTotal).toLocaleString('en-US'))}</strong>
                  </div>
                  <label className="shipping-option" data-testid="shipping-expenses-toggle">
                    <input
                      type="checkbox"
                      checked={includeShipping}
                      onChange={(event) => {
                        cancelAutoAdvance();
                        setIncludeShipping(event.target.checked);
                      }}
                      data-testid="checkbox-include-shipping"
                    />
                    <span>{translateKey('includeShippingExpense')}</span>
                  </label>
                  <label className="shipping-option" data-testid="manual-shipping-toggle">
                    <input
                      type="checkbox"
                      checked={manualShippingEnabled}
                      onChange={(event) => {
                        cancelAutoAdvance();
                        setManualShippingEnabled(event.target.checked);
                      }}
                      data-testid="checkbox-manual-shipping"
                    />
                    <span>{translateKey('editShippingExpenseManually')}</span>
                  </label>
                  {manualShippingEnabled && (
                    <div className="mt-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] p-3" data-testid="manual-shipping-input-wrap">
                      <label htmlFor="input-manual-shipping" className="text-xs font-bold">{translateKey('shippingExpenseForThisOperation')}</label>
                      <input
                        id="input-manual-shipping"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        dir="ltr"
                        className="field-input mt-2 text-left font-mono"
                        value={manualShippingValue}
                        onChange={(event) => {
                          cancelAutoAdvance();
                          setManualShippingValue(event.target.value);
                        }}
                        data-testid="input-manual-shipping"
                      />
                      <p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                        الحساب التلقائي الحالي: <span className="font-mono" dir="ltr">{formatWesternNumber(calculatedShippingTotal.toLocaleString('en-US'))}</span>. هذا التعديل لهذه العملية فقط.
                      </p>
                    </div>
                  )}
                  <div className="mt-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] p-3" data-testid="additional-expenses">
                    <div className="flex items-center justify-between gap-3">
                      <label className="shipping-option m-0 flex-1">
                        <input type="checkbox" checked={additionalExpensesEnabled} onChange={(event) => { cancelAutoAdvance(); const enabled = event.target.checked; setAdditionalExpensesEnabled(enabled); if (!enabled) setAdditionalExpensesValue('0'); }} data-testid="checkbox-additional-expenses" />
                        <span>{translateKey('additionalExpenses')}</span>
                      </label>
                      <strong className="font-mono text-xs" dir="ltr">{formatWesternNumber(additionalExpensesAmount.toLocaleString('en-US'))}</strong>
                    </div>
                    {additionalExpensesEnabled && (
                      <div className="mt-2">
                        <label htmlFor="input-additional-expenses" className="text-xs font-bold">{translateKey('additionalExpenseForThisOperation2')}</label>
                        <input id="input-additional-expenses" type="text" inputMode="decimal" dir="ltr" className="field-input mt-2 text-left font-mono" value={additionalExpensesValue} onChange={(event) => { cancelAutoAdvance(); setAdditionalExpensesValue(event.target.value); }} data-testid="input-additional-expenses" />
                      </div>
                    )}
                  </div>
                  <div className="final-total" data-testid="final-total">
                    <div className="final-total-summary">
                      <div>
                        <p className="eyebrow">{translateKey('operationTotal')}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{translateKey('currentSectionResultsShippingExpense')}</p>
                      </div>
                      <strong dir="ltr">{formatAmount(finalTotal)}</strong>
                    </div>
                    {hasCurrentOperation && finishOperationButton}
                  </div>
                </>
              )}
              {hasCurrentOperation && visibleSections.length === 0 && (
                <div className="operation-finish-wrap">{finishOperationButton}</div>
              )}
          </>
        </main>
      </div>
      <AppBottomNav />
      {showFinishConfirm && (
        <FinishOperationModal
          title={isArchiveEditing ? 'هل تريد حفظ تعديلات هذا السجل؟' : 'هل تريد إنهاء العملية الحالية؟'}
          description={isArchiveEditing
            ? 'سيُحدّث السجل الحالي في الأرشيف ويبدأ احتساب مدة الاحتفاظ به لثلاثة أيام من جديد.'
            : 'إذا أضفت اسمًا للعمل فسيُحفظ ملخصه في الأرشيف. ستُصفّر الكميات والنتائج وتُزال الأقسام المؤقتة.'}
          confirmLabel={isArchiveEditing ? 'حفظ التعديلات' : 'إنهاء العملية'}
          onClose={() => setShowFinishConfirm(false)}
          onConfirm={finishOperation}
        />
      )}
      {showTransferPicker && selectedWork && (
        <TransferWorkTypeModal
          choices={orderedWorkChoices.filter((choice) => choice.id !== selectedWork)}
          onChoose={transferToWork}
          onClose={() => setShowTransferPicker(false)}
        />
      )}
      {showOrderEditor && (
        <OrderEditorModal
          order={draftOrder}
          workItems={orderWorkItems}
          generalSectionItems={orderSectionItems}
          workSectionItems={orderWorkSectionItems}
          onChange={setDraftOrder}
          onClose={() => setShowOrderEditor(false)}
          onSave={saveOrder}
        />
      )}
    </div>
  );
}
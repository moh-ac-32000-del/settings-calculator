from pathlib import Path
def patch(path, old, new):
    p=Path(path); s=p.read_text(encoding="utf-8")
    if new in s: return
    if old not in s:
        print("Skipping missing anchor:", path)
        return
    p.write_text(s.replace(old,new,1),encoding="utf-8")

patch("src/lib/operations-archive-store.ts","  finalTotal: number;\n};","  additionalExpenses?: number;\n  finalTotal: number;\n};")
patch("src/lib/operations-archive-store.ts","    && shipping !== undefined\n","    && (record.additionalExpenses === undefined || (typeof record.additionalExpenses === 'number' && Number.isFinite(record.additionalExpenses) && record.additionalExpenses >= 0))\n    && shipping !== undefined\n")
patch("src/pages/operations-page.tsx","  const [manualShippingValue, setManualShippingValue] = useState('0');\n","  const [manualShippingValue, setManualShippingValue] = useState('0');\n  const [additionalExpensesValue, setAdditionalExpensesValue] = useState('0');\n")
patch("src/pages/operations-page.tsx","    setManualShippingValue(String(record.shipping.manualAmount));\n","    setManualShippingValue(String(record.shipping.manualAmount));\n    setAdditionalExpensesValue(String(record.additionalExpenses ?? 0));\n")
patch("src/pages/operations-page.tsx","        setManualShippingValue('0');\n","        setManualShippingValue('0');\n        setAdditionalExpensesValue('0');\n")
patch("src/pages/operations-page.tsx","  const finalTotal = sectionTotal + shippingTotal;\n","  const additionalExpensesAmount = Math.max(0, Number(formatWesternNumber(additionalExpensesValue).replace(/,/g, '')) || 0);\n  const finalTotal = sectionTotal + shippingTotal + additionalExpensesAmount;\n")
patch("src/pages/operations-page.tsx","    || (Number.isFinite(manualShippingAmount) && manualShippingAmount !== 0);\n","    || (Number.isFinite(manualShippingAmount) && manualShippingAmount !== 0)\n    || additionalExpensesAmount !== 0;\n")
patch("src/pages/operations-page.tsx","        included: includeShipping,\n      },\n      finalTotal,\n","        included: includeShipping,\n      },\n      additionalExpenses: additionalExpensesAmount,\n      finalTotal,\n")
patch("src/pages/operations-page.tsx",'                  <div className="final-total" data-testid="final-total">','''                  <div className="mt-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] p-3" data-testid="additional-expenses">
                    <div className="flex items-center justify-between gap-3">
                      <label className="shipping-option m-0 flex-1">
                        <input type="checkbox" checked={additionalExpensesAmount > 0} onChange={(event) => { cancelAutoAdvance(); if (!event.target.checked) setAdditionalExpensesValue('0'); }} data-testid="checkbox-additional-expenses" />
                        <span>مصاريف إضافية</span>
                      </label>
                      <strong className="font-mono text-xs" dir="ltr">{formatWesternNumber(additionalExpensesAmount.toLocaleString('en-US'))}</strong>
                    </div>
                    {(additionalExpensesAmount > 0 || additionalExpensesValue !== '0') && (
                      <div className="mt-2">
                        <label htmlFor="input-additional-expenses" className="text-xs font-bold">قيمة المصاريف الإضافية لهذه العملية</label>
                        <input id="input-additional-expenses" type="text" inputMode="decimal" dir="ltr" className="field-input mt-2 text-left font-mono" value={additionalExpensesValue} onChange={(event) => { cancelAutoAdvance(); setAdditionalExpensesValue(event.target.value); }} data-testid="input-additional-expenses" />
                      </div>
                    )}
                  </div>
                  <div className="final-total" data-testid="final-total">''')

patch("src/pages/archive-page.tsx","import { Archive, ChevronDown, Clock3, Layers3, Pencil, Search } from 'lucide-react';","import { Archive, ChevronDown, Clock3, Layers3, Pencil, Search, Share2 } from 'lucide-react';")
patch("src/pages/archive-page.tsx","function formatArchiveTime(timestamp: number) {",'''function buildWhatsAppMessage(record: ArchivedOperation) {
  const lines = ["اسم العمل: " + record.name];
  if (record.workTypeName) lines.push("نوع العمل: " + record.workTypeName);
  lines.push("", "المواد والأقسام:");
  for (const section of record.sections) {
    lines.push(section.name + " — الكمية: " + formatWesternNumber(section.quantity) + " — المجموع: " + formatAmount(section.result));
    for (const material of section.materials) lines.push("  " + material.name + ": " + formatAmount(material.price));
  }
  if (record.shipping.included) lines.push("", "مصاريف الشحن: " + formatWesternNumber(record.shipping.amount));
  if ((record.additionalExpenses ?? 0) > 0) lines.push("مصاريف إضافية: " + formatWesternNumber(record.additionalExpenses ?? 0));
  lines.push("المجموع النهائي: " + formatAmount(record.finalTotal));
  return lines.join("\n");
}

function formatArchiveTime(timestamp: number) {''')
patch("src/pages/archive-page.tsx",'                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-3 text-xs">','''                  {(record.additionalExpenses ?? 0) > 0 && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-[hsl(var(--muted-foreground))]">مصاريف إضافية</span>
                      <strong className="font-mono" dir="ltr">{formatWesternNumber(record.additionalExpenses ?? 0)}</strong>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-3 text-xs">''')
patch("src/pages/archive-page.tsx",'''                <Link
                  href={''','''                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                  href={''')
patch("src/pages/archive-page.tsx",
      "                  تعديل العملية\\n                </Link>",
      '''                  تعديل العملية
                  </Link>
                  <button type="button" className="operation-link flex-1" onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(buildWhatsAppMessage(record)), "_blank", "noopener,noreferrer")} data-testid="button-share-whatsapp"><Share2 size={14} />مشاركة واتساب</button>
                </div>''')

Path("src/lib/language-store.ts").write_text("""export type AppLanguage = 'ar' | 'tr' | 'en';
export const LANGUAGE_STORAGE_KEY = 'settings-calculator-language';
export function loadLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'ar';
  const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return value === 'tr' || value === 'en' ? value : 'ar';
}
export function saveLanguage(language: AppLanguage) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}
""",encoding="utf-8")
patch("src/pages/settings-page.tsx","import { reconcileOperationsOrderAfterSettingsChange } from '@/lib/operations-order-store';","import { reconcileOperationsOrderAfterSettingsChange } from '@/lib/operations-order-store';\nimport { loadLanguage, saveLanguage, type AppLanguage } from '@/lib/language-store';")
patch("src/pages/settings-page.tsx","  const [transferMessage, setTransferMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);","  const [transferMessage, setTransferMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);\n  const [language, setLanguage] = useState<AppLanguage>(() => loadLanguage());")
patch("src/pages/settings-page.tsx","  useEffect(() => { document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl'; }, []);","  useEffect(() => { saveLanguage(language); document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; }, [language]);")
patch("src/pages/settings-page.tsx",'          <section className="mb-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-4 sm:p-5">','''          <section className="mb-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-4 sm:p-5" data-testid="language-settings">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent)/.13)] text-[hsl(var(--accent-foreground))]"><Settings2 size={17} /></div>
              <div className="flex-1">
                <h2 className="text-sm font-extrabold">اللغة / Language / Dil</h2>
                <p className="mt-1 text-xs leading-6 text-[hsl(var(--muted-foreground))]">اختر لغة واجهة التطبيق.</p>
                <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)} className="field-input mt-3" data-testid="select-language">
                  <option value="ar">العربية</option>
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </section>
          <section className="mb-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-4 sm:p-5">''')
print("done")

import { useEffect, useMemo, useState } from 'react';
import { Archive, ChevronDown, Clock3, Layers3, Pencil, Search, Share2 } from 'lucide-react';
import { Link } from 'wouter';
import { cleanupOperationsArchive, type ArchivedOperation } from '@/lib/operations-archive-store';
import { formatAmount, formatWesternNumber } from '@/lib/operations-utils';
import AppBottomNav from '@/components/app-bottom-nav';

function formatArchiveDate(timestamp: number) {
  return new Intl.DateTimeFormat('ar', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date(timestamp));
}

function buildWhatsAppMessage(record: ArchivedOperation) {
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
  return lines.join("
");
}

function formatArchiveTime(timestamp: number) {
  return new Intl.DateTimeFormat('ar', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  }).format(new Date(timestamp));
}

export default function ArchivePage() {
  const [records, setRecords] = useState<ArchivedOperation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setRecords(cleanupOperationsArchive());
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return records;
    return records.filter((record) => (
      record.name.toLocaleLowerCase().includes(query)
      || (record.workTypeName ?? '').toLocaleLowerCase().includes(query)
    ));
  }, [records, searchQuery]);

  return (
    <div className="paper-noise min-h-[100dvh] bg-[hsl(var(--background))]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-3xl px-4 pb-32 sm:px-6 lg:px-8">
        <header className="operations-header">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-medium text-[hsl(var(--accent-foreground))]">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--accent)/.13)]"><Archive size={14} /></span>
            <span>سجل العمليات</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-[-.06em] sm:text-3xl">الأرشيف</h1>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] px-3 py-1.5 text-xs font-bold"
              data-testid="archive-count"
              aria-label={`عدد الأعمال في الأرشيف: ${records.length}`}
            >
              <span className="text-[hsl(var(--muted-foreground))]">الأعمال</span>
              <span className="font-mono text-[hsl(var(--accent-foreground))]" dir="ltr">{formatWesternNumber(records.length)}</span>
            </span>
          </div>
          <p className="mt-2 max-w-md text-xs leading-6 text-[hsl(var(--muted-foreground))]">
            العمليات المسماة محفوظة هنا لمدة 3 أيام، ثم تُحذف تلقائيًا من هذا الجهاز.
          </p>
        </header>

        <section className="work-picker mb-4" aria-label="البحث في الأرشيف">
          <label htmlFor="input-archive-search" className="eyebrow">البحث في الأرشيف</label>
          <div className="relative mt-3">
            <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
            <input
              id="input-archive-search"
              type="search"
              className="field-input pr-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ابحث باسم العميل أو نوع العمل"
              autoComplete="off"
              data-testid="input-archive-search"
            />
          </div>
        </section>

        <main className="space-y-3" data-testid="archive-list">
          {filteredRecords.length === 0 ? (
            <div className="operations-empty" data-testid="archive-empty">
              <span className="operations-empty-icon"><Archive size={19} /></span>
              <p className="text-sm font-bold">
                {records.length === 0 ? 'لا توجد عمليات محفوظة' : 'لا توجد نتائج مطابقة'}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-6 text-[hsl(var(--muted-foreground))]">
                {records.length === 0
                  ? 'أضف اسمًا للعمل قبل إنهاء العملية ليظهر ملخصها هنا.'
                  : 'جرّب البحث باسم عميل أو نوع عمل آخر.'}
              </p>
            </div>
          ) : filteredRecords.map((record) => (
            <details key={record.id} className="archive-record" data-testid={`archive-record-${record.id}`}>
              <summary className="archive-record-summary">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{record.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                    <span>{formatArchiveDate(record.createdAt)}</span>
                    <span className="inline-flex items-center gap-1" dir="ltr">
                      <Clock3 size={12} />
                      {formatWesternNumber(formatArchiveTime(record.createdAt))}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <strong className="font-mono text-sm font-semibold text-[hsl(var(--accent-foreground))]" dir="ltr">
                    {formatAmount(record.finalTotal)}
                  </strong>
                  <ChevronDown size={16} className="archive-record-chevron text-[hsl(var(--muted-foreground))]" />
                </div>
              </summary>

              <div className="archive-record-details">
                {record.workTypeName && (
                  <p className="mb-3 text-[11px] text-[hsl(var(--muted-foreground))]">
                    نوع العمل: <span className="text-[hsl(var(--foreground))]">{record.workTypeName}</span>
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Layers3 size={15} className="text-[hsl(var(--accent-foreground))]" />
                  <span>الأقسام المستخدمة</span>
                </div>
                {record.sections.length === 0 ? (
                  <p className="mt-3 text-[11px] text-[hsl(var(--muted-foreground))]">لا توجد أقسام مسجلة في هذه العملية.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {record.sections.map((section) => (
                      <div key={section.id} className="archive-section">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold">{section.name}</p>
                            <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                              الكمية: <span className="font-mono text-[hsl(var(--foreground))]" dir="ltr">{formatWesternNumber(section.quantity)}</span>
                            </p>
                          </div>
                          <strong className="shrink-0 font-mono text-xs text-[hsl(var(--accent-foreground))]" dir="ltr">
                            {formatAmount(section.result)}
                          </strong>
                        </div>
                        {section.materials.length > 0 && (
                          <ul className="mt-2 space-y-1 border-t border-[hsl(var(--border))] pt-2">
                            {section.materials.map((material) => (
                              <li key={material.id} className="flex justify-between gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                                <span className="truncate">{material.name}</span>
                                <span className="shrink-0 font-mono" dir="ltr">{formatAmount(material.price)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="archive-shipping">
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-[hsl(var(--muted-foreground))]">مجموع الأقسام</span>
                    <strong className="font-mono" dir="ltr">{formatAmount(record.sectionTotal)}</strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      مصاريف الشحن ({record.shipping.mode === 'manual' ? 'تعديل يدوي' : 'تلقائي'})
                    </span>
                    <strong className="font-mono" dir="ltr">
                      {record.shipping.included ? formatWesternNumber(record.shipping.amount) : 'غير محتسب'}
                    </strong>
                  </div>
                  {record.shipping.mode === 'manual' && (
                    <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                      التلقائي: <span className="font-mono" dir="ltr">{formatWesternNumber(record.shipping.automaticAmount)}</span>
                      {' · '}اليدوي: <span className="font-mono" dir="ltr">{formatWesternNumber(record.shipping.manualAmount)}</span>
                    </p>
                  )}
                  {(record.additionalExpenses ?? 0) > 0 && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-[hsl(var(--muted-foreground))]">مصاريف إضافية</span>
                      <strong className="font-mono" dir="ltr">{formatWesternNumber(record.additionalExpenses ?? 0)}</strong>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-3 text-xs">
                    <span className="font-bold">المجموع النهائي</span>
                    <strong className="font-mono text-[hsl(var(--accent-foreground))]" dir="ltr">{formatAmount(record.finalTotal)}</strong>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                  href={`/operations/edit/${encodeURIComponent(record.id)}`}
                  className="operation-link mt-4"
                  aria-label={`تعديل العملية ${record.name}`}
                  data-testid={`button-edit-archive-${record.id}`}
                >
                  <Pencil size={14} />
                  تعديل العملية
                </Link>
              </div>
            </details>
          ))}
        </main>
      </div>
      <AppBottomNav />
    </div>
  );
}
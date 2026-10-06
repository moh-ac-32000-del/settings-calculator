from pathlib import Path

archive_page = Path("src/pages/archive-page.tsx")
text = archive_page.read_text(encoding="utf-8")
old = '<h1 className="text-2xl font-extrabold tracking-[-.06em] sm:text-3xl">الأرشيف</h1>'
new = """<div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-[-.06em] sm:text-3xl">الأرشيف</h1>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] px-3 py-1.5 text-xs font-bold"
              data-testid="archive-count"
              aria-label={`عدد الأعمال في الأرشيف: ${records.length}`}
            >
              <span className="text-[hsl(var(--muted-foreground))]">الأعمال</span>
              <span className="font-mono text-[hsl(var(--accent-foreground))]" dir="ltr">{formatWesternNumber(records.length)}</span>
            </span>
          </div>"""
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise SystemExit("Archive count insertion point not found")
archive_page.write_text(text, encoding="utf-8")

operations_page = Path("src/pages/operations-page.tsx")
text = operations_page.read_text(encoding="utf-8")
old_guard = "if (transferInProgressRef.current || !selectedWork || targetWork === selectedWork || isArchiveEditing) return;"
new_guard = "if (transferInProgressRef.current || !selectedWork || targetWork === selectedWork) return;"
if old_guard in text:
    text = text.replace(old_guard, new_guard, 1)
elif new_guard not in text:
    raise SystemExit("Transfer guard not found")

old_save = """    try {
      const savedSource = saveOperationToArchive(buildArchivedDraft());
      if (!savedSource) {
        setShowTransferPicker(false);
        setTransferNotice('تعذر حفظ نسخة العملية الحالية؛ لم يتم نقلها.');
        return;
      }

      const targetWorkRecord"""
new_save = """    try {
      const savedSource = isArchiveEditing ? archiveRecord : saveOperationToArchive(buildArchivedDraft());
      if (!savedSource) {
        setShowTransferPicker(false);
        setTransferNotice('تعذر حفظ نسخة العملية الحالية؛ لم يتم نقلها.');
        return;
      }

      const targetWorkRecord"""
if old_save in text:
    text = text.replace(old_save, new_save, 1)
elif new_save not in text:
    raise SystemExit("Transfer save block not found")

old_menu = """                  {!isArchiveEditing && (
                    <DropdownMenuItem onSelect={openTransferPicker} data-testid="button-transfer-operation">
                      <MoveRight size={15} />
                      نقل العملية
                    </DropdownMenuItem>
                  )}"""
new_menu = """                  <DropdownMenuItem onSelect={openTransferPicker} data-testid="button-transfer-operation">
                    <MoveRight size={15} />
                    نقل العملية
                  </DropdownMenuItem>"""
if old_menu in text:
    text = text.replace(old_menu, new_menu, 1)
elif new_menu not in text:
    raise SystemExit("Transfer menu block not found")
operations_page.write_text(text, encoding="utf-8")

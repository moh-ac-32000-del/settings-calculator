from pathlib import Path

# Archive UI changes are already persisted in project-backup.tar.gz.
# Keep this deployment step intentionally idempotent and non-destructive.
archive_page = Path("src/pages/archive-page.tsx")
operations_page = Path("src/pages/operations-page.tsx")
print(f"Archive source present: {archive_page.exists()}")
print(f"Operations source present: {operations_page.exists()}")

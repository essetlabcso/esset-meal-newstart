# Spec Index Editing Rules

- Keep path values wrapped in backticks (for example: `docs/00_CONTEXT/FILE.md`).
- Add rows by copying an existing row, then editing only the text that changes.
- Insert new ACTIVE rows above the placeholder rows.
- Do not build row text with PowerShell double-quoted strings containing raw backticks.
- If scripting is required, use single-quoted here-strings for literal markdown rows.
- Keep table columns in this exact order: Spec | Path | Status | Domain | Notes.
- After edits, run a grep check for ``| `docs/`` patterns in every non-placeholder row.
- Keep placeholders at the bottom of the table.

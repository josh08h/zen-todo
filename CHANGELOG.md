# Changelog

## 0.1.0 — 2026-09-21

First public release.

- Treat `TODO`, `todo`, `TODO.md`, `todo.md`, and `*.todo` as todo files.
- Toggle checkboxes with cascade to children and rollup to parents (⌥D).
- Stamp `@done(...)` on check and `@started(...)` on ⌥S.
- Archive fully completed top-level items into an `Archive:` section.
- Preserve the file's existing line endings when archiving.
- Short check-pop decoration when an item is marked done.
- Archive confirmation toast names the items that moved.
- Local install: `npm run reinstall`.

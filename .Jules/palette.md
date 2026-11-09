
## 2026-11-09 - Icon-Only Button Accessibility
**Learning:** Discovered icon-only buttons for critical actions (deleting projects/templates, copying colors to clipboard, undo/redo) lack accessible names (no aria-label or title), rendering them completely invisible to screen readers.
**Action:** Always verify icon-only buttons have descriptive `aria-label` attributes to ensure screen reader compatibility, and optionally `title` for hover tooltips.

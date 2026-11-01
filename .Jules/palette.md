## 2024-05-18 - Missing ARIA Labels on Core Interactions
**Learning:** Found multiple instances where critical interface actions (deleting templates/projects, closing modals, and undo/redo history controls) were using icon-only buttons without `aria-label` attributes. This means screen reader users would have no context for these actions.
**Action:** Always verify icon-only buttons (like those using `lucide-react` components without text children) have descriptive `aria-label` properties. Added `aria-label` to `Trash2`, `X`, `Undo2`, and `Redo2` buttons in `App.tsx`.

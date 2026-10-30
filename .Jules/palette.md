## 2025-02-24 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found multiple buttons across the application (e.g., in App.tsx and BrandKitWorkspace.tsx) that only contain an icon (e.g., `<X />`, `<Trash2 />`, `<Undo2 />`, `<Copy />`) without any text content. These are inaccessible to screen reader users because there's no programmatic way to determine the button's purpose.
**Action:** Always add descriptive `aria-label` attributes to `<button>` elements that only contain icons.

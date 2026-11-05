## 2024-03-24 - Missing aria-labels on icon-only buttons
**Learning:** Found a widespread pattern of missing `aria-label` attributes on icon-only buttons (like Trash, Bookmark, etc.) which significantly degrades the experience for screen reader users by not communicating the button's purpose.
**Action:** Ensure to check for and add descriptive `aria-label`s to all icon-only buttons when making UI changes, prioritizing high-usage areas like headers and item deletion actions.

## 2025-06-09 - [Accessibility Gaps in Form Modals]
**Learning:** This application's modal components for CRUD operations consistently lack semantic associations between labels and inputs, as well as descriptive ARIA labels for icon-only buttons (Edit, Delete, Close).
**Action:** Always verify that every form input has a unique `id` and a corresponding `label` with `htmlFor`. Ensure all icon-only buttons include `aria-label` and `title` attributes for better screen reader and user experience.

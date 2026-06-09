## 2025-05-14 - [Accessibility and Form UX]
**Learning:** Strict linting rules in this repo prohibit synchronous `setState` calls within `useEffect`. This requires a pattern using a 'mounted' flag and memoized callbacks for data fetching. Also, form accessibility (labels with `htmlFor`, ARIA labels for icon buttons) is a core requirement of the design system.
**Action:** Always use the mounted flag pattern in `useEffect` for data fetching and ensure all icon buttons have both `aria-label` and `title` for better UX.

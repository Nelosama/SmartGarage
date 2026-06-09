## 2025-02-11 - [Accessibility & Dark Mode Patterns]
**Learning:** Icon-only interactive elements must have both `aria-label` and `title` attributes to be accessible to screen readers and provide visual tooltips. 'Cancel' or secondary buttons should use a specific Tailwind pattern (`text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`) for consistent visibility in dark mode.
**Action:** Apply these accessibility and styling patterns to all new and existing interactive components.

**Learning:** Strict linting rules in this project prohibit synchronous `setState` calls directly within `useEffect`.
**Action:** Wrap data-fetching calls in an async IIFE or separate async function within `useEffect` to ensure state updates happen in a callback/after a promise, avoiding the `react-hooks/set-state-in-effect` error.

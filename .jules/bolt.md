## 2026-06-09 - [Optimizing Redundant API Calls and Debouncing]
**Learning:** In list views with search functionality, fetching metadata (like dropdown options) on every search keystroke creates unnecessary load. Separating metadata fetch (on mount) from data fetch (on search) is a critical optimization. Also, implementing a 300ms debounce on search inputs is essential to prevent API hammering.
**Action:** Always check if metadata can be fetched once and reused, and implement search debouncing by default for any text-based API filters.

## 2026-06-09 - [API Payload Optimization]
**Learning:** prisma `include` can easily lead to over-fetching. Removing unused relations from the API response for list views can significantly reduce the JSON payload size and database join overhead.
**Action:** Audit API `include` blocks to ensure only necessary data for the current view is being returned.

# QA Analysis Report - SmartGarage

## Identified Bugs & Critical Issues

### 1. Broken Search in Clientes API
- **Location:** `src/app/api/clientes/route.ts`
- **Issue:** The `GET` method does not accept the `request` object and completely ignores the `q` query parameter sent by the frontend.
- **Impact:** Users cannot filter the client list, which will become unusable as the database grows.

### 2. Missing Database Connection Pooling Configuration
- **Location:** `.env`
- **Issue:** The `DATABASE_URL` is missing the `?pgbouncer=true` parameter.
- **Impact:** Potential connection exhaustion and "prepared statement" errors when using Prisma with Supabase's Connection Pooler (port 6543).

### 3. Lack of Debounce in Clientes Search
- **Location:** `src/app/clientes/page.tsx`
- **Issue:** The search input triggers an API call on every keystroke.
- **Impact:** High load on the server and potentially buggy UI updates if responses arrive out of order (race conditions).

### 4. Silent Failure in Order Creation
- **Observation:** During QA automation, the work order creation failed to reach the list.
- **Potential Cause:** The `id_cliente` might be missing in the POST body if the vehicle selection logic in the frontend doesn't correctly map the owner.

## Technical Debt & UX Improvements

### 1. Overuse of `any` Type
- **Location:** API routes (`src/app/api/*/route.ts`)
- **Issue:** Widespread use of `any` in catch blocks and variable declarations.
- **Impact:** Reduces type safety and makes refactoring more dangerous.

### 2. Micro-UX: Success/Error Feedback
- **Observation:** Form submissions lack clear visual success transitions other than the modal closing.

### 3. Palette Directive (Micro-UX Improvement)
- **Planned:** Add a subtle "copy to clipboard" feature for vehicle placas in the list views.

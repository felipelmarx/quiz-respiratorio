# Phase 2 QA Report — Super Admin + Branding

**Date:** 2026-04-02
**Reviewer:** QA Agent (Claude)
**Overall Verdict:** CONDITIONAL PASS -- build/lint/types clean, but runtime data-binding bugs found

---

## 1. Build Verification

| Check | Result | Notes |
|-------|--------|-------|
| `npm run build` | PASS | 21 pages generated, compiled successfully |
| `npm run lint` | PASS | 1 pre-existing warning (custom font in layout.tsx), no errors |
| `npx tsc --noEmit` | PASS | Zero type errors |

---

## 2. Code Review

### 2.1 Branding Migration

| Check | Result |
|-------|--------|
| Zero "emerald" references in `admin/src/` | PASS |
| Navy (#0A192F) + Gold (#C6A868) used throughout | PASS |
| Chart tooltips use Navy/Gold branding | PASS |
| Sidebar uses navy-900, navy-50, gold-500 classes | PASS |

**Verdict:** PASS

---

### 2.2 Collapsible Sidebar

| Check | Result |
|-------|--------|
| `sidebar-context.tsx` provides `collapsed`, `mobileOpen`, `toggle`, `setMobileOpen` | PASS |
| State persisted to localStorage | PASS |
| `sidebar.tsx` uses lucide-react icons (LayoutDashboard, BarChart3, Users, etc.) | PASS |
| Both `admin/layout.tsx` and `dashboard/layout.tsx` use SidebarProvider + MainContent | PASS |
| Desktop toggle (ChevronLeft/ChevronRight) | PASS |
| Mobile hamburger + overlay + slide-in | PASS |
| Active link styling with navy-50 bg + gold-500 border | PASS |
| Width transitions (w-64 to w-16) | PASS |
| Collapsed labels hidden with opacity-0 + w-0 | PASS |

**Verdict:** PASS

---

### 2.3 Analytics API (`/api/admin/analytics` + `/api/quiz/analytics`)

| Check | Result | Notes |
|-------|--------|-------|
| Admin route requires `role: 'admin'` | PASS | `requireAuth({ role: 'admin' })` |
| Quiz route requires any auth | PASS | `requireAuth()` with no role |
| Quiz route scopes data to `auth.user.id` | PASS | `instructorId = auth.user.id` |
| Period validation (7, 30, 90, 365) | PASS | Whitelist with typed array |
| Error handling (try/catch + per-RPC errors) | PASS | Partial errors reported in response |
| Uses Supabase RPC (no raw SQL) | PASS | |

**Verdict:** PASS

---

### 2.4 Chart Components

| Check | Result |
|-------|--------|
| All 4 charts have `'use client'` directive | PASS |
| All use `ResponsiveContainer` | PASS |
| All have empty state handling ("Sem dados") | PASS |
| LineChart, BarChart, DonutChart, AreaChart all present | PASS |
| Custom tooltips with Navy/Gold branding | PASS |
| Recharts typing via `TooltipContentProps` import | PASS |
| DonutChart has center label and custom legend | PASS |
| BarChart has hover highlight (Cell + activeIndex) | PASS |

**Verdict:** PASS

---

### 2.5 Analytics Page

| Check | Result |
|-------|--------|
| KPI cards (4 total) | PASS |
| Period selector (7d, 30d, 90d, 1a) | PASS |
| Loading skeletons (KpiSkeleton, ChartSkeleton) | PASS |
| Error banner | PASS |
| GrowthBadge with percentage calc | PASS |
| Line chart integration | PASS |
| Donut chart integration | PASS |
| Bar chart integration | PASS |
| Top instructors table with empty state | PASS |

**Runtime Bug - Field Name Mismatches:** FAIL (see Section 5)

**Verdict:** CONDITIONAL PASS

---

### 2.6 SQL Migrations

#### Migration 012 — Analytics Views

| Check | Result | Notes |
|-------|--------|-------|
| `CREATE OR REPLACE FUNCTION` (idempotent) | PASS | All 6 functions |
| `SECURITY DEFINER` + `SET search_path = public` | PASS | Prevents search_path injection |
| `STABLE` volatility for read-only functions | PASS | |
| Parameterized queries (no string concat) | PASS | Uses function parameters |
| `CREATE INDEX IF NOT EXISTS` (idempotent) | PASS | 3 indexes |
| `generate_series` for gap-filling daily counts | PASS | |
| `get_question_analytics` uses plpgsql for JSONB parsing | PASS | |

**Verdict:** PASS

#### Migration 013 — Instructor Stats

| Check | Result | Notes |
|-------|--------|-------|
| `ADD COLUMN IF NOT EXISTS` (idempotent) | PASS | `last_login_at` |
| `update_last_login` uses `auth.uid()` | PASS | |
| `get_instructor_stats` joins users/responses/leads | PASS | |
| Function signatures correct | PASS | |

**Verdict:** PASS

#### Migration 014 — License Tracking

| Check | Result | Notes |
|-------|--------|-------|
| `ADD COLUMN IF NOT EXISTS` (idempotent) | PASS | `license_plan`, `license_price` |
| `CREATE TABLE IF NOT EXISTS` (idempotent) | PASS | `license_history` |
| RLS enabled on `license_history` | PASS | Admin-only policy |
| `DROP POLICY IF EXISTS` before CREATE | PASS | Idempotent |
| Trigger uses `IS DISTINCT FROM` for change detection | PASS | |
| `DROP TRIGGER IF EXISTS` before CREATE | PASS | |
| `SECURITY DEFINER` on all functions | PASS | |

**Verdict:** PASS

---

### 2.7 Instructors Page

| Check | Result |
|-------|--------|
| Search filter (name, email, slug) | PASS |
| Status filter (All, Active, Inactive) | PASS |
| Column sorting (8 sortable fields) | PASS |
| Stats integration via `/api/admin/instructors/stats` | PASS |
| Stats map for O(1) lookup | PASS |
| Responsive layout (desktop table + mobile cards) | PASS |
| Empty states (no instructors + no filter results) | PASS |
| License status badges (Active, Expiring, Expired) | PASS |
| Permissions panel (inline expand) | PASS |
| Invite link generation | PASS |
| Create instructor form | PASS |
| Relative date formatting (date-fns + ptBR) | PASS |

**Verdict:** PASS

---

### 2.8 Licenses Page

| Check | Result |
|-------|--------|
| KPI cards (Active, Revenue, Expiring, Expired) | PASS |
| Donut chart (plan distribution) | PASS |
| Instructor license table | PASS |
| Search + plan filter | PASS |
| Edit modal with plan, price, expiry fields | PASS |
| Currency formatting (pt-BR BRL) | PASS |
| License status computation | PASS |
| Empty states | PASS |
| Badge variants per plan + status | PASS |

**Verdict:** PASS

---

## 3. Security Checklist

| Check | Result | Notes |
|-------|--------|-------|
| `/api/admin/analytics` requires admin auth | PASS | `requireAuth({ role: 'admin' })` |
| `/api/admin/instructors/stats` requires admin auth | PASS | `requireAuth({ role: 'admin' })` |
| `/api/admin/licenses` GET requires admin auth | PASS | `requireAuth({ role: 'admin' })` |
| `/api/admin/licenses` PATCH requires admin auth | PASS | `requireAuth({ role: 'admin' })` |
| `/api/quiz/analytics` requires any auth | PASS | `requireAuth()` |
| License PATCH validates input with Zod | PASS | UUID, enum, min/max, nullable datetime |
| PATCH also filters by `role: 'instructor'` | PASS | Prevents admin self-modification |
| No SQL injection in migrations | PASS | All use parameterized functions |
| No XSS in dynamic content | PASS | React auto-escapes, no `dangerouslySetInnerHTML` |
| RLS on `license_history` (admin-only) | PASS | |
| `SECURITY DEFINER` + `SET search_path` on all functions | PASS | |

**Verdict:** PASS

---

## 4. Design System

| Check | Result |
|-------|--------|
| `docs/design/design-system.md` exists | PASS |
| Navy/Gold palette applied across all new components | PASS |
| Consistent typography (Lato in charts, Playfair Display headings) | PASS |
| Focus states use gold-500 ring | PASS |

**Verdict:** PASS

---

## 5. Bugs Found

### BUG-1: Analytics KPI field name mismatch (MEDIUM severity)

**File:** `admin/src/app/admin/analytics/page.tsx` (KPIs interface, lines 11-19)

The TypeScript `KPIs` interface expects fields that don't match the SQL function `get_platform_kpis` return columns:

| UI Interface Field | SQL Return Column | Match? |
|---|---|---|
| `active_instructors` | `total_instructors` | NO |
| `previous_responses` | `responses_previous_period` | NO |
| `previous_leads` | (not returned) | NO |
| (not in interface) | `responses_current_period` | MISSING |
| (not in interface) | `growth_percentage` | MISSING |

**Impact:** KPI cards will show 0 for instructors count and GrowthBadge will always compute 0% growth because the fields are undefined. The data fetched successfully but is accessed under wrong property names.

### BUG-2: Score distribution field name mismatch (MEDIUM severity)

**File:** `admin/src/app/admin/analytics/page.tsx` (ScoreBucket interface, line 27-28)

The `ScoreBucket` interface defines `{ label: string; value: number }` but `get_score_distribution` returns `{ score_bucket: text; count: bigint }`. The `BarChart` component expects `label` and `value` dataKeys.

**Impact:** Bar chart for score distribution will render empty bars (no data mapped to correct keys).

### BUG-3: Instructor rankings field name mismatch (MEDIUM severity)

**File:** `admin/src/app/admin/analytics/page.tsx` (InstructorRanking interface, lines 37-43)

| UI Interface Field | SQL Return Column | Match? |
|---|---|---|
| `name` | `instructor_name` | NO |
| `total_responses` | `response_count` | NO |
| `total_leads` | `lead_count` | NO |

**Impact:** Top instructors table will show "0" for responses/leads and empty names.

### BUG-4: License history insert uses non-existent column (LOW severity)

**File:** `admin/src/app/api/admin/licenses/route.ts` (line 100)

The code inserts `new_expires_at: license_expires_at` into `license_history`, but migration 014 does not define a `new_expires_at` column. The table columns are: `id, user_id, previous_plan, new_plan, previous_price, new_price, changed_by, reason, created_at`.

**Impact:** The license history insert will fail silently (the error is caught and logged as non-blocking). License updates still work, but the audit trail will be incomplete. Additionally, the insert does not set `previous_plan` or `previous_price`, so even if `new_expires_at` is removed, the history entries will lack "before" values (though the trigger function in the migration separately captures these).

**Note:** The trigger `trigger_log_license_change` on the `users` table separately captures license changes with proper before/after values, so the audit trail IS maintained via the trigger. The explicit insert in the API route is redundant and buggy -- it could be removed entirely since the trigger handles it.

---

## 6. Summary

| Area | Verdict |
|------|---------|
| Build / Lint / TypeCheck | PASS |
| Branding Migration | PASS |
| Collapsible Sidebar | PASS |
| Analytics API Security | PASS |
| Chart Components | PASS |
| Analytics Page | CONDITIONAL PASS (3 field-mapping bugs) |
| SQL Migrations | PASS |
| Instructors Page | PASS |
| Licenses Page | PASS |
| Security | PASS |

### Overall Verdict: CONDITIONAL PASS

The build is clean, security is solid, and the UI/UX implementation is thorough. However, **4 runtime data-binding bugs** were found in the analytics page and license history API. These are all field-name mismatches between TypeScript interfaces and PostgreSQL function return columns. They won't cause crashes but will result in empty/zero values displayed to the user.

### Recommended Fixes (priority order):

1. **BUG-1, BUG-2, BUG-3:** Update the analytics page TypeScript interfaces to match the actual SQL function return column names, OR update the API route to remap the fields before returning.
2. **BUG-4:** Remove the redundant manual insert into `license_history` from the PATCH handler (the DB trigger already handles this correctly), or add the missing column to the migration.

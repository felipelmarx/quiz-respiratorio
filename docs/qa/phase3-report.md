# Phase 3 QA Report -- Instructor Dashboard Evolution

**Date:** 2026-04-03
**Reviewer:** QA Agent (Claude)
**Overall Verdict:** CONDITIONAL PASS -- 2 bugs found requiring fix

---

## 1. Build Verification

| Check | Result |
|-------|--------|
| `npm run build` | PASS -- 23 static + dynamic pages, compiled successfully |
| `npm run lint` | PASS -- only pre-existing font warning in layout.tsx |
| `npx tsc --noEmit` | PASS -- zero type errors |

---

## 2. Code Review

### 2.1 Dashboard Page (`src/app/dashboard/page.tsx`)

| Check | Result | Notes |
|-------|--------|-------|
| Chart data mapping (score_bucket -> label, count -> value) | PASS | Line 448-451: `s.score_bucket` mapped to `label`, `Number(s.count)` to `value` |
| Profile colors (4 profiles, correct hex) | PASS | Lines 74-79: funcional=#16a34a, atencao_moderada=#f59e0b, disfuncao=#f97316, disfuncao_severa=#dc2626 |
| KPI field names match SQL RPC | PASS | `total_responses`, `total_leads`, `avg_score`, `responses_current_period`, `responses_previous_period` align with `get_platform_kpis` |
| Period selector works | PASS | Lines 67-72: 7d/30d/90d/1a with state-driven re-fetch via `useEffect` on `period` |
| PersonalizedLink preserved | PASS | Lines 317-328: Conditional on `isInstructor`, handles missing slug with amber warning |
| Onboarding integration | PASS | Lines 178-193: Checks onboarding status on mount, shows overlay when not completed |
| Donut chart profile labels | PASS | Lines 268-272: Maps profile keys to PT-BR labels |
| Growth badge calculation | PASS | Lines 147-162: Handles zero-division, correct positive/negative display |
| Empty state for recent responses | PASS | Lines 476-483: Shows message encouraging link sharing |
| Skeleton loaders | PASS | KPI, chart, and table skeletons present |

### 2.2 Auth Me Endpoint (`src/app/api/auth/me/route.ts`)

| Check | Result | Notes |
|-------|--------|-------|
| Requires authentication | PASS | Line 9: `getAuthUser()` check, returns 401 |
| Returns expected fields | PASS | id, role, slug, quizBaseUrl |
| Error handling | PASS | try/catch with 500 response |

### 2.3 Per-Question Analytics

#### Page (`src/app/dashboard/analytics/page.tsx`)

| Check | Result | Notes |
|-------|--------|-------|
| Question labels match quiz-data.js | PASS | All 11 questions q1-q11 mapped with correct labels |
| Max scores match quiz-data.js | PASS | q1=3, q2=3, q3=3, q4=4, q5=0(multi), q6=4, q7=3, q8=3, q9=3, q10=3, q11=4 |
| Chapter labels | PASS | Padrao Respiratorio, Seus Desafios, Sintomas & Sinais, Consciencia Corporal, Tolerancia ao CO2 |
| Empty state | PASS | Lines 149-161: Shows message when no data |
| Error handling | PASS | Error banner + state management |
| Q5 multi-select handling | PASS | Excluded from bar chart, shows response count only |

#### API (`src/app/api/quiz/question-analytics/route.ts`)

| Check | Result | Notes |
|-------|--------|-------|
| Auth required | PASS | `requireAuth({ permission: 'view_dashboard' })` |
| Instructor scoping | PASS | Passes `p_instructor_id` to RPC, null for admin |
| Error handling | PASS | RPC error logged and returned as 500 |

### 2.4 Student CRM

#### Students List (`src/app/dashboard/students/page.tsx`)

| Check | Result | Notes |
|-------|--------|-------|
| Search filter | PASS | Resets page on change |
| Profile filter dropdown | PASS | All 4 profiles listed |
| Sort options | PASS | last_attempt, name, score |
| Pagination | PASS | Previous/Next with disabled states |
| URL encoding for email param | PASS | `encodeURIComponent(s.email)` at lines 224, 241 |
| WhatsApp links | PASS | Uses `getWhatsAppUrl()` with external link attributes |
| Mobile responsive cards | PASS | Hidden desktop table on mobile, card layout shown |
| Empty state (filtered vs unfiltered) | PASS | Different messages for filtered vs no-data states |

#### Student Detail (`src/app/dashboard/students/[email]/page.tsx`)

| Check | Result | Notes |
|-------|--------|-------|
| Email decoding | PASS | Line 101: `decodeURIComponent(params.email)` |
| Score history chart | PASS | Reversed chronological order for line chart, only shows when >1 response |
| Category breakdown | **FAIL** | **Lines 69-73: Max scores are wrong.** Uses padrao=12, sintomas=12, tolerancia=6. Should be padrao=13, sintomas=13, tolerancia=4 per quiz-data.js |
| Profile descriptions | PASS | All 4 profiles have PT-BR descriptions |
| WhatsApp link | PASS | Present in header |
| Back navigation | PASS | Link to /dashboard/students |
| All attempts table | PASS | Links to individual response detail |

#### Students API (`src/app/api/quiz/students/route.ts`)

| Check | Result | Notes |
|-------|--------|-------|
| Auth required | PASS | `requireAuth({ permission: 'view_contacts' })` |
| Email grouping logic | PASS | Groups by lowercase email, merges responses from duplicate leads |
| Search sanitization | PASS | Strips special chars: `[%,.()"'\\]` |
| Limit capping | PASS | `Math.min(Math.max(1, ...), 100)` |
| Sorting | PASS | name (locale-aware), score, last_attempt |
| Pagination | PASS | Offset-based with total count |
| RLS scoping | PASS | Relies on Supabase RLS + auth context |

### 2.5 Enhanced Responses Table (`src/app/dashboard/responses/page.tsx`)

| Check | Result | Notes |
|-------|--------|-------|
| Date filter | PASS | dateFrom/dateTo inputs + presets (today, 7d, 30d, all) |
| Sortable columns | PASS | name, total_score, profile, created_at with direction toggle |
| Bulk CSV export | PASS | BOM prefix for Excel compat, proper CSV escaping via `generateCSV()` |
| Preview panel | PASS | Opens on eye icon click, closes on outside click or X, sticky position |
| Pagination with page size | PASS | 10/20/25/50 options, showing X to Y of Z |
| Profile filter badges with counts | PASS | Parallel fetch of per-profile counts |
| Preview panel category max scores | **FAIL** | **Line 602: Max scores are wrong.** Uses padrao=9, sintomas=9, consciencia=6, tolerancia=9. Should be padrao=13, sintomas=13, consciencia=3, tolerancia=4 per quiz-data.js |

#### Responses API (`src/app/api/quiz/responses/route.ts`)

| Check | Result | Notes |
|-------|--------|-------|
| Auth required | PASS | `requireAuth({ permission: 'view_responses' })` |
| Date filtering | PASS | `gte`/`lte` with T00:00:00/T23:59:59 |
| Search sanitization | PASS | Strips special chars, uses `referencedTable` for join filter |
| Pagination | PASS | Server-side with `count: 'exact'` |
| Profile filtering | PASS | `.eq('profile', profile)` |

### 2.6 Instructor Onboarding

#### Component (`src/components/dashboard/onboarding.tsx`)

| Check | Result | Notes |
|-------|--------|-------|
| 4-step flow | PASS | Welcome -> Profile -> Link -> Share |
| Profile save via API | PASS | PATCH to /api/auth/onboarding with form fields |
| Onboarding completion marking | PASS | `{ complete: true }` sent on final step |
| Overlay dismissal | PASS | Calls `onComplete()` which sets `showOnboarding(false)` |
| Graceful failure | PASS | Continues even if API calls fail |
| Copy to clipboard | PASS | With timeout-based "Copied!" feedback |
| WhatsApp share | PASS | Pre-filled message with quiz link |

#### API (`src/app/api/auth/onboarding/route.ts`)

| Check | Result | Notes |
|-------|--------|-------|
| GET requires auth | PASS | `getAuthUser()` check |
| PATCH requires auth | PASS | `getAuthUser()` check |
| Input validation | PASS | Trims strings, converts empty to null, rejects empty updates with 400 |
| Only updates provided fields | PASS | Conditional field inclusion in updates object |
| No SQL injection | PASS | Uses Supabase client `.update()` with parameterized values |

#### Migration (`supabase/migrations/015_onboarding_status.sql`)

| Check | Result | Notes |
|-------|--------|-------|
| Idempotency | PASS | `IF NOT EXISTS` check before `ALTER TABLE` |
| Column type | PASS | `TIMESTAMPTZ DEFAULT NULL` -- appropriate for timestamp |

### 2.7 Sidebar Updates (`src/components/dashboard/sidebar.tsx`)

| Check | Result | Notes |
|-------|--------|-------|
| Analytics link added | PASS | `/dashboard/analytics` with BarChart3 icon, `view_dashboard` permission |
| Students link added | PASS | `/dashboard/students` with GraduationCap icon, `view_contacts` permission |
| Permission gating | PASS | Links filtered by `hasPermission()` |
| Active state detection | PASS | Exact match for root paths, startsWith for sub-paths |

---

## 3. Security Checklist

| Check | Result | Notes |
|-------|--------|-------|
| All new API endpoints require authentication | PASS | `/api/auth/me`, `/api/auth/onboarding`, `/api/quiz/question-analytics`, `/api/quiz/students` all check auth |
| Student data scoped by instructor (RLS) | PASS | Supabase RLS + auth context used throughout |
| Onboarding API validates input | PASS | Type checking, trimming, empty rejection |
| CSV export doesn't leak other instructors' data | PASS | Export only from client-side data already filtered by API auth |
| No XSS in dynamic content | PASS | React's JSX auto-escaping handles all dynamic content; no `dangerouslySetInnerHTML` used |
| No SQL injection | PASS | All queries use Supabase client (parameterized) or RPC calls |
| Search input sanitized | PASS | Special characters stripped before use in `ilike` filters |

---

## 4. Bugs Found

### BUG-1: Category Max Scores Wrong in Student Detail Page (MEDIUM)

**File:** `src/app/dashboard/students/[email]/page.tsx`, lines 68-73

**Current values:**
```ts
const categoryMaxScores: Record<string, number> = {
  padrao: 12,
  sintomas: 12,
  consciencia: 3,
  tolerancia: 6,
}
```

**Correct values (from quiz-data.js `CATEGORY_ANALYSIS`):**
```ts
const categoryMaxScores: Record<string, number> = {
  padrao: 13,
  sintomas: 13,
  consciencia: 3,
  tolerancia: 4,
}
```

**Impact:** Progress bars and score displays for padrao, sintomas, and tolerancia categories show incorrect percentages. The tolerancia category is the worst -- showing `/6` when max is actually 4.

---

### BUG-2: Category Max Scores Wrong in Responses Preview Panel (MEDIUM)

**File:** `src/app/dashboard/responses/page.tsx`, line 602

**Current values:**
```ts
max={key === 'padrao' ? 9 : key === 'sintomas' ? 9 : key === 'consciencia' ? 6 : 9}
```

**Correct values:**
```ts
max={key === 'padrao' ? 13 : key === 'sintomas' ? 13 : key === 'consciencia' ? 3 : 4}
```

**Impact:** All four category progress bars in the quick preview panel display incorrect percentages.

---

## 5. Minor Observations (Non-blocking)

1. **Missing accents in some UI strings** -- Several labels like "Acao", "Pagina", "Proximo", "pagina" lack proper Portuguese accents. Should be "Acao" -> "Acao" is actually missing the cedilla ("Acao" should be "Acao"). Actually: "Acao" -> should be displayed with proper characters. These appear in responses/page.tsx lines 433, 536-539, 553, 559.

2. **Responses page profileCounts uses N+1 fetch pattern** -- The `fetchProfileCounts` function makes 4 parallel API calls (one per profile) to get badge counts. Consider adding a dedicated count endpoint or returning counts from the main query.

3. **Student detail page re-uses the students list API** -- The student detail page fetches via `?search=${email}&limit=100` and finds the exact match client-side. This works but a dedicated endpoint would be more efficient for large datasets.

4. **`direction` state unused** -- In `onboarding.tsx` line 42, `direction` state is set but both branches of the ternary on line 174 use the same class `animate-fade-in`.

---

## 6. Summary

| Area | Verdict |
|------|---------|
| Build / Lint / Types | PASS |
| Dashboard page | PASS |
| Auth Me endpoint | PASS |
| Per-question analytics | PASS |
| Student CRM - list | PASS |
| Student CRM - detail | **FAIL** (BUG-1: wrong category max scores) |
| Student CRM - API | PASS |
| Responses table | **FAIL** (BUG-2: wrong category max scores in preview) |
| Responses API | PASS |
| Onboarding component | PASS |
| Onboarding API | PASS |
| Migration 015 | PASS |
| Sidebar updates | PASS |
| Security | PASS |

**Overall: CONDITIONAL PASS** -- Two category max score bugs must be fixed before production deployment. All security checks pass. All build tooling passes.

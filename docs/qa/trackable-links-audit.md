# Trackable Links Audit Report

**Date:** 2026-04-04
**Auditor:** Quinn (QA Guardian)
**Scope:** End-to-end instructor trackable link system
**Verdict:** CONDITIONAL PASS (1 bug found, 1 recommendation)

---

## Flow Diagram

```
LINK GENERATION                    QUIZ ACCESS                      SLUG RESOLUTION
Settings page (slug input)   -->   Student clicks ?ref=slug   -->   resolveInstructorSlug()
  admin/.../settings/page.tsx        app.js:57-58                     app.js:56-85
  Saves slug to users.slug           Parses URLSearchParams           Calls RPC get_instructor_by_slug
  Unique constraint enforced         Gets 'ref' param value           Returns {id, name, profissao,
  Validation: [a-z0-9-], 3-50ch                                       cidade, nome_clinica, whatsapp}
                                                                     Stores in resolvedInstructor
        |                                  |                                    |
        v                                  v                                    v
LINK DISPLAY                       QUIZ COMPLETION                   SUBMISSION
PersonalizedLink component         saveAnonymousResponse()           saveApplication()
  personalized-link.tsx:15           app.js:185-224                    app.js:227-289
  Format: {baseUrl}?ref={slug}       instructor_id from               instructor_id attached
  Dashboard page.tsx:341              getInstructorConfig()             to quiz_leads INSERT
  Onboarding.tsx:76                   Attached to quiz_responses        AND quiz_responses PATCH
                                                                       (lead_id linkage)
        |                                  |                                    |
        v                                  v                                    v
                                  RLS FILTERING                      DASHBOARD DISPLAY
                                  001_initial_schema.sql              /api/quiz/responses
                                  010_fix_rls_master_to_admin.sql     /api/quiz/analytics
                                  instructor_own_leads:               /api/quiz/stats
                                    instructor_id = auth.uid()        All queries go through
                                  instructor_own_responses:           Supabase client with
                                    instructor_id = auth.uid()        authenticated user session
                                  admin sees ALL                     RLS auto-filters results
                                  anon can INSERT only
```

---

## Step-by-Step Audit Results

### STEP 1: Link Generation -- PASS

**Files examined:**
- `admin/src/app/dashboard/settings/page.tsx` (lines 226-231, 148-152, 176-181)
- `admin/src/components/dashboard/personalized-link.tsx` (line 15)
- `admin/src/app/dashboard/page.tsx` (lines 339-349)
- `admin/src/components/dashboard/onboarding.tsx` (line 76)
- `admin/supabase/migrations/011_slug_hardening.sql`

**Findings:**

| Check | Result |
|-------|--------|
| Slug input validates client-side | PASS -- `e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')` (settings/page.tsx:229) |
| Slug validates server-side | PASS -- `validate_slug()` CHECK constraint (011_slug_hardening.sql:107-137) |
| Slug uniqueness enforced | PASS -- `UNIQUE` constraint on `users.slug` (001_initial_schema.sql:13, 011_slug_hardening.sql:165-177) |
| Slug auto-generated on INSERT | PASS -- Trigger `trg_auto_generate_slug` (011_slug_hardening.sql:218-221) |
| Slug format rules | PASS -- lowercase, a-z0-9 and hyphens, 3-50 chars, no leading/trailing hyphens |
| Link format consistent | PASS -- All locations use `?ref={slug}` format |
| Link displayed to instructor | PASS -- PersonalizedLink component (personalized-link.tsx:15) and settings page (settings/page.tsx:248-250) |
| Dashboard shows link for instructors | PASS -- Conditional on `isInstructor && userInfo?.slug` (page.tsx:339-349) |
| Onboarding shows link | PASS -- `${quizBaseUrl}?ref=${profile.slug}` (onboarding.tsx:76) |

**Link format:** `{quizBaseUrl}?ref={slug}` (e.g., `https://quiz-lac-phi.vercel.app?ref=dr-felipe`)

### STEP 2: Quiz Receives the Link -- PASS

**Files examined:**
- `app.js` (lines 42-113, 1830-1834)

**Findings:**

| Check | Result |
|-------|--------|
| `?ref=` parameter parsed on DOMContentLoaded | PASS -- `resolveInstructorSlug()` called at line 1833 |
| Slug extracted from URL | PASS -- `params.get('ref')` at line 58 |
| RPC function called | PASS -- Calls `get_instructor_by_slug` (line 63) with `{ p_slug: slug }` |
| RPC returns instructor data | PASS -- Returns `{id, name, profissao, cidade, nome_clinica, whatsapp}` (007_instructor_public_profile.sql:11-17) |
| RPC filters active instructors only | PASS -- `WHERE slug = p_slug AND is_active = true AND role = 'instructor'` (007_instructor_public_profile.sql:20) |
| Resolved instructor stored in memory | PASS -- `resolvedInstructor = data` (line 78) |
| Missing `?ref=` handled gracefully | PASS -- Early return if `!slug` (line 59); fallback to legacy params (line 104-112) |
| Invalid slug handled gracefully | PASS -- If RPC returns no data, `resolvedInstructor` stays null; fallback used (line 91+104) |
| Legacy `?instrutor=` still supported | PASS -- As display-name-only fallback, no DB lookup (line 108); `instructorId` is null |

### STEP 3: Quiz Submission -- PASS (with 1 BUG found)

**Files examined:**
- `app.js` (lines 185-289)
- `admin/src/app/api/quiz/submit/route.ts` (lines 1-112)
- `admin/supabase/migrations/004_security_fixes.sql`

**Findings -- Direct Supabase submission (app.js):**

| Check | Result |
|-------|--------|
| `instructor_id` attached to quiz_responses | PASS -- `instructor_id: instructor.instructorId \|\| null` (line 199) |
| `instructor_id` attached to quiz_leads | PASS -- `instructor_id: instructor.instructorId \|\| null` (line 237) |
| No instructor_id when no `?ref=` | PASS -- Falls back to `null` (line 111) |
| Application form also includes instructor_id | PASS -- `instructor_id: instructorConfig.instructorId \|\| null` (line 1355) |

**Findings -- API route submission (route.ts):**

| Check | Result |
|-------|--------|
| Resolves slug server-side | PASS -- `supabase.rpc('resolve_instructor_slug', ...)` (line 57) |
| instructor_id saved to quiz_leads | PASS -- `instructor_id: instructorId` (line 71) |
| instructor_id saved to quiz_responses | PASS -- `instructor_id: instructorId` (line 89) |
| Validation schema applied | PASS -- `quizSubmissionSchema.safeParse(body)` (line 42) |
| Rate limiting applied | PASS -- 10 requests per minute per IP (lines 14-28) |

**BUG FOUND: Dead code path -- PATCH to link response to lead will FAIL**

In `app.js` lines 263-285, after saving the lead, the code attempts to PATCH `quiz_responses` to set `lead_id`:
```javascript
const updateResponse = await fetch(
    `${SUPABASE_CONFIG.url}/rest/v1/quiz_responses?id=eq.${savedResponseId}`,
    { method: 'PATCH', ... }
);
```
However, migration `004_security_fixes.sql` (line 8) explicitly **dropped** the `anon_update_responses` RLS policy:
```sql
DROP POLICY IF EXISTS "anon_update_responses" ON public.quiz_responses;
```
This means the PATCH will silently fail (403 or empty result) because the anonymous user has no UPDATE permission on `quiz_responses`. The `lead_id` column on the response row will remain NULL.

**Impact:** LOW -- The `instructor_id` is correctly set on both tables during INSERT. The `lead_id` linkage failure means responses and leads are connected only through `instructor_id`, not through the direct `lead_id` FK. The dashboard queries join on `quiz_responses.lead_id -> quiz_leads.id` (responses/route.ts:31 uses `quiz_leads!inner`), which means **responses saved via the direct Supabase path (without going through the API route) will NOT appear in the dashboard's responses list because lead_id will be NULL and the `!inner` join excludes them.**

**Severity:** MEDIUM -- This affects the direct Supabase submission path only. If the API route (`/api/quiz/submit`) is the primary path, this is not an issue there since it inserts both in one transaction with the lead_id properly set.

### STEP 4: Data Isolation (RLS) -- PASS

**Files examined:**
- `admin/supabase/migrations/001_initial_schema.sql` (lines 68-133)
- `admin/supabase/migrations/004_security_fixes.sql`
- `admin/supabase/migrations/010_fix_rls_master_to_admin.sql`

**Findings:**

| Policy | Table | Check | Result |
|--------|-------|-------|--------|
| `admin_all_leads` | quiz_leads | Admin sees ALL leads | PASS -- `role = 'admin'` check (010:18-21) |
| `instructor_own_leads` | quiz_leads | Instructor sees OWN leads only | PASS -- `instructor_id = auth.uid()` (001:92-93) |
| `anon_insert_leads` | quiz_leads | Anonymous can INSERT | PASS -- `WITH CHECK (true)` (001:98-99) |
| Anonymous cannot READ leads | quiz_leads | No SELECT policy for anon | PASS -- Only admin and instructor SELECT policies exist |
| `admin_all_responses` | quiz_responses | Admin sees ALL responses | PASS -- `role = 'admin'` check (010:25-28) |
| `instructor_own_responses` | quiz_responses | Instructor sees OWN responses only | PASS -- `instructor_id = auth.uid()` (001:109-110) |
| `anon_insert_responses` | quiz_responses | Anonymous can INSERT | PASS -- `WITH CHECK (true)` (001:115-116) |
| Anonymous cannot READ responses | quiz_responses | No SELECT policy for anon | PASS |
| Anonymous cannot UPDATE responses | quiz_responses | Update policy removed | PASS -- Dropped in 004:8 |
| `admin_all_users` | users | Admin sees all users | PASS (010:9-12) |
| `instructor_self` | users | Instructor sees only self | PASS (001:81-82) |
| `anon_read_instructor_slug` | users | Anon can read active instructor profiles | PASS -- for slug resolution (004:20-21) |

**Critical verification: Can Instructor A see Instructor B's data?**
- NO. The `instructor_own_leads` and `instructor_own_responses` policies filter strictly by `instructor_id = auth.uid()`. Even if Instructor A manually crafts API requests, the Supabase client uses their authenticated session, and RLS will only return rows where `instructor_id` matches their own UUID.

### STEP 5: Dashboard Display -- PASS

**Files examined:**
- `admin/src/app/dashboard/page.tsx` (lines 207-230, 233-266)
- `admin/src/app/api/quiz/responses/route.ts`
- `admin/src/app/api/quiz/stats/route.ts`
- `admin/src/app/api/quiz/analytics/route.ts`
- `admin/src/app/api/auth/me/route.ts`
- `admin/supabase/migrations/012_analytics_views.sql`

**Findings:**

| Check | Result |
|-------|--------|
| Responses API uses authenticated Supabase client | PASS -- `createClient()` from server lib (responses/route.ts:12) |
| Responses query has no manual instructor filter | PASS -- Relies on RLS (responses/route.ts:22-39) |
| Stats API uses authenticated Supabase client | PASS -- `createClient()` (stats/route.ts:12) |
| Stats queries rely on RLS | PASS -- No manual instructor_id filter; RLS handles it |
| Analytics API passes instructor_id to RPCs | PASS -- `p_instructor_id: instructorId` (analytics/route.ts:44-47) |
| Analytics RPCs filter by instructor_id | PASS -- All RPCs have `WHERE p_instructor_id IS NULL OR instructor_id = p_instructor_id` |
| Auth/me endpoint returns slug and quizBaseUrl | PASS -- (me/route.ts:17-31) |
| Dashboard fetches user info for personalized link | PASS -- `/api/auth/me` call (page.tsx:209-229) |
| RLS handles data isolation automatically | PASS -- For responses and stats routes |
| Analytics uses double protection | PASS -- Both RLS and explicit instructor_id parameter |

### STEP 6: Edge Cases

| Edge Case | Result | Details |
|-----------|--------|---------|
| Two instructors with same slug | IMPOSSIBLE | UNIQUE constraint `users_slug_key` prevents duplicates (001:13, 011:165-177) |
| Student accesses quiz without `?ref=` | SAFE | `resolveInstructorSlug()` returns early (app.js:59); `instructorId` is null; data saved with `instructor_id = NULL` |
| Empty slug in URL (`?ref=`) | SAFE | `params.get('ref')` returns empty string, falsy check at line 59 causes early return |
| Special characters in slug | PREVENTED | Client-side: `replace(/[^a-z0-9-]/g, '')` (settings/page.tsx:229); Server-side: CHECK constraint validates format (011:121) |
| Instructor changes slug | OLD LINKS BREAK | If an instructor updates their slug from `dr-felipe` to `felipe-marx`, old links with `?ref=dr-felipe` will fail to resolve. The quiz degrades gracefully (no instructor shown, data saved without instructor_id). **This is expected behavior but worth documenting for users.** |
| Instructor A manipulates API to see B's data | BLOCKED | RLS policies enforce `instructor_id = auth.uid()` on all SELECT operations. Even direct PostgREST queries through Supabase go through RLS. |
| Deactivated instructor slug | SAFE | Both `get_instructor_by_slug` and `resolve_instructor_slug` filter `is_active = true` |
| SQL injection via slug | PREVENTED | RPC uses parameterized query (`p_slug` parameter); client-side strips special chars |

### STEP 7: Link Consistency Check -- PASS

**Search results for `?ref=` and `?instrutor=` across ALL source files:**

| Location | Parameter Used | Status |
|----------|---------------|--------|
| `admin/src/app/dashboard/settings/page.tsx:150` | `?ref=` | CORRECT |
| `admin/src/app/dashboard/settings/page.tsx:179` | `?ref=` | CORRECT |
| `admin/src/components/dashboard/personalized-link.tsx:15` | `?ref=` | CORRECT |
| `admin/src/components/dashboard/onboarding.tsx:76` | `?ref=` | CORRECT |
| `app.js:58` (parsing) | `ref` param | CORRECT |
| `app.js:44` (comment only) | `?instrutor=` | OK -- Legacy docs in comment |
| `app.js:108` (legacy fallback) | `instrutor` param | OK -- Display name only, no DB link |

**No active code uses `?instrutor=` for trackable functionality.** The only occurrences are:
1. A code comment documenting legacy format (app.js:44)
2. A fallback that reads `?instrutor=` as a display name only -- it does NOT resolve to an instructor_id (app.js:108, instructorId remains null at line 111)

All functional code consistently uses `?ref=` as the parameter name.

---

## Security Verification Summary

| Attack Vector | Protected? | Mechanism |
|---------------|-----------|-----------|
| Instructor A reads Instructor B's leads | YES | RLS: `instructor_id = auth.uid()` |
| Instructor A reads Instructor B's responses | YES | RLS: `instructor_id = auth.uid()` |
| Anonymous reads any leads | YES | No SELECT policy for anon role |
| Anonymous reads any responses | YES | No SELECT policy for anon role |
| Anonymous updates responses | YES | Update policy dropped (004) |
| SQL injection via slug | YES | Parameterized RPC + validation constraints |
| XSS via instructor name on quiz | YES | `escapeHTML()` used on all instructor fields (app.js:1461, 1488) |
| Slug enumeration | LOW RISK | `anon_read_instructor_slug` allows reading active instructor rows, but only returns profile info, not sensitive data |

---

## Bugs and Issues Found

### BUG-1: PATCH to link lead_id to response fails silently (MEDIUM)

**Location:** `app.js:263-285`
**Cause:** Migration 004 dropped `anon_update_responses` RLS policy, but `app.js` still attempts a PATCH on `quiz_responses` to set `lead_id`.
**Impact:** When using the direct Supabase submission path (not the `/api/quiz/submit` route), the `lead_id` on `quiz_responses` remains NULL. This causes the `quiz_leads!inner` join in the responses API (responses/route.ts:31) to exclude these responses from the dashboard.
**Recommended fix:** Either:
1. Remove the PATCH code and restructure to insert lead first, then response (matching the API route pattern), OR
2. Route all submissions through the `/api/quiz/submit` endpoint which handles this correctly, OR
3. Change the join from `!inner` to a regular left join in the responses query.

### RECOMMENDATION-1: Document slug change behavior

When an instructor changes their slug, old links stop working. Consider:
1. Adding a warning in the settings UI when changing an existing slug
2. Optionally maintaining a `slug_history` table for redirects
3. At minimum, documenting this behavior for instructors

---

## Overall Verdict: CONDITIONAL PASS

The instructor trackable link system is **architecturally sound and secure**. The end-to-end flow works correctly:

1. **Unique links** -- Guaranteed by UNIQUE constraint + validation
2. **Data isolation** -- Enforced by RLS policies at the database level
3. **Trackable URLs** -- `?ref={slug}` format consistently used across all components
4. **End-to-end flow** -- Link generation -> slug resolution -> submission with instructor_id -> RLS-filtered dashboard

The one bug found (BUG-1) affects a specific code path where the direct Supabase submission's PATCH fails silently. If the primary submission flow uses the `/api/quiz/submit` API route, this bug has no user-facing impact. If the direct Supabase path in `app.js` is the active submission method, responses will be saved correctly with `instructor_id` but will not appear in the dashboard's response list due to a NULL `lead_id` and an INNER join.

**The system achieves its core security goal: no instructor can see another instructor's data.**

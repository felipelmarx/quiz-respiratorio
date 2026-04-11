# Stories Experience Feature — QA Audit Report

**Auditor:** Quinn, QA Guardian
**Date:** 2026-04-11
**Target:** PR #20 — Spotify Wrapped-style Stories result experience
**Commit:** 60732d9 (merged as 353933e)
**Scope:** `app.js`, `styles.css`, integration with `admin/src/app/api/quiz/submit/route.ts`

---

## Verdict

**FIX FIRST — DO NOT SHIP**

Two CRITICAL blockers and several HIGH severity issues block this release. The Stories experience looks wired correctly at first glance, but a CSS stacking bug renders the final conversion button non-functional, and the qualification form data (wellbeing, pains, commitment, schedule) is silently dropped before reaching the admin API. Real users would see a broken funnel and the instructor dashboard would receive ZERO of the new qualitative data.

---

## Check Matrix

| # | Check | Result |
|---|---|---|
| 1.1 | `startQuiz()` → `showWellbeingIntro()` | PASS |
| 1.2 | `submitWellbeingIntro()` → `showModeSelection()` | PASS |
| 1.3 | `finishQuiz()` → analyzing → `saveAnonymousResponse()` → `showLeadCapture()` | PASS |
| 1.4 | `submitLeadCapture()` → `showStoriesExperience()` (not `showResults()`) | PASS |
| 1.5 | `showStoriesExperience()` renders 13 cards | PASS (STORY_CARDS length = 13) |
| 1.6 | `storyNext` / `storyPrev` / tap zones / keyboard wired | PARTIAL — see BUG-01 |
| 1.7 | `openQualificationForm()` → `showQualificationForm()` → `submitQualificationFinal()` → `saveApplication()` | PASS (wiring) but broken by BUG-01 |
| 2.a | `wellbeingBefore` default on reload | PASS — `wellbeingBefore \|\| 5` fallback at line 2056, 1891 |
| 2.b | Video card lazy loading via `data-embed` | PASS — line 1853-1858 |
| 2.c | Tap zones vs buttons z-index | **FAIL — BUG-01 (CRITICAL)** |
| 2.d | Swipe handler cleanup | FAIL — BUG-04 (LOW-MEDIUM) |
| 2.e | Compare card with no wellbeingAfter | PASS — `after \|\| before` at line 2057 |
| 2.f | Keydown listener removed on close | PASS — line 1898 |
| 2.g | `saveApplication()` payload shape | **FAIL — BUG-02 (CRITICAL)** |
| 2.h | Hero score calculation consistency | PASS — identical formula to legacy (both use `100 - Math.round((totalScore/33)*100)`) |
| 2.i | YouTube video ID `zAvdtkmpz-8` | PASS — line 1705 |
| 2.j | `getProfileKey()` returns English keys | PASS — `functional/moderate/dysfunctional/severe`, matches CSS `[data-profile="..."]` |
| 3.1 | `stories-container` z-index 1000 + hides `.screen` | PASS — line 2702 CSS, line 1562 JS |
| 3.2 | Progress segments width transition | PASS — line 1920-1925 uses transition reflow |
| 3.3 | Tap zones positioned left 30% / right 70% | PASS (positioned), FAIL (stacking) |
| 3.4 | `100dvh` for mobile viewport | PASS — lines 2766, 2776 |
| 3.5 | Responsive `<380px` and `>=768px` | PASS — lines 3440, 3459 |
| 3.6 | `prefers-reduced-motion` | PASS — line 2584 (global) |
| 4.1 | Dashboard shows `wellbeing_*` in `extra_data` | **FAIL — BUG-03 (HIGH)** — no column, no display |
| 4.2 | `/api/quiz/submit` accepts extended `extra_data` | **FAIL — BUG-02** — schema strips silently |

---

## Bugs Found

### BUG-01 — CRITICAL — Story buttons are unclickable (CSS stacking context)
- **Files:** `styles.css:2807-2812` (`.story-content { position: relative; z-index: 5; }`), `styles.css:2820-2834` (`.story-tap-zone { z-index: 20; }`), `styles.css:3038-3085` (`.story-btn-primary`, `.story-btn-ghost { z-index: 25 }`)
- **Impact:** The `.story-content` wrapper creates a stacking context at `z-index: 5` inside `.stories-container`. Its descendant buttons have `position: relative; z-index: 25`, but that 25 only applies WITHIN story-content's local stacking context. Against the sibling `.story-tap-zone` elements (z-index 20, rendered in `.stories-container`'s outer stacking context), the entire story-content subtree is layered at `5 < 20`. Tap zones cover the buttons.
- **Consequences in the live flow:**
  - Card 8 (ctaPractice) "Começar prática" → click hits tap-right → calls `storyNext()` → advances to video card. Works by coincidence because the button's own handler is also `storyNext()`. But the ghost "Pular prática" button (which should call `storySkipPractice()`) **also** fires `storyNext()` — users can NEVER skip the practice.
  - Card 10 (wellbeingAfter) "Ver minha evolução" → click hits tap-right → `storyNext()` → skips `submitWellbeingAfter()`. `wellbeingAfter` remains `null`, compare card shows fallback "delta = 0" message. Emotional payoff broken.
  - Card 13 (ctaForm) "Quero me candidatar" → click hits tap-right → `storyNext()` → no-op (already at last card). **The user is TRAPPED on the final card and cannot reach the qualification form.** The only escape is the close button (top-right, z-index 40), which dismisses the whole experience. The conversion funnel is 100% dead.
  - Card 13 "Agora não, obrigada" ghost → closes (again, the tap zones fire storyNext which is a no-op, so nothing happens — but same outcome, user can't intentionally close via that ghost button).
- **Fix:** Remove `z-index: 5` from `.story-content`, OR set `pointer-events: none` on `.story-tap-zone` while allowing pointer events on a child element (Stories-app pattern), OR set `z-index: 25` on `.story-card` so the story content wins. Also consider giving the tap zones lower z-index than the content stacking context. Recommended minimal fix:
  ```css
  .story-tap-zone { z-index: 4; }   /* below .story-content (5) */
  .story-content  { /* unchanged */ }
  /* Buttons inside story-content stay on top because they're inside its context */
  ```
  And re-test to confirm swipe gestures still land correctly (the tap zones still receive touches in the margins around buttons).

### BUG-02 — CRITICAL — `extra_data` is silently dropped before reaching the admin API
- **Files:** `app.js:245-255` (`saveApplication` payload), `admin/src/lib/validations.ts:17-30` (`quizSubmissionSchema`)
- **Impact:** `submitQualificationFinal()` (line 2305-2337) carefully constructs `leadData.extra_data` containing `wellbeing_before`, `wellbeing_after`, `wellbeing_delta`, `pains`, `commitment`, `schedule`, and `source: 'stories_qualification'`. But `saveApplication()` at line 245 builds a new `payload` object with ONLY `{name, email, phone, referral, instructor_slug, answers, scores, total_score, profile}`. `extra_data` is never forwarded.
- Even if it were forwarded, the server zod schema does not declare `extra_data`, so it would be stripped by default.
- Even if both were fixed, the database table `quiz_leads` has no `extra_data` column (confirmed: `admin/supabase/migrations/001_initial_schema.sql:20-28`) and no later migration adds one (`grep -r "extra_data\|wellbeing" admin/supabase/migrations` returns nothing).
- **Cascading failure:** If `/api/quiz/submit` is unreachable, `saveLeadFallback()` at line 282 does `{...leadData, instructor_id}` — this DOES include `extra_data` and posts directly to `quiz_leads`. Since the column doesn't exist, PostgREST returns a 400 "column does not exist" error, and **the lead is lost entirely**. So the fallback makes the failure mode worse for the qualification path.
- **Fix sequence:**
  1. Add `extra_data JSONB` column to `quiz_leads` via a new migration.
  2. Extend `quizSubmissionSchema` with `extra_data: z.record(z.any()).optional()`.
  3. Update the API route to insert `extra_data: data.extra_data ?? null` into the lead insert.
  4. Update `saveApplication()` payload to include `extra_data: leadData.extra_data`.
  5. Update `saveLeadFallback()` to strip unknown fields or to only send valid columns.

### BUG-03 — HIGH — Instructor dashboard has zero awareness of new fields
- **Files:** entire `admin/src/app/dashboard/**/*.tsx` (grep for `wellbeing|extra_data|stories` returns zero matches).
- **Impact:** Even once BUG-02 is fixed at the write path, the read path (dashboard lead detail, responses page) will not surface `wellbeing_before`, `wellbeing_after`, `wellbeing_delta`, `pains`, `commitment`, `schedule`. Marketing/product insights from the Stories experience will be invisible to instructors. The dashboard will not break (the new fields are simply unused), but the value proposition of the feature is gated by this.
- **Fix:** Add an "Evolução de bem-estar" block to `admin/src/app/dashboard/responses/[id]/page.tsx` that shows Before/After bars + delta when `extra_data.wellbeing_before` is present. List pains/commitment/schedule in a "Qualificação" block. Non-blocking for ship but should land in the same deploy window.

### BUG-04 — MEDIUM — Swipe listener leak on re-entry + iframe video never stops
- **Files:** `app.js:1969-2000` (`attachStorySwipeHandlers`), `app.js:1896-1908` (`closeStories`)
- **Issue A — swipe leak:** `showStoriesExperience()` re-uses the existing `#stories-container` on re-entry (line 1553-1559) but calls `attachStorySwipeHandlers(container)` unconditionally (line 1603). Each invocation ADDS four new event listeners (touchstart, touchend, pointerdown, pointerup) without removing the previous set. In a single session where the user opens Stories → closes → re-opens, swipes will fire the navigation twice, then three times, then N times. This is unlikely to happen in the normal funnel (Stories is shown once), but the pattern is unsafe.
- **Issue B — iframe not stopped:** `closeStories()` hides the container and removes the keydown listener, but does not clear `story-video-iframe.src`. The YouTube embed continues playing audio in the background after closing — most noticeable when the user clicks "Quero me candidatar" which closes stories and opens the qualification form overlay; the breathwork audio keeps running during the form.
- **Fix:** Attach listeners only if `container.dataset.handlersAttached !== 'true'` and set the flag after attaching. In `closeStories()`, also run `const iframe = document.getElementById('story-video-iframe'); if (iframe) iframe.src = '';`. Also do the same when `goToStoryCard` leaves the video card.

### BUG-05 — MEDIUM — Orphaned anonymous quiz_response row per submission
- **Files:** `app.js:195-234` (`saveAnonymousResponse`), `app.js:240-278` (`saveApplication`)
- **Impact:** `saveAnonymousResponse()` stores the quiz response and captures `savedResponseId`, but `saveApplication()` never references that id — it hits `/api/quiz/submit` which creates a NEW row. Every completed funnel produces TWO rows in `quiz_responses`: one anonymous (no `lead_id`) and one linked. This doubles storage, inflates analytics, and makes the instructor dashboard harder to reason about.
- **Note:** This is a pre-existing issue (PR #20 did not introduce it — it was introduced earlier in 24a4391 "route quiz submissions through server API"). Flagging here because the Stories feature amplifies its visibility.
- **Fix:** Either (a) skip the anonymous save entirely and only save at the application step, or (b) extend the admin API to accept an optional `response_id` and PATCH the existing row to add the lead_id.

### BUG-06 — LOW — Compare bar fallback math on 0 wellbeingBefore
- **File:** `app.js:2059`
- **Issue:** `improvedPct = before > 0 ? Math.round((delta / before) * 100) : 0` — safe for division, but with `wellbeingBefore = null` the fallback `before || 5` kicks in. Never hits 0. Effectively fine but worth noting for edge testing.

### BUG-07 — LOW — Video aspect-ratio mismatch risk
- **File:** `styles.css:3098` (`.story-video-wrapper { aspect-ratio: 9/16; }`)
- **Issue:** If YouTube video `zAvdtkmpz-8` is not a Short (9:16), it will be pillarboxed inside the vertical frame. Verify the source video format. Not functional-blocking, visual only.

### BUG-08 — LOW — Swipe down-to-dismiss not implemented, but container has `touch-action: pan-y`
- **File:** `styles.css:2705`
- **Issue:** `touch-action: pan-y` permits vertical scroll, which interferes with horizontal swipe detection on mobile browsers that prefer native scroll. Consider `touch-action: none` on story cards with scrollable content already capped, or `touch-action: pan-x` on non-scrollable cards.

### BUG-09 — INFO — Category score max might not match computed `scores` ceilings
- **File:** `app.js:1662` (`pct = Math.min(100, Math.round((score / cat.maxScore) * 100))`)
- **Issue:** Defensive `Math.min(100, ...)` guards overflow; verified CATEGORY_ANALYSIS has maxScore set per category. No action needed — flagging as healthy.

---

## Recommendations (Priority Order)

1. **[BLOCKER]** Fix BUG-01 stacking context — minimal CSS change, high impact.
2. **[BLOCKER]** Fix BUG-02 data loss end-to-end:
   - Migration: `ALTER TABLE public.quiz_leads ADD COLUMN IF NOT EXISTS extra_data JSONB;`
   - Extend zod schema with optional `extra_data`.
   - Forward `extra_data` in `saveApplication` payload.
   - Strip unknown fields in `saveLeadFallback` (allowlist name/email/phone/referral/instructor_id).
3. **[HIGH]** Land BUG-03 dashboard display in the same deploy so the feature delivers business value.
4. **[MEDIUM]** Fix BUG-04 (iframe stop + swipe listener dedup).
5. **[MEDIUM]** Track BUG-05 as a follow-up cleanup PR.
6. **[LOW]** Confirm BUG-07 video format (spot-check in browser).
7. After fixes, run a full end-to-end smoke on mobile Safari, mobile Chrome, desktop Chrome:
   - Slider → quiz → analyzing → lead capture → all 13 story cards (keyboard, tap, swipe) → qualification form 3 steps → confirmation
   - Verify admin dashboard shows the new lead with wellbeing + qualification data
   - Verify the video stops when closing Stories
   - Verify skip-practice path jumps to empowerment correctly

---

## Overall Verdict

**FIX FIRST.** Two CRITICAL issues mean:
1. Real users on any device cannot complete the conversion funnel (tap-zone blocks the final CTA button).
2. Even if they could, the rich qualitative data that justified the Stories redesign (wellbeing delta, pains, commitment) is invisible to instructors because it's dropped at three layers (client payload, server schema, database column).

Ship readiness: **blocked.** Estimated fix time: 2-4 hours for BUG-01 + BUG-02 + regression smoke. BUG-03 can be a same-day follow-up PR.

---

*Audit trail: `app.js` lines 444-453, 458-503, 1026-1124, 1545-2104, 2112-2371 reviewed. `styles.css` lines 2584-2589, 2699-2835, 3038-3089, 3437-3479 reviewed. `admin/src/app/api/quiz/submit/route.ts` 1-139, `admin/src/lib/validations.ts` 17-30, `admin/supabase/migrations/001_initial_schema.sql` 20-40 reviewed.*

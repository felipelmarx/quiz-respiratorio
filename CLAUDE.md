# CLAUDE.md — Persistent Memory & Session Instructions

## Memory System

At the **start of every session**, read the following memory files to restore context:

```
memory/decisions.md   — Architectural and design decisions
memory/people.md      — Key people, roles, and relationships
memory/preferences.md — Project preferences, conventions, standards
memory/user.md        — User context, goals, and project overview
```

At the **end of every session** (or when significant decisions are made), update these files with any new information learned during the session.

## Decision Logging System

Every time a significant decision is made, **append a row to `memory/decisions.csv`** (pipe-delimited):
```
date|decision|reasoning|expected_outcome|review_date|status
```
- `date` — YYYY-MM-DD
- `decision` — What was decided
- `reasoning` — Why this choice was made
- `expected_outcome` — What we expect to happen
- `review_date` — date + 30 days (YYYY-MM-DD)
- `status` — `ACTIVE` (new) or `REVIEW DUE` (flagged by cron)

**Scripts:**
- `bash memory/review.sh` — Show decisions flagged for review
- `bash memory/cron-check.sh` — Check and flag decisions that hit their review date

**Cron setup** (daily at 9am):
```
0 9 * * * cd /path/to/quiz-respiratorio && bash memory/cron-check.sh
```

---

## Project Structure

```
quiz-respiratorio/
├── index.html, app.js, quiz-data.js, styles.css  → Public quiz (static site)
├── admin/                                          → Admin dashboard (Next.js 14 + Supabase)
├── memory/                                         → Persistent memory files
├── .aiox-core/                                     → ORION orchestration engine
├── AIOS/, Cerebrum/                                → AI agent infrastructure
└── Branding Book IBNR ibreathwork.html             → Brand identity guide
```

## Key Commands

- **Admin build**: `cd admin && npm run build`
- **Admin lint**: `cd admin && npm run lint`
- **Admin typecheck**: `cd admin && npx tsc --noEmit`
- **Quiz**: Static files, no build step — just serve root directory

## Conventions

- **Git branch**: Always develop on the branch specified in task instructions
- **Security**: Parameterized queries, input sanitization, no raw SQL concatenation
- **Branding**: Navy (#0A192F) + Gold (#C6A868), Playfair Display + Lato
- **Quality bar**: "Apple design + Disney experience" — premium, polished, intentional
- **Language**: Code in English, user-facing content in Portuguese (BR)

# Architecture

## System Overview

Quiz Respiratorio is a two-part application: a public-facing respiratory assessment quiz and an admin dashboard for managing results, instructors, and leads.

```
                    ┌─────────────────────┐
                    │    Public Quiz       │
                    │  (Static HTML/JS)    │
                    │   quiz-lac-phi       │
                    │    .vercel.app       │
                    └──────────┬──────────┘
                               │ POST /api/quiz/submit
                               ▼
                    ┌─────────────────────┐
                    │   Admin Dashboard    │
                    │   (Next.js 14)       │
                    │  quiz-respiratorio   │
                    │    .vercel.app       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Supabase         │
                    │  PostgreSQL + Auth   │
                    │  + RLS Policies      │
                    └─────────────────────┘
```

## Public Quiz

**Stack:** Vanilla HTML, CSS, JavaScript (no framework, no build step)

**Files:**
- `index.html` - Landing page with hero section and quiz entry
- `app.js` - Quiz engine: navigation, scoring, result generation
- `quiz-data.js` - Question definitions and scoring rules
- `styles.css` - Full styling (responsive, animations)

**Flow:**
1. User lands on `index.html`, enters name/email/phone
2. Quiz presents questions across 4 scoring dimensions
3. `app.js` calculates scores and determines risk profile
4. Results page shows detailed 9-step clinical report
5. Data submitted to admin API via `POST /api/quiz/submit`

**Scoring:**
- 4 dimensions scored independently (padrao, sintomas, consciencia, tolerancia)
- Total score determines risk profile: funcional / atencao_moderada / disfuncao / disfuncao_severa
- Instructor slug passed via URL parameter for attribution

## Admin Dashboard

**Stack:** Next.js 14 (App Router), TypeScript, Supabase, TailwindCSS

### Authentication Flow

```
User → Login/Signup → Supabase Auth → JWT Session → Middleware Check → Route Access
```

- Registration is invite-only (requires valid invite token)
- Middleware verifies session on every request
- Admin routes require `role: 'admin'`
- Instructor routes check granular permissions

### Role-Based Access

| Route Group | Admin | Instructor |
|-------------|-------|------------|
| `/dashboard` | Yes | Yes |
| `/dashboard/responses` | Yes | Own only |
| `/dashboard/contacts` | Yes | Own only |
| `/admin/*` | Yes | No |

### Data Flow

```
Quiz Submit → API Route → Validate Input → Supabase Insert → RLS Policy Check → Stored
Dashboard  → API Route → Auth Check → Permission Check → Supabase Query → RLS Filter → Response
```

## Database Schema

### Tables

**`users`** - Admin and instructor profiles
- Linked to Supabase Auth via `id`
- Contains role, permissions, slug, professional info
- `slug` enables personalized quiz links (`/quiz?instructor=slug`)

**`quiz_leads`** - Contact info from quiz takers
- Linked to `instructor_id` for attribution
- Stores name, email, phone, referral source

**`quiz_responses`** - Quiz answers and results
- Linked to `lead_id` and `instructor_id`
- Stores raw answers, dimension scores, total, profile

**`invite_tokens`** - Registration tokens
- Created by admins, single-use
- `is_active` flag prevents reuse

**`audit_logs`** - Action audit trail
- Tracks user actions for security compliance

### Row Level Security

All tables have RLS enabled:
- Admins can read/write all records
- Instructors can only access records linked to their `instructor_id`
- Public can only insert via quiz submission (with validation)

## Security Architecture

1. **Input Validation** - All API inputs validated and sanitized
2. **Parameterized Queries** - Supabase client handles SQL parameterization
3. **Rate Limiting** - Applied to public-facing endpoints
4. **CSRF Protection** - Token-based protection on mutations
5. **RLS** - Database-level access control
6. **Middleware** - Route-level auth enforcement
7. **Service Role Isolation** - Admin Supabase client only used server-side

## Deployment

Both apps deploy to Vercel from the same repository:

| Vercel Project | Root Directory | Framework |
|---------------|---------------|-----------|
| `quiz` | `/` (root) | Static |
| `quiz-respiratorio` | `admin/` | Next.js |

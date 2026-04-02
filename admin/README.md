# Quiz Respiratorio - Admin Dashboard

Next.js 14 admin dashboard for managing the Quiz Respiratorio platform. Built with TypeScript, Supabase, and TailwindCSS.

## Setup

```bash
cp .env.example .env.local   # Configure Supabase credentials
npm install
npm run dev                   # http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Application URL (e.g., `http://localhost:3000`) |

## Architecture

### App Router Structure

```
src/app/
├── (auth)/                    # Authentication pages
│   ├── login/page.tsx         # Login form
│   ├── signup/page.tsx        # Invite-only registration
│   └── reset-password/page.tsx
├── (public)/
│   └── quiz/page.tsx          # Public quiz embed
├── admin/                     # Admin-only section
│   ├── page.tsx               # Admin dashboard
│   ├── instructors/page.tsx   # Instructor management
│   └── settings/page.tsx      # Platform settings
├── dashboard/                 # Instructor/admin dashboard
│   ├── page.tsx               # Stats overview
│   ├── contacts/page.tsx      # Lead management
│   ├── responses/page.tsx     # Quiz response list
│   ├── responses/[id]/page.tsx # Response detail
│   └── settings/page.tsx      # User settings
└── api/                       # API routes (see below)
```

### API Routes

**Authentication:**
- `POST /api/auth/setup` - Initial admin user setup
- `POST /api/auth/signup` - Register with invite token
- `POST /api/auth/logout` - End session

**Quiz:**
- `POST /api/quiz/submit` - Submit quiz answers + scores
- `GET /api/quiz/responses` - Fetch quiz responses (paginated)
- `GET /api/quiz/stats` - Dashboard statistics (totals, averages, distribution)
- `GET /api/quiz/instructor` - Instructor-specific quiz data

**Admin:**
- `GET /api/admin/instructors` - List all instructors
- `PATCH /api/admin/instructors/[id]` - Update instructor profile
- `POST /api/admin/invite` - Generate invite token
- `POST /api/admin/sync-users` - Sync Supabase auth users with profiles
- `GET/POST /api/admin/integration` - Third-party integration config

### Components

**Dashboard:**
- `sidebar.tsx` - Navigation sidebar with role-based menu
- `stats-cards.tsx` - KPI cards (leads, responses, avg score)
- `export-csv-button.tsx` - CSV export for responses/leads
- `personalized-link.tsx` - Instructor personalized quiz link

**UI (shadcn-style):**
- `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`

### Library (`src/lib/`)

- `auth.ts` - Session helpers, user fetching
- `permissions.ts` - Role-based permission checks
- `validations.ts` - Input validation (email, phone, etc.)
- `utils.ts` - Utility functions (cn, formatters)
- `supabase/client.ts` - Browser Supabase client
- `supabase/server.ts` - Server-side Supabase client
- `supabase/admin.ts` - Admin Supabase client (service role)
- `types/database.ts` - TypeScript types for all database tables

### Middleware

`middleware.ts` handles:
- Auth session verification
- Route protection (redirect unauthenticated users to login)
- Admin route restriction (admin role required)

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full access: dashboard, admin panel, instructor management |
| `instructor` | Dashboard, responses, contacts, settings |

## Permissions

Each user has granular permissions:

- `view_dashboard` - Access dashboard page
- `view_responses` - View quiz responses
- `view_contacts` - View lead contacts
- `export_data` - Export CSV data
- `manage_settings` - Modify settings

## Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint check
npx tsc --noEmit  # TypeScript type check
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui pattern
- **Deployment**: Vercel

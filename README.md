# Quiz Respiratorio

Assessment tool for respiratory dysfunction and anxiety, developed for [IBNR](https://ibreathwork.com) (Instituto Brasileiro de Neurociencia Respiratoria).

## Overview

The project consists of two applications:

| Application | Stack | URL |
|-------------|-------|-----|
| **Public Quiz** | Vanilla HTML/CSS/JS (static) | [quiz-lac-phi.vercel.app](https://quiz-lac-phi.vercel.app) |
| **Admin Dashboard** | Next.js 14 + TypeScript + Supabase | [quiz-respiratorio.vercel.app](https://quiz-respiratorio.vercel.app) |

### Quiz Scoring Dimensions

1. **Padrao Respiratorio** - Breathing pattern assessment
2. **Sintomas Relacionados** - Related symptoms evaluation
3. **Consciencia Respiratoria** - Breathing awareness level
4. **Tolerancia ao CO2** - CO2 tolerance measurement

### Risk Profiles

- `funcional` - Functional breathing
- `atencao_moderada` - Moderate attention needed
- `disfuncao` - Dysfunction detected
- `disfuncao_severa` - Severe dysfunction

## Project Structure

```
quiz-respiratorio/
├── index.html              # Quiz landing page
├── app.js                  # Quiz logic (scoring, navigation, results)
├── quiz-data.js            # Questions and scoring rules
├── styles.css              # Quiz styling
├── admin/                  # Next.js 14 admin dashboard
│   ├── src/
│   │   ├── app/            # App Router pages and API routes
│   │   ├── components/     # UI and dashboard components
│   │   ├── lib/            # Auth, permissions, Supabase clients, types
│   │   └── middleware.ts   # Auth middleware
│   └── package.json
├── prototypes/             # Landing page design variants (A/B/C)
├── memory/                 # Persistent session context (AIOX)
├── .aiox-core/             # ORION orchestration engine
└── docs/                   # Project documentation
```

## Quick Start

### Public Quiz (Static Site)

No build step required. Serve the root directory with any static file server:

```bash
npx serve .
```

### Admin Dashboard

```bash
cd admin
cp .env.example .env.local   # Configure Supabase credentials
npm install
npm run dev                   # http://localhost:3000
```

### Environment Variables

**Admin (`admin/.env.local`):**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Application base URL |

## Admin Dashboard Features

- **Authentication** - Login, signup (invite-only), password reset
- **Dashboard** - KPI stats, quiz response overview
- **Responses** - View individual quiz results with detailed scores
- **Contacts/Leads** - Manage quiz leads with contact info
- **Instructor Management** - Admin panel for instructors with personalized links
- **CSV Export** - Export data for analysis
- **Settings** - User permissions and profile management

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/submit` | Submit quiz responses |
| GET | `/api/quiz/responses` | List quiz responses |
| GET | `/api/quiz/stats` | Dashboard statistics |
| GET | `/api/quiz/instructor` | Instructor-specific data |
| POST | `/api/auth/signup` | Register (invite-only) |
| POST | `/api/auth/logout` | End session |
| POST | `/api/auth/setup` | Initial admin setup |
| GET | `/api/admin/instructors` | List instructors |
| PATCH | `/api/admin/instructors/[id]` | Update instructor |
| POST | `/api/admin/invite` | Generate invite link |
| POST | `/api/admin/sync-users` | Sync user profiles |
| GET/POST | `/api/admin/integration` | Third-party integrations |

## Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Admin and instructor profiles (roles, permissions, slug) |
| `quiz_leads` | Contact information from quiz takers |
| `quiz_responses` | Quiz answers, scores, and risk profiles |
| `invite_tokens` | Invite-only registration tokens |
| `audit_logs` | User action audit trail |

## Development

```bash
# Lint
cd admin && npm run lint

# Type check
cd admin && npx tsc --noEmit

# Build
cd admin && npm run build
```

## Deployment

Both applications are deployed on **Vercel**:

- **Public Quiz**: Vercel project `quiz` — deploys root static files
- **Admin Dashboard**: Vercel project `quiz-respiratorio` — deploys `admin/` directory

## Design System

- **Colors**: Navy (`#0A192F`) + Gold (`#C6A868`)
- **Fonts**: Playfair Display (headings) + Lato (body)
- **Quality standard**: Premium, polished, intentional ("Apple design + Disney experience")
- **Language**: UI in Portuguese (BR), code in English

## Security

- Parameterized queries (no raw SQL concatenation)
- Input sanitization and validation
- Rate limiting on API endpoints
- CSRF protection
- Role-based access control (admin / instructor)
- Row Level Security (RLS) in Supabase
- Invite-only registration

## License

Private project. All rights reserved by IBNR.

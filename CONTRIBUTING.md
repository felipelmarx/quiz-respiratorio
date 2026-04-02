# Contributing

Guidelines for contributing to Quiz Respiratorio.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account (for admin dashboard)

### Getting Started

1. Clone the repository
2. Set up admin dashboard:
   ```bash
   cd admin
   cp .env.example .env.local
   npm install
   npm run dev
   ```
3. The public quiz requires no build step — serve root directory with any static server

## Code Conventions

### Language

- **Code**: English (variables, functions, comments)
- **User-facing content**: Portuguese (BR)

### Stack

| Component | Technology |
|-----------|-----------|
| Public Quiz | Vanilla HTML/CSS/JS (no framework) |
| Admin Dashboard | Next.js 14 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Styling | TailwindCSS (admin), plain CSS (quiz) |
| Deployment | Vercel |

### Design System

- **Colors**: Navy `#0A192F` + Gold `#C6A868`
- **Fonts**: Playfair Display (headings) + Lato (body)
- **Quality**: Premium, polished, intentional

### Security Rules

- Always use parameterized queries — never concatenate SQL
- Sanitize all user input
- Never expose service role keys to the client
- Keep RLS policies enforced in Supabase
- Validate at API boundaries

## Git Workflow

### Branch Naming

- Feature: `feature/description`
- Fix: `fix/description`
- Claude Code sessions: `claude/description-sessionId`

### Commit Messages

Follow conventional commits:

```
type: short description

type(scope): short description
```

Types: `feat`, `fix`, `security`, `chore`, `docs`, `refactor`

### Quality Checks

Before submitting changes, run:

```bash
cd admin
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript
npm run build         # Full build
```

## Project Structure

See [README.md](./README.md) for full project structure.

## API Changes

When modifying API routes:

1. Update TypeScript types in `admin/src/lib/types/database.ts`
2. Add input validation in the route handler
3. Update the API documentation in `docs/api.md`
4. Test both success and error paths

## Database Changes

When modifying the database schema:

1. Apply changes via Supabase Dashboard (SQL Editor)
2. Update TypeScript types in `admin/src/lib/types/database.ts`
3. Review and update RLS policies if needed
4. Document the change in `memory/decisions.md`

# Deployment Guide

## Platform

Both applications deploy on **Vercel** from the same GitHub repository.

## Vercel Projects

| Project | Root Directory | Framework | URL |
|---------|---------------|-----------|-----|
| `quiz` | `/` (root) | Static (Other) | quiz-lac-phi.vercel.app |
| `quiz-respiratorio` | `admin/` | Next.js | quiz-respiratorio.vercel.app |

## Environment Variables (Vercel)

### Admin Dashboard (`quiz-respiratorio`)

Set these in Vercel project settings > Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | `https://quiz-respiratorio.vercel.app` |

### Public Quiz (`quiz`)

No environment variables needed. The quiz submits to the admin dashboard API URL configured in `app.js`.

## Deploy Process

### Automatic Deployment

Both projects auto-deploy when changes are pushed to `main`:

1. Push to `main` branch
2. Vercel detects changes and triggers build
3. `quiz` project builds static files from root
4. `quiz-respiratorio` project runs `npm run build` in `admin/`

### Manual Deployment

Via Vercel Dashboard:
1. Go to project > Deployments
2. Click "Redeploy" on the latest deployment

## Build Verification

Before deploying, verify locally:

```bash
# Admin dashboard
cd admin
npm run lint          # No ESLint errors
npx tsc --noEmit      # No TypeScript errors
npm run build         # Successful build

# Public quiz
node -c app.js        # Valid JavaScript syntax
node -c quiz-data.js  # Valid JavaScript syntax
```

## Supabase Setup

### Required Tables

Run these in Supabase SQL Editor (Dashboard > SQL Editor):

1. `users` - Profiles with roles and permissions
2. `quiz_leads` - Lead capture from quiz
3. `quiz_responses` - Quiz answers and scores
4. `invite_tokens` - Registration invite tokens
5. `audit_logs` - Action audit trail

### RLS Policies

Ensure Row Level Security is enabled on all tables with appropriate policies:

- Admins: full read/write access
- Instructors: read/write own records only
- Public: insert-only on `quiz_leads` and `quiz_responses` via API

### Initial Admin Setup

After first deployment:

1. Navigate to `/api/auth/setup`
2. Create the initial admin account
3. Use the admin panel to invite instructors

## Troubleshooting

### Build Failures

```bash
cd admin && npm run build 2>&1 | tail -20
```

Common issues:
- Missing environment variables in Vercel
- TypeScript type errors (run `npx tsc --noEmit`)
- ESLint errors (run `npm run lint`)

### Auth Issues

- Check Supabase Auth settings (Site URL must match deployment URL)
- Verify `NEXT_PUBLIC_APP_URL` matches the actual deployment URL
- Check Supabase > Authentication > URL Configuration

### Database Connection

- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that RLS policies allow the operation
- Review Supabase logs (Dashboard > Logs)

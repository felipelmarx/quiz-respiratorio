# Authentication & Authorization Architecture

**Status:** Design Complete — Pending Implementation  
**Date:** 2026-04-02  
**Scope:** IBNR Quiz Platform Admin Dashboard (`/admin/`)

---

## Table of Contents

1. [Critical Problems (Current State)](#1-critical-problems-current-state)
2. [User Layers](#2-user-layers)
3. [Middleware Architecture](#3-middleware-architecture)
4. [API Auth Guard Pattern](#4-api-auth-guard-pattern)
5. [Layout Auth Pattern](#5-layout-auth-pattern)
6. [Route Access Matrix](#6-route-access-matrix)
7. [Data Flow Diagram](#7-data-flow-diagram)
8. [License Expiration Handling](#8-license-expiration-handling)
9. [Known Bugs to Fix During Implementation](#9-known-bugs-to-fix-during-implementation)
10. [Security Invariants](#10-security-invariants)

---

## 1. Critical Problems (Current State)

| # | Problem | File | Impact |
|---|---------|------|--------|
| P1 | Middleware is a no-op passthrough | `src/middleware.ts` line 4 | ALL routes publicly accessible |
| P2 | `/api/admin/instructors` POST has zero auth | `src/app/api/admin/instructors/route.ts` | Anyone can create instructors |
| P3 | `/api/admin/sync-users` POST has zero auth | `src/app/api/admin/sync-users/route.ts` | Anyone can trigger user sync |
| P4 | `/api/admin/invite` GET/POST has zero auth | `src/app/api/admin/invite/route.ts` | Anyone can read/generate invite tokens |
| P5 | Admin layout hardcodes `userName="Admin"` | `src/app/admin/layout.tsx` line 7 | Real user never displayed |
| P6 | Dashboard layout hardcodes `userName="Admin"` and `userRole="admin"` | `src/app/dashboard/layout.tsx` line 7 | Instructors see admin navigation |
| P7 | `isInstructor = false` hardcoded | `src/app/dashboard/page.tsx` line 27 | Instructor-specific UI never renders |
| P8 | Settings page generates `?instrutor=` but personalized-link component uses `?ref=` | `src/app/dashboard/settings/page.tsx` lines 35,62 | Broken quiz links for instructors |

**Note:** Some API routes (`/api/admin/instructors/[id]`, `/api/admin/integration`, `/api/quiz/stats`, `/api/quiz/responses`) DO call `getAuthUser()` and check roles. The pattern exists but was not applied consistently.

---

## 2. User Layers

| Layer | Role in DB | Dashboard Access | Data Scope |
|-------|-----------|-----------------|------------|
| **Super Admin** | `admin` | Full: `/admin/*` and `/dashboard/*` | ALL instructors, ALL quiz data |
| **Instructor** | `instructor` | `/dashboard/*` only | Own students only (via `instructor_id` + RLS) |
| **Student** | None (anonymous) | None | Takes quiz via public link, no dashboard access |

The `admin` role always bypasses granular permissions (enforced in `hasPermission()`). Instructors are governed by their `permissions` JSONB column.

---

## 3. Middleware Architecture

### 3.1 Design Principles

- Middleware runs on the Edge, so it CANNOT call `getAuthUser()` (which queries the `users` table).
- Middleware validates the **Supabase session exists** (JWT is present and not expired).
- Role-based authorization happens in layouts and API routes, NOT in middleware.
- Middleware refreshes the session token on every request (critical for `@supabase/ssr`).

### 3.2 Route Classification

```
PUBLIC ROUTES (no session required):
  /login
  /signup
  /reset-password
  /api/auth/setup
  /api/auth/signup
  /api/quiz/submit
  /api/quiz/instructor

PROTECTED ROUTES (valid session required):
  /admin/**
  /dashboard/**
  /api/admin/**
  /api/quiz/stats
  /api/quiz/responses
  /api/auth/logout

STATIC ASSETS (bypass middleware entirely):
  /_next/static/**
  /_next/image/**
  /favicon.ico
  /*.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp
```

### 3.3 Middleware Implementation Approach

```
File: src/middleware.ts

1. Create a Supabase client using createServerClient from @supabase/ssr
   - Use request.cookies for getAll()
   - Use response.cookies for setAll()
   - This is the MIDDLEWARE pattern (not the Server Component pattern)
   - Do NOT use cookies() from next/headers — it is unavailable in middleware

2. Call supabase.auth.getUser() to:
   a. Validate the JWT
   b. Refresh expired tokens (the cookie setAll handler writes new tokens)

3. Decision tree:
   - If route is PUBLIC: allow through (but still refresh tokens)
   - If route is PROTECTED and no user: redirect to /login (pages) or 401 (API)
   - If route is PROTECTED and user exists: allow through

4. Return the response (which carries updated cookie headers)
```

### 3.4 Matcher Configuration

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

This is already correct in the existing file. Keep it.

### 3.5 Middleware Pseudocode

```
function middleware(request: NextRequest):
  response = NextResponse.next({ request })

  supabase = createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for each cookie:
          request.cookies.set(cookie)   // for downstream server components
          response.cookies.set(cookie)  // for the browser
      }
    }
  })

  { data: { user } } = await supabase.auth.getUser()

  pathname = request.nextUrl.pathname

  if isPublicRoute(pathname):
    return response

  if !user:
    if pathname.startsWith('/api/'):
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    else:
      return NextResponse.redirect(new URL('/login', request.url))

  // Authenticated user trying to access auth pages → redirect to appropriate dashboard
  if isAuthRoute(pathname):
    return response  // or optionally redirect to dashboard

  return response
```

### 3.6 Public Route Check

```typescript
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/api/auth/setup',
  '/api/auth/signup',
  '/api/quiz/submit',
  '/api/quiz/instructor',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}
```

---

## 4. API Auth Guard Pattern

### 4.1 Reusable Guard Function

Create a new helper in `src/lib/auth.ts`:

```
Function: requireAuth(options?)
  options: { role?: 'admin' | 'instructor', permission?: Permission }
  Returns: { user: AuthUser } on success
  Throws/Returns: NextResponse with 401 or 403 on failure

Signature:
  async function requireAuth(options?: {
    role?: UserRole
    permission?: Permission
  }): Promise<AuthUser>

  On failure, throw an AuthError that the caller catches and converts to a response.
```

**Alternative (recommended for ergonomics):** Return a discriminated union:

```typescript
type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse }

async function requireAuth(options?: {
  role?: UserRole
  permission?: Permission
}): Promise<AuthResult>
```

### 4.2 Guard Logic

```
1. Call getAuthUser()
2. If null → return { ok: false, response: 401 "Nao autorizado" }
3. If options.role specified and user.role !== options.role AND user.role !== 'admin':
   → return { ok: false, response: 403 "Acesso negado" }
4. If options.permission specified and !hasPermission(user.role, user.permissions, permission):
   → return { ok: false, response: 403 "Sem permissao" }
5. If user.license_expires_at is in the past (for instructors):
   → return { ok: false, response: 403 "Licenca expirada" }
6. Return { ok: true, user }
```

### 4.3 Usage Pattern in API Routes

```typescript
// Before (BROKEN — no auth):
export async function POST(request: NextRequest) {
  const body = await request.json()
  // ... direct DB access ...
}

// After (SECURE):
export async function POST(request: NextRequest) {
  const auth = await requireAuth({ role: 'admin' })
  if (!auth.ok) return auth.response

  const { user } = auth
  const body = await request.json()
  // ... DB access scoped to user ...
}
```

### 4.4 Error Response Format

All auth errors return JSON with consistent shape:

```json
{
  "error": "Human-readable message in Portuguese"
}
```

| Status | Meaning | Message |
|--------|---------|---------|
| 401 | No valid session | `"Nao autorizado"` |
| 403 | Wrong role | `"Acesso negado"` |
| 403 | Missing permission | `"Sem permissao para esta acao"` |
| 403 | Expired license | `"Sua licenca expirou. Entre em contato com o administrador."` |

### 4.5 Per-Endpoint Auth Requirements

| Endpoint | Method | Required Auth |
|----------|--------|---------------|
| `POST /api/admin/instructors` | POST | `role: 'admin'` |
| `PATCH /api/admin/instructors/[id]` | PATCH | `role: 'admin'` (already implemented) |
| `GET /api/admin/invite` | GET | `role: 'admin'` |
| `POST /api/admin/invite` | POST | `role: 'admin'` |
| `POST /api/admin/sync-users` | POST | `role: 'admin'` |
| `GET /api/admin/integration` | GET | `role: 'admin'` (already implemented) |
| `POST /api/admin/integration` | POST | `role: 'admin'` (already implemented) |
| `GET /api/quiz/stats` | GET | `permission: 'view_dashboard'` (already implemented) |
| `GET /api/quiz/responses` | GET | `permission: 'view_responses'` (already implemented) |
| `POST /api/auth/logout` | POST | session only (any role) |
| `POST /api/auth/setup` | POST | **public** (setup key protects it) |
| `POST /api/auth/signup` | POST | **public** (invite token protects it) |
| `POST /api/quiz/submit` | POST | **public** (rate-limited, for students) |
| `GET /api/quiz/instructor` | GET | **public** (rate-limited, for quiz UI) |

---

## 5. Layout Auth Pattern

### 5.1 Problem

Both `src/app/admin/layout.tsx` and `src/app/dashboard/layout.tsx` hardcode:
```tsx
<Sidebar userName="Admin" userRole="admin" permissions={DEFAULT_PERMISSIONS} />
```

This means:
- Instructors see admin navigation links
- User's real name is never shown
- Permissions are never enforced in the sidebar

### 5.2 Server Component Data Fetching

Both layouts are already `async` server components. The fix is straightforward:

```
Pattern for BOTH layout files:

1. Call getAuthUser()
2. If null → redirect('/login')
3. If user exists, fetch full profile (name) from users table
4. For /admin/* layout: if user.role !== 'admin' → redirect('/dashboard')
5. For /dashboard/* layout: allow both admin and instructor
6. Pass real { userName, userRole, permissions } to <Sidebar />
```

### 5.3 Admin Layout (`src/app/admin/layout.tsx`)

```
async function AdminLayout({ children }):
  user = await getAuthUser()
  if (!user) → redirect('/login')
  if (user.role !== 'admin') → redirect('/dashboard')

  // Fetch display name
  supabase = await createClient()
  { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <Sidebar
      userName={profile?.name || 'Admin'}
      userRole={user.role}
      permissions={user.permissions}
    />
    <main>{children}</main>
  )
```

### 5.4 Dashboard Layout (`src/app/dashboard/layout.tsx`)

```
async function DashboardLayout({ children }):
  user = await getAuthUser()
  if (!user) → redirect('/login')

  supabase = await createClient()
  { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <Sidebar
      userName={profile?.name || 'User'}
      userRole={user.role}
      permissions={user.permissions}
    />
    <main>{children}</main>
  )
```

### 5.5 Auth Layout (`src/app/(auth)/layout.tsx`)

```
async function AuthLayout({ children }):
  // Optional: redirect already-logged-in users
  user = await getAuthUser()
  if (user):
    if (user.role === 'admin') → redirect('/admin')
    else → redirect('/dashboard')

  return children
```

### 5.6 Dashboard Page — Fix isInstructor

In `src/app/dashboard/page.tsx` line 27, replace:
```typescript
const isInstructor = false
```
With logic that reads the real user:
```typescript
const user = await getAuthUser()
const isInstructor = user?.role === 'instructor'
```

Or, since the layout already fetches the user, pass the role via a React context or a server-side prop pattern. The simplest approach: make the dashboard page a server component that calls `getAuthUser()` directly, since the Supabase client caches the session within a single request.

### 5.7 Sidebar — No Changes Needed

The `Sidebar` component interface (`userName`, `userRole`, `permissions`) is already correctly designed. It just needs to receive real data from the layouts instead of hardcoded values.

---

## 6. Route Access Matrix

| Route Pattern | Public? | Required Role | Required Permission | Notes |
|--------------|---------|---------------|--------------------|----|
| `/login` | Yes | - | - | Auth page |
| `/signup` | Yes | - | - | Invite-token gated |
| `/reset-password` | Yes | - | - | Auth page |
| `/admin` | No | `admin` | - | Admin dashboard home |
| `/admin/instructors` | No | `admin` | - | Manage instructors |
| `/admin/settings` | No | `admin` | - | Platform settings |
| `/dashboard` | No | `admin` or `instructor` | `view_dashboard` | Overview page |
| `/dashboard/responses` | No | `admin` or `instructor` | `view_responses` | Quiz responses list |
| `/dashboard/responses/[id]` | No | `admin` or `instructor` | `view_responses` | Single response detail |
| `/dashboard/contacts` | No | `admin` or `instructor` | `view_contacts` | Leads/contacts list |
| `/dashboard/settings` | No | `admin` or `instructor` | `manage_settings` | Instructor settings |
| `POST /api/auth/setup` | Yes | - | - | One-time admin setup (env key) |
| `POST /api/auth/signup` | Yes | - | - | Invite-token gated |
| `POST /api/auth/logout` | No | any | - | Sign out |
| `POST /api/admin/instructors` | No | `admin` | - | Create instructor |
| `PATCH /api/admin/instructors/[id]` | No | `admin` | - | Update instructor |
| `GET /api/admin/invite` | No | `admin` | - | Get invite token |
| `POST /api/admin/invite` | No | `admin` | - | Generate invite token |
| `POST /api/admin/sync-users` | No | `admin` | - | Sync auth users |
| `GET /api/admin/integration` | No | `admin` | - | Check integration |
| `POST /api/admin/integration` | No | `admin` | - | Test integration |
| `GET /api/quiz/stats` | No | any | `view_dashboard` | Dashboard stats |
| `GET /api/quiz/responses` | No | any | `view_responses` | Paginated responses |
| `POST /api/quiz/submit` | Yes | - | - | Public quiz submission |
| `GET /api/quiz/instructor` | Yes | - | - | Public instructor lookup |

---

## 7. Data Flow Diagram

### 7.1 Protected Page Request

```
Browser
  |
  | GET /admin/instructors
  v
MIDDLEWARE (Edge)
  |
  |-- createServerClient(@supabase/ssr) with request/response cookies
  |-- supabase.auth.getUser()
  |     |
  |     |-- JWT valid? Token refreshed? --> cookies updated on response
  |     |-- No user? --> 302 Redirect to /login
  |
  v
NEXT.JS SERVER (Node)
  |
  |-- Admin Layout (server component)
  |     |-- getAuthUser()
  |     |     |-- supabase.auth.getUser() [cached, same request]
  |     |     |-- SELECT role, is_active, permissions FROM users WHERE id = ?
  |     |     |-- Returns AuthUser { id, role, is_active, permissions }
  |     |
  |     |-- role !== 'admin'? --> redirect('/dashboard')
  |     |-- Renders <Sidebar userName={real_name} userRole={real_role} ... />
  |
  |-- Page Component (server component)
  |     |-- Fetches page-specific data via Supabase
  |     |-- RLS policies enforce data scoping automatically
  |
  v
Browser receives HTML with real user data
```

### 7.2 Protected API Request

```
Browser (fetch)
  |
  | POST /api/admin/instructors  { name, email, ... }
  v
MIDDLEWARE (Edge)
  |
  |-- supabase.auth.getUser()
  |-- No user? --> JSON { error: "Unauthorized" } 401
  |-- User exists? --> pass through
  |
  v
API ROUTE HANDLER (Node)
  |
  |-- const auth = await requireAuth({ role: 'admin' })
  |-- if (!auth.ok) return auth.response  // 401 or 403
  |
  |-- const { user } = auth
  |-- Validate request body (Zod)
  |-- Execute DB operation with adminClient
  |
  v
JSON Response { success: true, id: "..." }
```

### 7.3 Public Quiz Submission

```
Student Browser
  |
  | POST /api/quiz/submit  { name, email, answers, scores, ... }
  v
MIDDLEWARE (Edge)
  |
  |-- isPublicRoute('/api/quiz/submit') --> true
  |-- Still calls getUser() to refresh any existing tokens
  |-- Passes through regardless of auth state
  |
  v
API ROUTE HANDLER (Node)
  |
  |-- Rate limit check (IP-based)
  |-- Zod validation
  |-- Resolve instructor_slug --> instructor_id (via RPC)
  |-- INSERT into quiz_leads (anon client, RLS allows anon inserts)
  |-- INSERT into quiz_responses
  |
  v
JSON Response { success: true, lead_id: "..." }
```

### 7.4 RLS Data Scoping (Supabase Side)

```
Supabase RLS policies already in place:

  master_all_*    --> role = 'admin' in users table --> full access to all rows
  instructor_own_* --> role = 'instructor' --> access only WHERE instructor_id = auth.uid()
  anon_insert_*   --> anon key --> INSERT only on quiz_leads, quiz_responses

The server-side Supabase client (createClient from server.ts) uses the ANON key
with the user's JWT, so RLS is enforced automatically. This means:

  - Admin sees ALL quiz_leads and quiz_responses
  - Instructor sees ONLY rows where instructor_id = their user ID
  - No application-level WHERE clauses needed for data scoping (RLS handles it)

IMPORTANT: The admin client (service role key) bypasses RLS entirely.
Only use createAdminClient() for operations that genuinely need to bypass RLS
(user creation, sync, invite tokens).
```

---

## 8. License Expiration Handling

The `users` table has a `license_expires_at` column (nullable timestamp).

### 8.1 Where to Check

License expiration should be checked at the **application layer** (not middleware), because:
- Middleware cannot query the `users` table (Edge runtime limitation with current setup)
- The check requires comparing `license_expires_at` against the current date

### 8.2 Check Logic

Add to `getAuthUser()` or `requireAuth()`:

```
If user.role === 'instructor':
  If license_expires_at is not null AND license_expires_at < now:
    For API routes: return 403 with license expiration message
    For page routes: redirect to a /license-expired page
```

### 8.3 Expired License UX

- Create a simple `/license-expired` page that shows a message and contact info
- The middleware still allows the session (the user IS authenticated)
- The layout or `requireAuth()` catches the expiration and redirects/blocks
- Admin accounts NEVER have license checks (admins always bypass)

### 8.4 Inactive Accounts

The existing `getAuthUser()` already returns `null` for `is_active === false` (line 53 of `src/lib/auth.ts`). This effectively blocks inactive users at every auth check point. No changes needed.

---

## 9. Known Bugs to Fix During Implementation

### 9.1 Query Parameter Inconsistency (P8)

**File:** `src/app/dashboard/settings/page.tsx`

- Line 35 generates: `?ref=${data.slug}` (correct)
- Line 62 generates: `?instrutor=${slug}` (incorrect)

**Fix:** Line 62 should use `?ref=` to match the personalized-link component (`src/components/dashboard/personalized-link.tsx` line 15) and the quiz submission handler that reads `instructor_slug`.

### 9.2 isInstructor Hardcoded (P7)

**File:** `src/app/dashboard/page.tsx` line 27

**Fix:** Derive from `getAuthUser().role` as described in section 5.6.

### 9.3 Auto-Created Users Get All Permissions

**File:** `src/lib/auth.ts` lines 37-42

When a user exists in Supabase Auth but not in the `users` table, `getAuthUser()` auto-creates them as an instructor with `DEFAULT_PERMISSIONS` (which grants everything including `export_data` and `manage_settings`). This is overly permissive.

**Fix:** Use restricted defaults for auto-created instructor profiles:
```
permissions: {
  view_dashboard: true,
  view_responses: true,
  view_contacts: true,
  export_data: false,
  manage_settings: false,
}
```

---

## 10. Security Invariants

These MUST hold true after implementation. Use as a checklist for code review:

1. **No unauthenticated access to `/admin/*` or `/dashboard/*` pages.** Middleware redirects to `/login`.
2. **No unauthenticated access to `/api/admin/*` endpoints.** Middleware returns 401.
3. **Every `/api/admin/*` route calls `requireAuth({ role: 'admin' })`.** No exceptions.
4. **Every `/api/quiz/stats` and `/api/quiz/responses` route calls `requireAuth()` with the appropriate permission.**
5. **Layouts fetch real user data via `getAuthUser()` and pass it to `<Sidebar />`.** No hardcoded values.
6. **Admin layout rejects non-admin users** with a redirect to `/dashboard`.
7. **RLS policies remain the primary data-scoping mechanism.** Application code does NOT manually add `WHERE instructor_id = X` filters — RLS handles this via the authenticated Supabase client.
8. **The service-role admin client (`createAdminClient`) is NEVER used in contexts where RLS should apply.** It is only for: user creation, user sync, invite token management.
9. **Expired licenses block instructor access** at the `requireAuth()` level with a clear message.
10. **Public routes (`/api/quiz/submit`, `/api/quiz/instructor`) remain public** and are protected by rate limiting, not auth.

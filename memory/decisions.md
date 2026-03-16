# Decisions Log

Architectural and design decisions made throughout the project.

---

## 2026-03-16 — Repository & Vercel Cleanup

- **Keep 2 Vercel projects**: `quiz` (public quiz, root `/`) and `quiz-respiratorio` (admin dashboard, root `admin/`)
- **Delete 3 duplicates**: `testefelipe-gwoz`, `testefelipe-k5gr`, `dashboard-crm`
- **vercel.json** created at root for static quiz routing with security headers
- **Admin stack**: Next.js 14 + Supabase + TypeScript (in `admin/`)
- **Quiz stack**: Vanilla HTML/CSS/JS (static site at root)

## 2026-03-16 — Admin Dashboard Security Fixes

- Fixed all SQL injection vulnerabilities — switched to parameterized queries
- Fixed XSS vulnerabilities — added input sanitization with DOMPurify-style escaping
- Added rate limiting to API routes
- Added CSRF protection
- All TypeScript errors resolved, ESLint clean, build passes

## 2026-03-16 — Landing Page Redesign (In Progress)

- Goal: "Apple design meets Disney experience" — premium, animated hero section
- Research phase: studying Awwwards winners, GSAP/Framer Motion/Three.js techniques
- Must align with IBNR Branding Book (Navy #0A192F + Gold #C6A868, Playfair Display + Lato)
- Breathing/lung animation as central visual element
- Scope: welcome screen (Screen 1) redesign — the one-page hero section

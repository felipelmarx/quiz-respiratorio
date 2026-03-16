# Preferences

Project preferences, conventions, and standards.

---

## Design & Branding

- **Primary palette**: Navy (#0A192F) + Gold (#C6A868) — from IBNR Branding Book
- **Fonts**: Playfair Display (headings, authority) + Lato (body, clarity)
- **Style**: Premium, academic, Apple-like minimalism with Disney-level delight
- **Animations**: Organic, breathing-themed, flowing air motifs
- **No cheap effects**: Everything must feel intentional and polished

## Code & Architecture

- **Quiz (public)**: Vanilla HTML/CSS/JS — static site, no build step
- **Admin**: Next.js 14 + TypeScript + Supabase
- **Language in code**: English for code, Portuguese (BR) for user-facing content
- **Security first**: Parameterized queries, input sanitization, rate limiting
- **Git branch**: `claude/check-repo-access-P5z5o` for current development

## Communication

- **User language**: Portuguese (BR)
- **Respond in**: English (as per system instructions), but user-facing content in Portuguese
- **Agent system name**: ORION (orchestration engine within AIOX framework)

## Deployment

- **Platform**: Vercel
- **Quiz URL**: quiz-lac-phi.vercel.app (project: `quiz`)
- **Admin URL**: quiz-respiratorio.vercel.app (project: `quiz-respiratorio`, root: `admin/`)

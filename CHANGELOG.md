# Changelog

All notable changes to Quiz Respiratorio.

## [Unreleased]

### Added
- Project documentation (README, CHANGELOG, CONTRIBUTING, docs/)
- GitHub issue and PR templates

## [2026-03-21]

### Added
- Password reset flow for authenticated users
- Admin setup/diagnostic endpoint for login troubleshooting

### Fixed
- RLS policies: renamed `master` role to `admin` across entire codebase
- Auto-create missing user profiles on login

## [2026-03-18]

### Fixed
- Input text color set to dark gray for better readability

## [2026-03-16]

### Added
- Persistent memory system and CLAUDE.md session instructions
- 3 landing page prototypes (Green, Navy+Gold, Hybrid) for A/B comparison
- Decision logging system with review cycle

### Security
- Removed hardcoded credentials from codebase
- Fixed XSS vulnerabilities in quiz output
- Synced quiz files between root and admin
- Fixed SQL injection risks with parameterized queries

## [2026-03-15]

### Added
- WhatsApp clickable links for instructor contacts
- License management system for instructors
- API integration endpoints
- Personalized instructor links with slug-based resolution
- Invite link signup system for instructors
- CSV export for quiz responses and leads

### Fixed
- Personalized link card shows warning when slug is missing
- Confirmation dialog before generating new invite link

### Changed
- Redesigned Welcome/Hero screen with premium Apple-like design

## [2026-03-14]

### Added
- Force-dynamic to API routes that use cookies (Vercel compatibility)
- Admin dashboard with full CRUD for instructors
- Quiz result report with 9-step clinical layout

### Changed
- Redesigned quiz landing page with Apple/Disney aesthetics and iBreathwork logo
- Redesigned quiz result page with 8-block Disney-level structure

### Security
- Deep security hardening: default-deny permissions
- Removed admin client from public endpoints
- Fixed injection, open redirect vulnerabilities
- Added rate limiting and security headers
- Fixed permissions infinite redirect bug

## [2026-03-13]

### Added
- Initial quiz implementation (HTML/CSS/JS static site)
- Admin dashboard (Next.js 14 + Supabase)
- Authentication system (login, signup, invite-only)
- Dashboard with stats, responses, contacts
- Supabase integration with RLS policies

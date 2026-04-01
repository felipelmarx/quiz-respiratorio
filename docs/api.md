# API Reference

All API routes are located in `admin/src/app/api/`. Base URL: `https://quiz-respiratorio.vercel.app`

## Authentication

### POST /api/auth/setup

Initial admin user setup. Creates the first admin account.

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "securePassword"
}
```

### POST /api/auth/signup

Register a new instructor account. Requires a valid invite token.

**Body:**
```json
{
  "email": "instructor@example.com",
  "password": "securePassword",
  "name": "Instructor Name",
  "token": "invite-token-string"
}
```

### POST /api/auth/logout

End the current session. Requires authentication.

---

## Quiz

### POST /api/quiz/submit

Submit quiz responses. Public endpoint (no auth required).

**Body:**
```json
{
  "name": "Patient Name",
  "email": "patient@email.com",
  "phone": "+5511999999999",
  "referral": "google",
  "instructor_slug": "instructor-slug",
  "answers": { "q1": "a", "q2": "b" },
  "scores": {
    "padrao": 7,
    "sintomas": 5,
    "consciencia": 8,
    "tolerancia": 6
  },
  "total_score": 26,
  "profile": "atencao_moderada"
}
```

**Response:** `201 Created`

### GET /api/quiz/responses

List quiz responses. Requires authentication.

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Results per page

**Response:**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### GET /api/quiz/stats

Dashboard statistics. Requires authentication.

**Response:**
```json
{
  "totalLeads": 500,
  "totalResponses": 450,
  "averageScore": 22.5,
  "profileDistribution": {
    "funcional": 120,
    "atencao_moderada": 200,
    "disfuncao": 100,
    "disfuncao_severa": 30
  },
  "recentLeads": [...]
}
```

### GET /api/quiz/instructor

Instructor-specific quiz data. Requires authentication. Returns data filtered by the authenticated instructor's ID.

---

## Admin

All admin endpoints require authentication with `role: 'admin'`.

### GET /api/admin/instructors

List all instructors.

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "instructor@email.com",
    "name": "Instructor Name",
    "role": "instructor",
    "slug": "instructor-name",
    "is_active": true,
    "whatsapp": "+5511999999999",
    "profissao": "Fisioterapeuta",
    "cidade": "Sao Paulo",
    "license_expires_at": "2027-01-01T00:00:00Z"
  }
]
```

### PATCH /api/admin/instructors/[id]

Update an instructor's profile.

**Body:** Any subset of instructor fields:
```json
{
  "name": "Updated Name",
  "is_active": false,
  "permissions": {
    "view_dashboard": true,
    "view_responses": true,
    "view_contacts": false,
    "export_data": false,
    "manage_settings": false
  }
}
```

### POST /api/admin/invite

Generate a new invite token for instructor registration.

**Response:**
```json
{
  "token": "generated-token-string",
  "invite_url": "https://quiz-respiratorio.vercel.app/signup?token=..."
}
```

### POST /api/admin/sync-users

Sync Supabase Auth users with the `users` profile table. Creates missing profiles.

### GET/POST /api/admin/integration

Manage third-party integration settings.

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Description of the error"
}
```

Common HTTP status codes:
- `400` - Bad request (validation failure)
- `401` - Unauthorized (missing/invalid session)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limited
- `500` - Internal server error

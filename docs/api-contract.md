# SkillForge API Contract

All application endpoints are versioned with prefix `/api/v1/`.

## 1. Authentication & Profile
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/logout/`
- `GET  /api/v1/auth/me/`
- `GET  /api/v1/profile/`
- `PATCH /api/v1/profile/`

## 2. Catalog & Practice
- `GET  /api/v1/languages/`
- `GET  /api/v1/languages/{slug}/topics/`
- `POST /api/v1/practice-sessions/`
- `GET  /api/v1/practice-sessions/`
- `GET  /api/v1/practice-sessions/{id}/`
- `POST /api/v1/practice-sessions/{id}/next-challenge/`
- `POST /api/v1/practice-sessions/{id}/complete/`
- `POST /api/v1/practice-sessions/{id}/abandon/`

## 3. Challenges & Submissions
- `GET  /api/v1/challenges/{id}/`
- `POST /api/v1/submissions/`
- `GET  /api/v1/submissions/{id}/`
- `GET  /api/v1/submissions/{id}/evaluation/`
- `POST /api/v1/hints/`
- `POST /api/v1/challenges/{id}/similar/`

## 4. Skills & History
- `GET  /api/v1/skills/`
- `GET  /api/v1/skills/{language_slug}/`
- `GET  /api/v1/history/`
- `GET  /api/v1/dashboard/`

## 5. Health Check
- `GET  /api/v1/health/` -> `{ "status": "ok", "database": "connected" }`

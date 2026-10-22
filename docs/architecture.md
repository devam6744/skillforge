# SkillForge Architecture

## 1. System Overview
SkillForge is an AI-powered adaptive coding practice platform designed as a **Modular Monolith**:
- **Frontend**: React + TypeScript + Vite.
- **Backend**: Django + Django REST Framework (DRF) exposing versioned `/api/v1/` endpoints.
- **Database**: Managed PostgreSQL on Supabase, accessed exclusively via Django ORM & migrations.
- **AI Service**: Google Gemini API isolated behind an internal backend adapter.
- **Safety**: Code submitted by users is treated as untrusted text and is NEVER executed.

## 2. High-Level Diagram
```text
Browser
  └── React + TypeScript + Vite
        └── HTTPS / JSON → Django REST Framework (/api/v1/)
                              ├── accounts / users
                              ├── catalog
                              ├── practice / challenges
                              ├── submissions / evaluation
                              ├── skills / adaptive
                              ├── PostgreSQL (Supabase) via Django ORM
                              └── AI Service Adapter → Google Gemini API
```

## 3. Core Boundaries
- **No Direct DB Access from Frontend**: React never connects directly to Supabase tables or PostgreSQL.
- **No Client-side AI Calls**: React never calls Gemini API directly.
- **Synchronous-to-Async Migration Path**: Initial evaluation is synchronous or bounded; API contracts support moving to background queue without breaking client contracts.

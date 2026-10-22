# SkillForge — AI-Powered Adaptive Coding Practice Platform

SkillForge is an engineering-first, AI-assisted coding practice platform. It generates language-specific coding challenges, reviews submitted code with Google Gemini, records evidence of demonstrated skills, and adaptively selects future practice.

## Core Architectural Principles
- **No Direct Frontend-to-DB/AI Connections**: React communicates only via versioned REST APIs (`/api/v1/`) with Django REST Framework.
- **Authoritative Backend**: Django is the single source of truth for authentication, session lifecycle, skill evidence, and persistence.
- **PostgreSQL via Supabase**: Managed database layer accessed exclusively through Django ORM and migrations.
- **Safety First**: Code is submitted as untrusted text and is never executed or rendered as raw HTML.
- **Isolated AI Service**: Gemini API calls live behind an internal service interface with strict schema validation, timeouts, bounded retries, and cost quotas.

## Repository Layout
```text
skillforge/
├── frontend/             # React + TypeScript + Vite
├── backend/              # Django + Django REST Framework + Supabase ORM
├── docs/                 # Architectural blueprints & documentation
└── .github/workflows/    # CI/CD pipelines
```

## Quick Start

### 1. Prerequisites
- Python 3.12+ (or 3.14)
- Node.js 20+ & npm 10+
- Git

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Documentation
See [`docs/SkillForge_V1_Development_Blueprint.md`](docs/SkillForge_V1_Development_Blueprint.md) for full architectural specifications, schema design, and implementation roadmaps.

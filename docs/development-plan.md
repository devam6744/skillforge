# SkillForge SDLC Development Plan

## Phase 0: Project Foundation (Current)
- [x] Git repository initialization and remote setup (`https://github.com/devam6744/skillforge.git`)
- [x] Environment and secret protection (`.gitignore`, `.env.example`)
- [x] Core documentation & architectural blueprint
- [ ] Backend Django modular monolith setup (`backend/config`, `backend/apps/`)
- [ ] Supabase PostgreSQL database connection verification & health check endpoint
- [ ] Frontend React + TypeScript + Vite build and dev setup
- [ ] CI pipeline skeleton (`.github/workflows/ci.yml`)
- [ ] Initial git commit & push to GitHub

## Phase 1: Identity and Profile
- Custom User model (email as primary identifier)
- Registration, login, logout, password reset, email verification
- UserProfile & Onboarding preferences
- Permissions & session authentication

## Phase 2: Catalog & Practice Lifecycle
- Languages & topics seed data (C, C++, Java, Python, JavaScript)
- PracticeSession lifecycle (Topic & Mixed mode, difficulty, length)
- Session challenge sequencing

## Phase 3: Challenge Generation
- Gemini AI Service Adapter with prompt versioning
- Challenge generation schema validation & persistence
- Safe error handling & deduplication

## Phase 4: Submission & Evaluation
- Code submission endpoint with size bounds & idempotency
- Gemini code evaluation pipeline (rubric, score, feedback)
- Graceful degradation on AI failure

## Phase 5: Learning Loop
- Deterministic skill evidence scoring engine
- Adaptive challenge selection engine
- Directional hints and similar challenge logic

## Phase 6: Dashboard & History
- User dashboard, skill trends, session history
- Aggregated analytics & query optimization

## Phase 7: Admin & Operational Governance
- Django admin governance
- Quota tracking & audit logs

## Phase 8: Production Hardening
- Final security review, CORS/CSRF headers
- Production deployment readiness

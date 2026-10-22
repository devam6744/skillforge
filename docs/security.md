# SkillForge Security Principles

## 1. Secrets & Credentials Management
- Zero secrets committed to git.
- `.env` is strictly ignored by `.gitignore`.
- Vite frontend never receives backend secrets or API keys. Only public `VITE_` variables are allowed.

## 2. Code Untrusted Execution Policy
- SkillForge NEVER compiles or executes user submitted code.
- User code is stored as text and analyzed statically via Gemini AI prompts.
- All code rendering in UI is escaped (Monaco Editor / code blocks); no `dangerouslySetInnerHTML`.

## 3. Prompt Injection Defense
- User submitted code and comments are treated as untrusted data.
- AI system prompts use strong boundary delimiters and explicit negative constraints.
- AI responses must conform to rigid JSON schemas before being accepted.

## 4. Rate Limiting & Cost Control
- Auth endpoints have brute-force protections.
- AI endpoints (challenges, evaluations, hints) have strict per-user and per-session quotas.
- Idempotency keys prevent duplicate submission billing.

# SkillForge V1 — Development Blueprint & Implementation Guide

**Purpose:** This is the implementation source of truth for SkillForge V1. Give this file to the coding agent before asking it to implement any feature. Build incrementally, test each phase, and do not silently change requirements.

**Product:** SkillForge is an AI-powered adaptive coding-practice platform. It generates language-specific coding challenges, reviews submitted code with Gemini, records evidence about demonstrated skills, and uses that evidence to choose future practice.

**Core loop:** Practice setup → Challenge → Code submission → AI evaluation → Validated skill evidence → Skill update → Adaptive next challenge → Progress history.

---

## 1. Non-negotiable V1 scope

### Included
- Registration, email/password login, Google OAuth, email verification, password reset, logout/session management, account deletion.
- User profile: display name, optional unique username, optional bio, optional profile picture only if managed storage is configured.
- Onboarding: preferred language and initial self-reported level.
- Languages: C, C++, Java, Python, JavaScript.
- Language-specific topics.
- Topic Practice and Mixed Practice.
- Difficulty: Easy, Medium, Hard, Adaptive.
- Modes: Coding Practice and Debug Mode.
- Session lengths: 5, 10, 20 questions.
- AI-generated challenges.
- Browser code editor; code is submitted as text and is never executed.
- AI code analysis with score, reasoning, issues, strengths, weak concepts, and improvement actions.
- Conceptual/approach/directional hints; no direct full solution.
- Similar Challenge.
- Evidence-based topic skill tracking.
- Deterministic/testable adaptive challenge selection.
- Session summaries, history, dashboard, admin governance, usage/security monitoring.
- Automated tests, CI, logging, deployment documentation.

### Explicitly excluded
- Running/compiling user code, test-case execution, sandbox/container execution.
- Claims about exact runtime, memory usage, compiler output, or verified pass/fail.
- Teacher/classroom mode.
- MCQ/theory modules or OS/Networking/DBMS content.
- Microservices, Kubernetes, Kafka, and infrastructure added only for appearances.
- Manually writing every challenge as an admin workflow.
- Multiple AI providers in V1.

### Product promise
Use wording such as “AI analysis suggests…” and “estimated score based on the review rubric.” Do not claim execution-verified correctness.

---

## 2. Locked technology decisions and conditional choices

| Area | V1 choice | Reason / rule |
|---|---|---|
| Frontend | React + TypeScript + Vite | Interactive editor, session state, dashboards |
| Backend | Django + Django REST Framework | Mature backend, ORM, auth, admin, APIs |
| Architecture | Modular monolith | Clear boundaries without distributed-system overhead |
| Database | PostgreSQL managed by Supabase | Managed database; Django remains the only application data-access layer |
| Authentication | Django auth + maintained Google OAuth integration | Keep SkillForge user/account logic under Django |
| AI | Gemini API behind an internal AI service interface | One provider initially; provider-specific code isolated |
| Editor | Monaco Editor or a maintained equivalent | Editing only; no execution |
| API style | Versioned REST `/api/v1/` | Clear API contract |
| Repo | One repository with `frontend/`, `backend/`, `docs/` | Easier project-wide context and CI |
| Rate limiting | Backend controls from the beginning; exact shared-store implementation depends on deployment topology | Must protect expensive endpoints and auth |
| Cache/Redis | Not a mandatory initial dependency | Add only if shared rate limits, caching, or background jobs justify it |
| Background jobs | Start synchronous for the simplest working vertical slice; introduce a queue if AI latency/timeouts make synchronous requests unreliable | Do not add a queue just to look advanced |
| Email | Transactional email provider for verification/reset | Credentials and sender settings in environment variables |
| File storage | No profile-image upload until managed object storage is configured | Avoid ephemeral/local production file storage |
| CI | GitHub Actions | Lint, tests, frontend build, dependency/security checks |
| Hosting | Choose after a current free-tier/region/limits check | Never hardcode assumptions about free plans |

### Important architecture choices
- React never connects directly to PostgreSQL/Supabase tables.
- React never calls Gemini directly.
- Django is authoritative for identity, permissions, business logic, skill state, and persistence.
- Use Django ORM and migrations. Do not create a second frontend-side database access path.
- Use secure server-side session authentication for a same-site browser deployment where feasible. If deployment topology requires bearer tokens, document why and implement the chosen token strategy consistently. Do not add JWT just because it sounds advanced.
- Treat all user-submitted code as untrusted text.
- Validate every Gemini response against a schema before business logic consumes it.
- AI output must never directly update permanent skill values.
- All external calls need timeouts, bounded retries where safe, failure handling, and usage/cost controls.
- Never commit secrets.

---

## 3. High-level architecture

```text
Browser
  └── React + TypeScript + Vite
        └── HTTPS / JSON → Django REST Framework
                              ├── Accounts / Profile
                              ├── Practice / Challenge
                              ├── Submission / Evaluation
                              ├── Skills / Adaptive
                              ├── Hints / Analytics
                              ├── Admin / Audit
                              ├── PostgreSQL (Supabase) via Django ORM
                              └── AI service interface → Gemini API
```

The backend is a **modular monolith**: one deployable Django application with internal module boundaries. Modules call application services, not each other’s private internals. Avoid circular imports and avoid making one generic “utils” file contain business logic.

### Request path example: submission
1. React sends code, challenge ID, and an idempotency/request key to the submission endpoint.
2. DRF authenticates the user, checks ownership of the active session/challenge, validates size and allowed state, and applies rate limits.
3. Django persists the submission before calling the AI provider.
4. Evaluation service builds a bounded prompt from the stored challenge, language, topic, rubric, and submitted code.
5. Gemini returns structured evaluation data.
6. The backend validates schema, field ranges, allowed enums, and response size.
7. A valid evaluation is stored. An invalid/failed AI response is recorded as failed/pending without corrupting skill state.
8. Skill evidence is derived from the evaluation using application rules.
9. Skill engine updates the topic skill state transactionally.
10. Adaptive engine selects the next challenge requirements; it does not blindly trust a model-generated recommendation.
11. React receives the submission/evaluation status and renders the result.

For the first version, the evaluation may happen synchronously if latency and hosting request limits allow it. If it does not, return a submission ID/status and move evaluation to a background worker. Keep the API response contract compatible with that later change.

---

## 4. Repository and backend structure

```text
skillforge/
├── frontend/
│   ├── src/
│   │   ├── app/                 # Router, providers, app shell
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── onboarding/
│   │   │   ├── dashboard/
│   │   │   ├── practice/
│   │   │   ├── challenges/
│   │   │   ├── submissions/
│   │   │   ├── evaluation/
│   │   │   ├── skills/
│   │   │   ├── history/
│   │   │   └── admin/            # Only if custom admin UI is needed
│   │   ├── components/           # Shared UI, editor wrapper, feedback components
│   │   ├── services/             # Typed API client only; no direct DB/AI access
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── .env.example
├── backend/
│   ├── manage.py
│   ├── config/                   # Settings, URLs, ASGI/WSGI
│   ├── apps/
│   │   ├── accounts/
│   │   ├── users/
│   │   ├── catalog/              # Languages and topics
│   │   ├── practice/
│   │   ├── challenges/
│   │   ├── submissions/
│   │   ├── evaluation/
│   │   ├── skills/
│   │   ├── adaptive/
│   │   ├── hints/
│   │   ├── analytics/
│   │   └── audit/
│   ├── tests/
│   ├── requirements/             # Or one pinned requirements file initially
│   └── .env.example
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api-contract.md
│   ├── security.md
│   ├── decisions/                # Short ADRs for meaningful choices
│   └── development-plan.md
├── .github/workflows/ci.yml
├── .gitignore
├── .env.example                  # Safe variable names only, no values
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
└── LICENSE
```

Keep the initial Django app count manageable. If the coding agent proposes another app or infrastructure service, it must explain the ownership boundary and why an existing app cannot reasonably own it.

---

## 5. Module responsibilities and implementation rules

### 5.1 `accounts`
**Owns:** registration, login/logout, email verification, password reset, Google OAuth integration, account deletion initiation, authentication-related rate limits.

**Stores:** Django User/custom user identity fields and verification/account status as appropriate. Never store plaintext passwords or raw long-lived reset/verification tokens.

**Flow:** validate request → enforce rate limits → invoke Django auth/OAuth library → create/update identity → send email through an email service → return safe account state.

**Rules:**
- Decide and implement the user model before the first migration. Prefer a custom Django user model from the beginning if email is the primary login identifier.
- Normalize email consistently and enforce uniqueness in the database.
- Use Django’s password hashers.
- Verification/reset tokens must expire and be single-use.
- Avoid account enumeration in password reset responses.
- OAuth callback state/redirect validation must be handled by a maintained library.
- Logout must invalidate the selected session/token correctly.
- Account deletion must delete or anonymize associated records according to the documented retention policy.
- Do not return tokens, password hashes, or provider secrets to React.

### 5.2 `users`
**Owns:** profile, onboarding, preferences.

**Stores:** display name, optional username, bio, profile-image storage key only if uploads are implemented, preferred language, initial self-reported level, onboarding completion.

**Rules:** initial level is only a prior/default. Actual skill state is calculated from practice evidence. A preferred language is not a claim of proficiency. Validate usernames and enforce uniqueness if supplied.

### 5.3 `catalog`
**Owns:** supported programming languages and topic taxonomy.

**Stores:** language slug/name/is_active/sort order; topic language FK, slug/name/description/is_active/sort order and optional prerequisite metadata only if actually used.

**Seed data:** C, C++, Java, Python, JavaScript plus an initial reviewed list of language-specific topics. Seed with Django data migrations or a repeatable management command. Do not require admins to manually create the core catalog.

**Rules:** a topic belongs to a language. A C loops skill and a Python loops skill are separate. Do not make topic names globally unique if uniqueness is intended only within a language; use a database constraint on `(language, slug)`.

### 5.4 `practice`
**Owns:** practice-session lifecycle and session progress.

**Stores:** user, selected language, practice type (`TOPIC` or `MIXED`), optional selected topic, difficulty mode (`EASY`, `MEDIUM`, `HARD`, `ADAPTIVE`), mode (`CODING` or `DEBUG`), requested length (5/10/20), status, started/finished timestamps, current challenge index and summary snapshot if required.

**Rules:**
- Only valid state transitions are allowed: `CREATED → IN_PROGRESS → COMPLETED` or `ABANDONED`; document whether a session can be resumed.
- Topic practice requires a topic in the selected language.
- Mixed practice has no single selected topic.
- Challenge count is bounded by the requested session length.
- Server decides the next challenge. Client cannot submit arbitrary skill updates or challenge difficulty.
- A session summary should be reproducible from stored submissions/evaluations or a clearly defined snapshot.

### 5.5 `challenges`
**Owns:** challenge generation orchestration, storage, validation, challenge retrieval, similar challenge requirements.

**Stores:** language, primary topic, optional secondary topic mappings, title, prompt/description, input/output examples as illustrative text only (not executed), difficulty, practice mode, constraints, expected concepts, evaluation rubric/version, origin (`AI_GENERATED`), AI model/prompt version metadata, quality status, content hash/deduplication key, created timestamp.

**Rules:**
- The AI-generated challenge must pass a schema validator before persistence.
- Validate language/topic relationship, prompt size, number/size of examples, difficulty enum, and required fields.
- Reject malformed, duplicate, contradictory, unsafe, or off-topic output; bounded regeneration only.
- No user code is executed and no sample is claimed to be verified by a runtime.
- A challenge served to a user should be persisted so later evaluation uses the exact original prompt/rubric, not a regenerated version.
- If generated content is flagged or found invalid, mark it unavailable and audit the action; do not silently rewrite historical challenge content.
- Similar Challenge should vary problem framing while preserving target concept/difficulty constraints. Avoid returning the exact same challenge by content hash.

### 5.6 `submissions`
**Owns:** submitted code text, attempt history, submission status.

**Stores:** user, practice session, challenge, source code text, language, status, idempotency key, created timestamp, code length/metadata. Keep code access restricted to its owner and authorized administrators only.

**Rules:**
- Enforce maximum code size and request body size at API and hosting layers.
- Treat code as data, never execute it, never render it as trusted HTML.
- Persist submission before invoking Gemini so an AI outage does not erase user work.
- Use idempotency protection to prevent double-click/network retries from creating duplicate evaluations or charging duplicate AI calls.
- Avoid logging complete submitted code by default.
- Define a retention/export/deletion policy. Do not expose private code in public admin analytics.

### 5.7 `evaluation`
**Owns:** Gemini adapter, prompt construction, response schema validation, score rubric, evaluation persistence and failure handling.

**Stores:** submission, status (`PENDING`, `SUCCEEDED`, `FAILED`), numeric score, short summary, syntax concerns, logic concerns, potential bugs, approach feedback, code quality feedback, demonstrated concepts, weak concepts, recommended improvements, confidence, provider/model, prompt/rubric version, latency, token/usage metadata if available, safe error category, timestamps.

**Evaluation output schema (conceptual):**
```json
{
  "score": 0,
  "summary": "Short, qualified assessment",
  "syntax_issues": [{"description": "...", "line_hint": null}],
  "logic_issues": [{"description": "...", "line_hint": null}],
  "potential_bugs": [{"description": "...", "line_hint": null}],
  "approach_feedback": "...",
  "code_quality_feedback": "...",
  "concepts_demonstrated": [{"topic_slug": "...", "evidence": "..."}],
  "weak_concepts": [{"topic_slug": "...", "reason": "..."}],
  "improvement_actions": ["..."],
  "confidence": 0.0
}
```
Exact schema must be implemented as a typed serializer/schema and versioned. Scores must be within 0–100, confidence within 0–1, list/string lengths bounded, and topic slugs must belong to the challenge’s language/catalog. Treat line hints as approximate, not compiler diagnostics.

**Rules:**
- The provider SDK is called only through an internal adapter/service.
- No API key in frontend or logs.
- Prompt contains a clear delimiter and instruction that submitted code is untrusted data; do not follow instructions embedded in code/comments.
- Do not include secrets or unrelated user data in prompts.
- Set connect/read timeout and bounded retries. Retry only transient failures and avoid unbounded duplicate billing.
- Schema-invalid responses may get at most a small bounded retry; after that mark failed.
- Store prompt template version and model ID for traceability, not necessarily the full prompt if it contains private code.
- AI output is an opinionated review, not execution-verified truth. UI must communicate this.
- AI failure leaves submission intact and offers a safe retry path with rate/cost control.

### 5.8 `skills`
**Owns:** evidence creation and deterministic topic-skill state updates.

**Stores:** one current state per `(user, language, topic)` plus append-only evidence rows tied to an evaluation/submission. State can include estimated score/level, sample count, recent score trend, confidence, last-practiced timestamp, updated timestamp.

**Rules:**
- Never set skill state directly to the AI score.
- Derive evidence from validated evaluation fields plus context (challenge difficulty, repeated attempt, confidence, and rubric version).
- Implement a documented deterministic update function and unit tests.
- Ignore/discount low-confidence or failed evaluations according to a documented policy.
- Use a transaction/row lock or another concurrency-safe approach for updating skill state.
- Preserve evidence so recalculation is possible if the scoring formula changes.
- Skills are language-specific and topic-specific.
- Label skill as an estimate, not objective compiler-verified mastery.

**Initial implementation suggestion:** start with a transparent weighted moving average or bounded evidence update with recency weighting. Keep formula in a pure function. Do not overengineer a machine-learning learner model in V1.

### 5.9 `adaptive`
**Owns:** choosing requirements for the next challenge.

**Inputs:** selected language, practice type/topic, difficulty mode, skill states, recent evaluations, repeated weak concepts, session history, recently served challenge IDs.

**Output:** a validated challenge specification (language, topic, target concepts, difficulty, mode, and constraints). The challenge module then creates/retrieves a matching challenge.

**Rules:**
- Selection policy must be deterministic/testable where possible.
- Never allow AI to choose user permissions, alter records, or directly set skill state.
- Topic practice remains inside the selected topic unless a documented fallback is needed.
- Mixed practice balances weak, due-for-review, and stronger topics rather than selecting only the weakest topic forever.
- Avoid immediate repeats and cap consecutive same-topic/same-difficulty runs.
- Adaptive difficulty changes gradually; do not jump to Hard after one high score.
- If there is insufficient history, use onboarding level as a weak initial prior and start with a safe baseline.
- Persist an adaptive decision record with selected topic/difficulty and concise reason codes for debugging/explainability.

### 5.10 `hints`
**Owns:** hint requests and generation.

**Stores:** user, challenge, submission/context if applicable, hint level (`CONCEPT`, `APPROACH`, `DIRECTIONAL`), hint text, provider/model, prompt version, timestamp, usage count.

**Rules:**
- Do not reveal a complete solution or full corrected code.
- Each hint must be relevant to the current challenge and must not change session state.
- Apply per-user/per-session limits; use existing stored hints when safe to avoid repeat calls.
- Clearly separate hint content from trusted application instructions.
- Hint calls have independent limits and timeouts.

### 5.11 `analytics`
**Owns:** read-only dashboard aggregation and session summaries.

**Shows:** attempts, completed sessions, average evaluation score, topic/language progress, strengths/weaknesses, recent activity, estimated trend, suggested practice.

**Rules:**
- Derive analytics from persisted domain data; do not create a second conflicting source of truth.
- Paginate history.
- Avoid N+1 ORM queries; use indexes and suitable aggregation/select_related/prefetch_related.
- Cache only after measuring need. User-specific cached results must be scoped by user and invalidated safely.
- Do not expose private code or sensitive auth data in analytics.

### 5.12 `audit` and admin governance
**Owns:** security-relevant events and admin actions.

**Stores:** actor ID if known, event type, target type/ID, timestamp, request/correlation ID, safe metadata, outcome. Do not store secrets or full request bodies.

**Admin tasks:** manage/suspend/restore users; inspect challenge quality flags; disable problematic generated challenges; view aggregate AI failures/usage; manage active language/topic catalog where authorized; review security/activity events. Start with Django Admin for internal management; build a custom admin UI only if needed.

**Rules:** least privilege, explicit permissions, audit admin mutations, avoid exposing passwords/tokens/full private submissions, and separate support access from superuser access where practical.

---

## 6. Logical data model (initial schema proposal)

The exact field types and migration design must be reviewed before implementation. Use UUID primary keys for public-facing domain records if it fits the chosen Django setup; never rely on obscurity instead of authorization.

### Identity and profile
**User**
- id
- email (normalized, unique; primary login identifier if selected)
- password (Django-managed hash)
- is_active, is_staff, is_superuser
- is_email_verified or related verification state
- date_joined, last_login

**UserProfile** (one-to-one User)
- user_id
- display_name (required)
- username (nullable/optional, unique when present)
- bio (nullable)
- preferred_language_id
- initial_skill_level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`)
- onboarding_completed
- created_at, updated_at

Do not store email again in the profile unless a clearly justified denormalized snapshot is needed.

### Catalog
**ProgrammingLanguage**
- id, slug (unique), name, is_active, sort_order

**Topic**
- id, language_id, slug, name, description, is_active, sort_order
- unique constraint `(language_id, slug)`

### Practice
**PracticeSession**
- id, user_id, language_id
- practice_type (`TOPIC`, `MIXED`)
- selected_topic_id (nullable; required for TOPIC)
- difficulty_mode (`EASY`, `MEDIUM`, `HARD`, `ADAPTIVE`)
- practice_mode (`CODING`, `DEBUG`)
- requested_question_count (5, 10, 20)
- status (`CREATED`, `IN_PROGRESS`, `COMPLETED`, `ABANDONED`)
- started_at, completed_at, created_at, updated_at

**SessionChallenge** (recommended to preserve ordered challenge sequence)
- id, session_id, challenge_id, sequence_number, state
- unique constraint `(session_id, sequence_number)`
- unique constraint `(session_id, challenge_id)` unless intentional repeats are allowed

### Challenges
**Challenge**
- id, language_id, primary_topic_id
- title, statement, constraints_text
- examples JSON (bounded illustrative text)
- difficulty (`EASY`, `MEDIUM`, `HARD`)
- practice_mode (`CODING`, `DEBUG`)
- target_concepts JSON or normalized relation if multiple topic mapping is needed
- evaluation_rubric_version
- origin, quality_status, content_hash
- ai_provider, ai_model, prompt_version (nullable metadata)
- created_at, updated_at

If multi-topic challenge mapping is needed, use `ChallengeTopic` with a unique `(challenge_id, topic_id)` constraint instead of unbounded topic IDs in JSON. Prefer normalized relations for queryable relationships.

**ChallengeFlag** (only if moderation workflow is implemented)
- id, challenge_id, reporter_user_id nullable, reason, status, reviewed_by nullable, created_at, resolved_at

### Submission and evaluation
**Submission**
- id, user_id, session_id, challenge_id
- source_code (private text)
- language_id
- status (`RECEIVED`, `EVALUATING`, `EVALUATED`, `EVALUATION_FAILED`)
- idempotency_key
- created_at, updated_at
- unique `(user_id, idempotency_key)` when key is provided

**Evaluation**
- id, submission_id
- status (`PENDING`, `SUCCEEDED`, `FAILED`)
- score nullable (0–100)
- summary
- syntax_issues JSON
- logic_issues JSON
- potential_bugs JSON
- approach_feedback
- code_quality_feedback
- concepts_demonstrated JSON or normalized relation
- weak_concepts JSON or normalized relation
- improvement_actions JSON
- confidence nullable (0–1)
- provider, model, prompt_version, rubric_version
- latency_ms, input_tokens/output_tokens nullable
- safe_error_code nullable
- created_at, completed_at

Use a unique one-to-one Evaluation per submission for the current V1 unless retaining multiple re-evaluations is an explicit requirement. If re-evaluation history becomes required, change to one-to-many intentionally.

### Skills and adaptation
**SkillState**
- id, user_id, language_id, topic_id
- estimated_skill (bounded documented range)
- confidence (bounded 0–1)
- evidence_count
- recent_average nullable
- last_practiced_at nullable
- updated_at
- unique `(user_id, language_id, topic_id)`

**SkillEvidence**
- id, user_id, language_id, topic_id
- submission_id, evaluation_id
- evidence_value, weight, reason_code, formula_version, created_at
- unique policy preventing duplicate evidence from the same evaluation/topic

**AdaptiveDecision**
- id, session_id, prior_submission_id nullable
- chosen_topic_id, chosen_difficulty, chosen_mode
- reason_codes JSON
- excluded_recent_challenge_ids JSON or normalized if querying is required
- policy_version, created_at

### Hints, operations, and usage
**HintRequest**
- id, user_id, session_id, challenge_id, submission_id nullable
- hint_level, hint_text, provider, model, prompt_version, created_at

**AIUsage** (recommended if provider usage/cost control requires persistent accounting)
- id, user_id nullable, operation_type, provider, model
- request_key, status, latency_ms, input_tokens/output_tokens nullable
- safe_error_code, created_at
- unique request key where applicable

**AuditEvent**
- id, actor_user_id nullable, event_type, target_type, target_id nullable
- request_id, safe_metadata JSON, outcome, created_at

Use Django migrations for schema changes. Add indexes for real query paths, e.g. user+created time on sessions/submissions, session+sequence on session challenges, user+language+topic on skill state, and status+created time for operational dashboards. Avoid adding indexes without a query/use case.

### Deletion and retention
Document what happens to submissions/evaluations when a user deletes an account. Choose consistent `CASCADE`, `SET_NULL`, or anonymization behavior based on product requirements; do not let database defaults decide accidentally. Protect operational audit records from retaining unnecessary personal data.

---

## 7. API contract (initial endpoint inventory)

Prefix all application endpoints with `/api/v1/`. Use DRF serializers, explicit permissions, consistent status codes, pagination for lists, and predictable error response shapes. Endpoint names can be refined during implementation, but do not invent a second API style per module.

### Authentication and profile
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/logout/`
- `GET /api/v1/auth/me/`
- `POST /api/v1/auth/email/verify/`
- `POST /api/v1/auth/email/resend/`
- `POST /api/v1/auth/password-reset/`
- `POST /api/v1/auth/password-reset/confirm/`
- Google OAuth routes/callback using the selected maintained integration
- `GET /api/v1/profile/`
- `PATCH /api/v1/profile/`
- `POST /api/v1/account/delete/`

### Catalog and practice
- `GET /api/v1/languages/`
- `GET /api/v1/languages/{language_slug}/topics/`
- `POST /api/v1/practice-sessions/`
- `GET /api/v1/practice-sessions/`
- `GET /api/v1/practice-sessions/{id}/`
- `POST /api/v1/practice-sessions/{id}/start/`
- `POST /api/v1/practice-sessions/{id}/next-challenge/`
- `POST /api/v1/practice-sessions/{id}/complete/`
- `POST /api/v1/practice-sessions/{id}/abandon/`

### Challenges, submissions, evaluation, hints
- `GET /api/v1/challenges/{id}/`
- `POST /api/v1/submissions/`
- `GET /api/v1/submissions/{id}/`
- `GET /api/v1/submissions/{id}/evaluation/`
- `POST /api/v1/submissions/{id}/retry-evaluation/` (only if safe, bounded retry is supported)
- `POST /api/v1/hints/`
- `POST /api/v1/challenges/{id}/similar/`

### Skills, history, analytics
- `GET /api/v1/skills/`
- `GET /api/v1/skills/{language_slug}/`
- `GET /api/v1/history/`
- `GET /api/v1/dashboard/`
- `GET /api/v1/practice-sessions/{id}/summary/`

### Admin
Use Django Admin first. If a custom API is needed, place it under `/api/v1/admin/` and require explicit staff/admin permissions for every endpoint.

### API contract rules
- Every request gets server-side validation.
- Error responses use a consistent structure, e.g. `{ "error": { "code": "VALIDATION_ERROR", "message": "Safe user-facing message", "details": {} } }`.
- Never return model objects unrestricted.
- Lists are paginated.
- Users can access only their own sessions, submissions, evaluations, hints, and skill states.
- The frontend must not be trusted to send score, user ID, role, skill level, evaluation, or next-challenge decision.
- Do not put API keys/secrets in frontend environment variables. Anything bundled into React is public.

---

## 8. AI prompts and validation contracts

Use separate versioned prompt templates for:
1. Challenge generation
2. Submission evaluation
3. Hint generation
4. Similar challenge generation

Keep prompts in one documented backend location, not scattered through views.

### Challenge generation output
Must include:
- title
- statement
- language
- primary topic
- difficulty
- practice mode
- constraints
- a bounded number of illustrative examples
- target concepts
- evaluation rubric
- short explanation/learning objective if helpful

Validate every field and ensure the topic belongs to the selected language. Store the generated challenge and its prompt/rubric versions before it is shown to the user.

### Evaluation rubric
Score should be a transparent review estimate, based on weighted dimensions such as:
- relevance to the problem
- logic/approach
- handling of stated constraints/edge cases
- clarity/readability
- language-appropriate use of constructs

Define weights in code/config and version them. Do not let the model silently invent scoring rules on every request.

### AI output safeguards
- Schema/type validation and strict bounds.
- Cap prompt and response sizes.
- Provider timeout.
- Small, bounded retries only for transient failures.
- No unbounded retry loops.
- Never execute AI-generated code or user-submitted code.
- Do not include secrets, passwords, or unrelated private data in prompts.
- User code and comments are untrusted content, not instructions to the AI system.
- Store model/provider/prompt version and safe usage metadata.
- If AI fails, preserve submission and show a recoverable status.
- Mock the AI service in tests; tests must not require live paid API calls.

---

## 9. Skill engine and adaptive engine

### Skill engine
Use a pure, unit-tested function that takes the previous state and a validated evidence object and returns a new state. The AI score alone is not the skill value.

Inputs can include:
- validated evaluation score
- challenge difficulty
- evaluation confidence
- concepts demonstrated/weak
- attempt context
- prior skill state
- recent performance
- repeated error patterns

Version the formula. Start with a transparent conservative update formula; calibrate it with tests and sample cases. Do not claim scientifically validated mastery.

### Adaptive engine
Implement a deterministic selection policy with clear reason codes, for example:
- `WEAK_TOPIC_REVIEW`
- `RECENT_ERROR_PATTERN`
- `GRADUAL_DIFFICULTY_INCREASE`
- `MIXED_PRACTICE_BALANCE`
- `AVOID_RECENT_REPEAT`
- `INITIAL_LEVEL_PRIOR`

For topic practice, stay in the selected topic. For mixed practice, select among active topics in the chosen language, balancing weakness, review need, and variety. Use recent history to avoid immediate repeats. Respect selected difficulty unless user selected Adaptive.

If the challenge generator fails, return a safe retry/error state rather than changing the user’s skill or silently substituting a mismatched challenge.

---

## 10. Frontend feature implementation

### Pages
- Landing page
- Register / login / email verification / password reset
- Onboarding
- Dashboard
- Practice setup
- Active practice session
- Challenge workspace with editor
- Evaluation result
- Session summary
- Practice history and detail
- Profile/settings/account deletion
- Admin: Django Admin initially; custom UI only if needed

### UI state requirements
- Distinguish loading, success, empty, and error states.
- Prevent duplicate submit clicks while a submission is being sent.
- Preserve unsent editor content locally during normal navigation where safe; do not treat browser storage as authoritative persistence.
- On refresh, recover session/challenge from backend state.
- Display AI feedback as an estimate, not compiler output.
- Do not render user code or AI strings as raw trusted HTML.
- Use accessible labels, keyboard-friendly controls, and responsive layout.
- Keep API calls in a typed API client; UI components should not embed provider/database logic.

---

## 11. Rate limiting, cost control, and caching

### Required from the beginning
- Auth endpoint rate limits and brute-force controls.
- Separate limits for challenge generation, evaluation, hints, and similar-challenge requests.
- Max code length, prompt length, and response length.
- Per-user AI usage accounting or a similarly reliable quota mechanism.
- Provider timeout and bounded retries.
- Prevent double submission/retry from making duplicate AI calls.
- Friendly quota/failure responses.
- Admin visibility into AI errors and usage totals.
- Environment-based model and limit configuration.

### Redis/cache decision
Do not require Redis just to launch local development. Start with a documented rate-limiting implementation appropriate to the chosen deployment. If using multiple Django instances, shared counters are needed for consistent limits; select a shared backend such as managed Redis or a database-backed mechanism after evaluating latency, limits, and hosting constraints. Do not use process-local memory for production-wide security limits.

Cache only low-risk reusable data if measurement shows benefit:
- language/topic catalog
- safe public configuration
- reusable generated challenge content if correctly keyed and deduplicated

Do not blindly cache personalized evaluation or skill state. Ensure cache keys include the relevant language/topic/difficulty/version and never leak one user’s private data to another.

### AI budget controls
- Configure daily/per-user operation caps.
- Keep prompt context concise.
- Use the chosen model only after checking current API limits and price.
- Do not generate challenges on every page render.
- Persist generated challenge before display.
- Avoid re-evaluating the same submission unless an explicit, rate-limited retry/re-evaluation flow is used.
- Track usage metadata where provider exposes it.
- Add a global kill switch for AI features so the rest of the app can display history and existing data during provider outages.

---

## 12. Testing strategy and acceptance criteria

### Unit tests
- User/profile validation
- Session state transitions
- Challenge schema validation and deduplication
- Evaluation schema validation and score bounds
- Skill update function and confidence handling
- Adaptive selection and repeat avoidance
- Rate limit/quota policy
- Ownership/permission helpers

### API/integration tests
- Registration/login/logout and verification flows
- Google OAuth integration behavior using mocks/test configuration
- Profile ownership and update validation
- Session create/start/next/complete/abandon
- Submission persistence before AI call
- Successful evaluation pipeline with mocked Gemini
- AI timeout/malformed response/retry exhaustion
- Skill evidence update only after valid evaluation
- No cross-user access to submissions/evaluations/skills
- Duplicate idempotency key does not trigger duplicate evaluation
- Admin endpoints require correct permissions

### Frontend tests
- Auth forms and protected routes
- Practice setup validation
- Editor submission and duplicate-click prevention
- Loading/error/success evaluation states
- Session summary and dashboard empty states

### CI checks
- Backend formatting/linting and tests
- Frontend lint/type-check/test/build
- Dependency/security checks where practical
- Migrations check
- No secrets committed

### Definition of done for each feature
1. Acceptance criteria documented.
2. Backend validation and authorization implemented.
3. UI loading/error/empty/success states implemented where relevant.
4. Unit/API tests added.
5. Lint/type checks pass.
6. No secrets or private data in logs.
7. Docs and `.env.example` updated.
8. Manual smoke test completed.
9. Coding agent summarizes changed files, tests run, known limitations, and next step.

---

## 13. Observability and operations

Use structured logs with:
- request/correlation ID
- endpoint and status
- latency
- safe error category
- AI operation/provider/model
- AI latency and safe usage metrics
- rate-limit events
- security-relevant outcomes

Do not log passwords, tokens, OAuth secrets, API keys, complete private code, or entire AI prompts by default. Production errors should not expose stack traces to users.

Track at minimum:
- API error rate/latency
- AI success/failure/latency
- quota/rate-limit rejections
- submission/evaluation status
- database connection errors
- deployment/build status

Choose an error monitoring service only after deployment/requirements review; keep local structured logs working without one.

---

## 14. Environment variables and secrets

Create `.env.example` containing names and placeholder descriptions only, never real values. Expected names may include:

```text
DJANGO_SECRET_KEY=
DJANGO_DEBUG=
DJANGO_ALLOWED_HOSTS=
DATABASE_URL=
GEMINI_API_KEY=
GEMINI_MODEL=
FRONTEND_ORIGIN=
CSRF_TRUSTED_ORIGINS=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
AI_DAILY_BUDGET_LIMIT=
AI_USER_DAILY_LIMIT=
```

Only include variables used by the selected packages/configuration. Do not expose secret variables through Vite’s public `VITE_` namespace. Production secrets belong in the host’s secret configuration.

---

## 15. Development order: build vertical slices, not disconnected modules

### Phase 0 — Project foundation
- Create repo, README, `.gitignore`, `.env.example`, docs folder.
- Set up React + TypeScript + Vite and Django + DRF.
- Set up settings split/config, database connection, CORS/CSRF/auth approach.
- Add health endpoint, lint/type-check/test commands, CI skeleton.
- Confirm migrations and deployment assumptions.
**Exit:** frontend builds, backend starts, database migration/check succeeds, CI runs.

### Phase 1 — Identity and profile
- Decide custom user model before first migration.
- Registration/login/logout/current-user endpoints.
- Email verification/password reset.
- Google OAuth integration.
- Profile/onboarding.
- Permissions and auth rate limits.
**Exit:** tests prove a user can authenticate and cannot access another user’s data.

### Phase 2 — Catalog and practice lifecycle
- Seed language/topic catalog.
- Practice setup and session lifecycle.
- Session challenge ordering.
- Basic UI for practice setup and active session.
**Exit:** user can create/start/resume/abandon a session with valid configuration.

### Phase 3 — Challenge generation
- Gemini service adapter and challenge-generation schema.
- Generation, validation, deduplication, persistence.
- Challenge retrieval and safe failure handling.
**Exit:** valid persisted challenge is displayed; malformed provider output never reaches user/database as valid content.

### Phase 4 — Submission and evaluation
- Editor integration.
- Submission endpoint, size validation, idempotency.
- Persist before AI call.
- Evaluation prompt, schema validation, persistence, failure/retry behavior.
**Exit:** user submits code and receives qualified, structured feedback; AI outage preserves submission.

### Phase 5 — Learning loop
- Skill evidence/state schema and pure skill update function.
- Adaptive selection policy and reason codes.
- Hints and similar challenge.
- Session completion/summary.
**Exit:** valid evaluation updates evidence once; next challenge follows policy; no skill changes on failed/malformed evaluation.

### Phase 6 — Dashboard and history
- Skills display, recent sessions, evaluation history, trend/weak topics.
- Pagination, query optimization.
**Exit:** data matches persisted records and cross-user access tests pass.

### Phase 7 — Admin and operational controls
- Django Admin permissions, challenge quality governance, user status controls.
- AI usage/failure overview and audit events.
- Rate limits/quota hardening.
**Exit:** admin actions are permission-protected and auditable.

### Phase 8 — Production hardening and release
- Review CSRF/CORS/cookies/HTTPS/headers/allowed hosts.
- Production DB and secrets configuration.
- CI checks, dependency audit, migrations and backup plan.
- Error/usage monitoring, deployment and smoke tests.
- README screenshots/demo, architecture docs, limitations and known trade-offs.
**Exit:** clean deployment, critical tests pass, no secrets in repo, app usable end-to-end.

### Speed rule
Prioritize one complete happy path early:
**Register → Onboard → Start practice → Get challenge → Submit code → See evaluation → Skill updates → Next challenge → Dashboard reflects progress.**

Do not polish every page before this path works.

---

## 16. AI coding agent operating instructions

Paste this before implementation tasks:

> You are implementing SkillForge V1 from this blueprint. Treat this file as the source of truth. Do not add out-of-scope features or infrastructure. Before editing, inspect the repository and summarize the current state. Implement only the requested phase/small task. State assumptions; if a decision would alter locked requirements, stop and ask. Follow existing conventions. Use Django ORM/migrations, DRF serializers and explicit permissions. Never expose secrets or put AI calls in the frontend. Never execute user-submitted code. Keep Gemini calls behind the AI service interface. Validate all AI output before persistence/use. AI must not directly mutate skill state. Add/update tests for every meaningful behavior. Run relevant tests, lint/type checks, and migration checks. Do not claim a check passed unless it actually ran. At the end, report: files changed, design choices, commands/tests run and outcomes, security considerations, known limitations, and the next smallest task. Do not rewrite unrelated files or add dependencies without justification.

### Recommended task prompt template

```text
Read docs/SkillForge_V1_Development_Blueprint.md first.
Current phase: [PHASE]
Task: [ONE SMALL TASK]
Acceptance criteria:
- [criterion 1]
- [criterion 2]
Constraints:
- Do not implement later phases.
- Do not change locked architecture without asking.
- Add tests.
- Run relevant checks and report exact outcomes.
First inspect the existing code and propose a short implementation plan. Then implement.
```

---

## 17. Resume and portfolio readiness

Do not claim production scale, verified code correctness, or execution-based judging if those are not implemented. Demonstrate real engineering through:
- clear modular architecture
- secure authentication and object-level permissions
- versioned REST API
- managed PostgreSQL
- validated AI integration with cost/failure controls
- evidence-based learning logic
- deterministic adaptive selection
- tests and CI
- deployment and operational documentation
- explicit limitations and trade-offs

Suggested resume description once implemented and verified:

**SkillForge — AI-Powered Adaptive Coding Practice Platform**
Built a full-stack coding-practice platform using React, TypeScript, Django REST Framework, PostgreSQL, and Gemini API. Implemented structured AI code review, topic-level skill evidence, adaptive challenge selection, secure user sessions, API protections, automated tests, and CI/CD.

Only list capabilities that are actually completed and demonstrable.

---

## 18. Final implementation rules

1. V1 only; do not start sandbox/code execution or teacher mode.
2. Do not add a service without explaining the problem it solves.
3. Keep the first end-to-end path small and working.
4. Backend owns authorization, data, skill state, and AI access.
5. Persist user work before external AI calls.
6. Validate all external and AI data.
7. Rate-limit expensive operations and prevent duplicate billing.
8. Use migrations and tests; never manually patch production DB schema.
9. Keep provider secrets out of source control and frontend bundles.
10. Prefer clear, boring, testable code over clever abstractions.
11. Update this document when an approved decision changes.
12. When uncertain, stop and ask rather than inventing product behavior.

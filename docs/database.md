# SkillForge Database Architecture

## 1. Managed Database
- **Engine**: PostgreSQL 17 (Supabase Managed)
- **Access Strategy**: Django ORM with `dj-database-url` and `psycopg` (v3).
- **Schema Management**: Controlled strictly via Django migrations (`python manage.py makemigrations` and `migrate`). No manual table creation.

## 2. Core Entities
1. **Identity & Profile**:
   - `User` (custom Django user with email as primary login)
   - `UserProfile` (display name, onboarding status, preferred language, self-reported level)
2. **Catalog**:
   - `ProgrammingLanguage` (slug, name, is_active)
   - `Topic` (language_id, slug, name, is_active; unique per language)
3. **Practice & Challenges**:
   - `PracticeSession` (user, language, practice_type, difficulty, question_count, status)
   - `SessionChallenge` (session, challenge, sequence_number)
   - `Challenge` (language, primary_topic, title, statement, constraints, examples, difficulty)
4. **Submissions & Evaluation**:
   - `Submission` (user, session, challenge, source_code text, status, idempotency_key)
   - `Evaluation` (submission, status, score, summary, issues JSON, feedback, confidence)
5. **Skills & Adaptive**:
   - `SkillState` (user, language, topic, estimated_skill, confidence, evidence_count)
   - `SkillEvidence` (user, language, topic, submission, evaluation, evidence_value)
   - `AdaptiveDecision` (session, chosen_topic, chosen_difficulty, reason_codes)

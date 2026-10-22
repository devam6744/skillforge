# Contributing to SkillForge

Thank you for your interest in contributing to SkillForge!

## Development Guidelines
1. Review the design document in `docs/SkillForge_V1_Development_Blueprint.md` before making any major changes.
2. Follow the SDLC phase development plan.
3. Write automated unit and integration tests for every new feature.
4. Ensure all code passes linting, formatting, and type-checks.
5. NEVER commit `.env` or any sensitive credentials.

## Pull Request Process
1. Create a feature branch from `main`: `git checkout -b feature/your-feature`.
2. Commit your changes with clear, semantic commit messages.
3. Verify test suite passes locally (`pytest` and `npm test` / `npm run build`).
4. Submit a Pull Request targeting `main`.

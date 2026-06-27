---
name: SYANO Master Recovery Pointer
description: Mandatory first-read rule — SYANO_MASTER_RECOVERY.md must be read before any action on this project.
---

# MANDATORY FIRST READ

Before doing **anything** in this project — analysis, coding, workflow changes, debugging, refactoring, migrations, feature work — read the entire `SYANO_MASTER_RECOVERY.md` file in the project root.

**Why:** It is the single authoritative source of truth for the SYANO platform. It contains the complete architecture, all workflow rules (exactly 4 must exist, specific port constraints), the full database schema (44 tables), Python install instructions (3-pass pip install --user), recovery procedures, TypeScript policy, i18n rules, and the final validation checklist. Every constraint that has ever caused a regression is documented there.

**How to apply:** On every session start, read `SYANO_MASTER_RECOVERY.md` first, then and only then proceed with the user's request.

**Critical rules that break things if ignored:**
- Exactly 4 workflows (api-server, embedding-service, marketplace, mobile) — no more, never force PORT= on marketplace/mobile
- Python packages: `pip install --user` in 3 passes — NOT `python3 -m pip`, NOT uv/pyproject
- torch requires `--index-url https://download.pytorch.org/whl/cpu`
- DB changes additive only — no DROP, no ALTER existing columns
- All visible text via i18n keys only
- PORT env var must NOT be set (use API_PORT=8080 only)

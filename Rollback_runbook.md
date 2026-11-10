# AI Agent Village — Operational Rollback Runbook

## 1. Inspect Repository & Branch State

```bash
git status
git log -3 --oneline
git remote -v
git branch --show-current
```

## 2. Verify Canonical Database Integrity (`DBT-001 v1.1`)

Before and after any rollback or schema recovery operation, execute the disposable verification harness:

```bash
./tests/DBT-001/village-test.sh
```

Confirm output ends with:

```text
DBT-001 VERIFIED RUN: PASS
```

## 3. Application & Database Rollback Procedure

1. Stop active processes cleanly.
2. Inspect uncommitted or staged modifications (`git status --short`, `git diff --cached --name-status`).
3. Revert the offending commit (`git revert <sha>`) rather than rewriting shared branch history.
4. Re-run `npm run typecheck`, `npm test`, and `npm run test:dbt001` before restoring traffic.

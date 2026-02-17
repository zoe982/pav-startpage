# Project Instructions (Codex)

## TDD Enforcement
- All code changes must follow strict TDD: write failing tests first, then implement, then re-run tests.
- If a test cannot be written first, stop and ask for guidance before changing code.
- Do not merge or finalize work without green tests.

## Coverage Requirements
- Maintain 100% coverage for lines, statements, branches, and functions.
- Coverage must be per-file and include all files; do not lower thresholds or add exclusions.
- Add tests until any new or touched code is fully covered.

## Type Safety, Readability, and Security
- Use ultra-strict typing in all code. Avoid `any`, unsafe casts, and loosely typed patterns unless explicitly approved.
- Optimize for readability first: prefer clear names, small focused functions, and straightforward control flow over clever shortcuts.
- Treat security as a default requirement: validate inputs, avoid unsafe assumptions, and use secure-by-default patterns for data handling and access control.

## Required Test Suites
- Integration tests: `pnpm test:integration`
- UI tests: `pnpm test:ui`
- Full gate: `pnpm test:ci` (must pass before finishing work)

## Production Push and Deploy Gate
- Before any push intended for production, close all testing gaps for changed behavior and files. Do not push with known coverage or assertion gaps.
- Test gaming is prohibited. Do not use focused/skipped tests (`.only`, `.skip`, `xdescribe`, `xit`, `xtest`), do not weaken assertions to force passing results, and do not bypass failing suites.
- Do not lower coverage thresholds, add coverage exclusions, or otherwise relax quality gates to make CI pass.
- Production deploys must run only after lint, typecheck, security scan, anti-gaming checks, and full CI tests pass.

## Non-Code Changes
- If a change is documentation or configuration only, explicitly state that no tests were applicable.

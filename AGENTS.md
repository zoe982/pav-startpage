# Project Instructions (Codex)

## TDD Enforcement
- All code changes must follow strict TDD: write failing tests first, then implement, then re-run tests.
- If a test cannot be written first, stop and ask for guidance before changing code.
- Do not merge or finalize work without green tests.

## Coverage Requirements
- Maintain 100% coverage for lines, statements, branches, and functions.
- Coverage must be per-file and include all files; do not lower thresholds or add exclusions.
- Add tests until any new or touched code is fully covered.

## Required Test Suites
- Integration tests: `pnpm test:integration`
- UI tests: `pnpm test:ui`
- Full gate: `pnpm test:ci` (must pass before finishing work)

## Non-Code Changes
- If a change is documentation or configuration only, explicitly state that no tests were applicable.

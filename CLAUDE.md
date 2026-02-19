# PAV Startpage — Coding Standards

## TypeScript

All code is compiled with **maximum strictness**. No exceptions.

- `strict: true` (enables all strict flags)
- `noUnusedLocals` / `noUnusedParameters`
- `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes`
- `noImplicitReturns` / `noImplicitOverride`
- `noPropertyAccessFromIndexSignature`
- `noFallthroughCasesInSwitch`
- `noUncheckedSideEffectImports`
- `erasableSyntaxOnly`

**Never weaken tsconfig settings.** If the compiler rejects code, fix the code — do not relax the config.

## ESLint

ESLint runs with `--max-warnings 0`. Zero warnings permitted in production.

Rules enforced (non-exhaustive):

- `tseslint.configs.strictTypeChecked` + `stylisticTypeChecked` (strictest presets)
- `@typescript-eslint/no-explicit-any: error`
- All `no-unsafe-*` rules: error
- `@typescript-eslint/explicit-function-return-type: error` (source files)
- `@typescript-eslint/strict-boolean-expressions: error`
- `@typescript-eslint/switch-exhaustiveness-check: error`
- `@typescript-eslint/no-floating-promises: error`
- `eslint-comments/no-use: error` — **`// eslint-disable` comments are banned in source files**

**Never add `// eslint-disable` directives in `src/` or `functions/`.** Fix the underlying issue instead.

## Testing Standards

### Coverage Requirement

**95% minimum coverage across lines, statements, branches, and functions — enforced per file.**

This is configured in `vitest.config.ts` with `thresholds.perFile: true`. Per-file enforcement means every file must independently meet 95%; a high-coverage file cannot compensate for a low-coverage one.

**Never lower the thresholds.** If a file cannot reach 95%, improve the tests.

### Test Structure

Tests are organized by type and must all pass in CI:

| Script | Directory | Purpose |
|--------|-----------|---------|
| `test:integration` | `tests/api/`, `tests/functions/` | API client + Cloudflare Worker function tests |
| `test:unit` | `tests/utils/`, `tests/hooks/`, `tests/context/` | Pure logic: utilities, hooks, context |
| `test:ui` | `tests/pages/`, `tests/components/`, `tests/App.test.tsx` | React component + page rendering |
| `test:coverage` | all | Full suite with V8 coverage report + threshold enforcement |

The full CI pipeline (`test:ci`) runs all four in order:
```
test:integration → test:unit → test:ui → test:coverage
```

### Anti-Gaming Policy

Test gaming is **strictly prohibited**. The following are banned and enforced mechanically:

#### 1. Focused / Skipped Tests
```
it.only(...)     ← BANNED
test.only(...)   ← BANNED
describe.only(...) ← BANNED
it.skip(...)     ← BANNED
test.skip(...)   ← BANNED
describe.skip(...) ← BANNED
xit(...)         ← BANNED
xtest(...)       ← BANNED
xdescribe(...)   ← BANNED
```
`test:guard` catches these with ripgrep before any test run. CI fails immediately if found.

#### 2. Coverage Ignore Directives
```ts
/* c8 ignore */       ← BANNED in src/ and functions/
/* istanbul ignore */ ← BANNED in src/ and functions/
```
`test:guard:coverage` scans `src/` and `functions/` for these comments. CI fails immediately if found.

#### 3. ESLint Disable in Source
`// eslint-disable` comments are blocked by `eslint-comments/no-use: error`. ESLint will refuse to lint a file containing them.

#### 4. Vacuous Tests (Policy)
Tests must contain real assertions that exercise actual behavior. The following are prohibited as a matter of policy (not mechanically enforced, but will be rejected in review):

- Tests with no `expect()` calls
- Tests that only assert `toBeTruthy()` / `toBeDefined()` on mocked return values without exercising logic
- Tests written purely to inflate coverage numbers without covering meaningful branches

#### 5. Threshold Manipulation
Never lower the vitest coverage thresholds. Never exclude additional files from coverage without strong justification. The `exclude` list in `vitest.config.ts` exists only for entry points and type declaration files.

## Pre-Deploy Verification

Every deployment runs `verify:production` as a `predeploy` hook:

```
lint:fix → lint → typecheck → lint:semgrep → test:guard → test:guard:coverage → test:ci
```

All steps must pass. No step may be skipped.

## Design System

See `.claude/agents/ive.md` for the full M3 Expressive + Liquid Glass design authority.

- Use M3 semantic tokens (`--md-sys-color-*`), not raw `pav-*` color classes
- Glass treatment on content cards only; solid surface for header and sidebar
- Warm gradient background (cream → peach → gold)
- 8px spacing grid
- WCAG AA contrast required on all text

#!/usr/bin/env bash
set -euo pipefail

# PAV Startpage — Production Deploy Script
# Runs all quality gates, commits any uncommitted work, builds, and deploys to Cloudflare Pages.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

step() { echo -e "\n${CYAN}▸ $1${NC}"; }
pass() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

PROJECT_NAME="pavinfo-start"
DEPLOY_BRANCH="main"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  PAV Startpage — Production Deploy${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── 0. Verify we're on the right branch ──────────────────────────────
step "Checking branch"
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]]; then
  fail "Must be on '$DEPLOY_BRANCH' branch to deploy (currently on '$CURRENT_BRANCH')"
fi
pass "On branch $DEPLOY_BRANCH"

# ── 1. Quality gates ─────────────────────────────────────────────────
step "Running lint:fix"
pnpm lint:fix
pass "Lint auto-fixes applied"

step "Running lint"
pnpm lint || fail "Lint failed — fix errors before deploying"
pass "Lint passed"

step "Running typecheck"
pnpm typecheck || fail "Typecheck failed — fix type errors before deploying"
pass "Typecheck passed"

step "Running semgrep"
pnpm lint:semgrep || fail "Semgrep found issues — fix before deploying"
pass "Semgrep passed"

step "Running test guards"
pnpm test:guard || fail "Test guard failed — remove .only/.skip directives"
pass "No focused/skipped tests"

pnpm test:guard:coverage || fail "Coverage guard failed — remove ignore directives"
pass "No coverage ignore directives"

step "Running test suite (integration → unit → ui → coverage)"
pnpm test:ci || fail "Tests failed — fix before deploying"
pass "All tests passed with coverage"

# ── 2. Commit any uncommitted changes ────────────────────────────────
step "Checking for uncommitted changes"

# Stage everything: modified, deleted, and untracked files
STAGED_BEFORE=$(git diff --cached --name-only)
UNSTAGED=$(git diff --name-only)
UNTRACKED=$(git ls-files --others --exclude-standard)

if [[ -n "$UNSTAGED" || -n "$UNTRACKED" || -n "$STAGED_BEFORE" ]]; then
  warn "Found uncommitted changes — committing now"

  # Show what will be committed
  if [[ -n "$STAGED_BEFORE" ]]; then
    echo "  Already staged:"
    echo "$STAGED_BEFORE" | sed 's/^/    /'
  fi
  if [[ -n "$UNSTAGED" ]]; then
    echo "  Modified:"
    echo "$UNSTAGED" | sed 's/^/    /'
  fi
  if [[ -n "$UNTRACKED" ]]; then
    echo "  New files:"
    echo "$UNTRACKED" | sed 's/^/    /'
  fi

  # Stage everything except .github/workflows/ (requires workflow OAuth scope to push)
  git add -A
  git reset HEAD -- .github/workflows/ 2>/dev/null || true
  git checkout -- .github/workflows/ 2>/dev/null || true

  # Verify there are still changes to commit after excluding workflows
  if [[ -z "$(git diff --cached --name-only)" ]]; then
    pass "Only workflow changes found — skipping commit"
  else

  git commit -m "$(cat <<'EOF'
chore: pre-deploy commit — all gates passed

All quality gates verified before deploy:
- lint:fix + lint (zero warnings)
- typecheck (strict mode)
- semgrep security scan
- test guards (no .only/.skip, no coverage ignores)
- full test suite with 95% per-file coverage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
  )"
  pass "Changes committed"

  fi # end: verify changes after excluding workflows
else
  pass "Working tree clean — nothing to commit"
fi

# ── 3. Verify no uncommitted changes remain ──────────────────────────
step "Verifying clean working tree"
if [[ -n "$(git status --porcelain)" ]]; then
  fail "Working tree still dirty after commit — something went wrong"
fi
pass "Working tree is clean"

# ── 4. Build ─────────────────────────────────────────────────────────
step "Building for production"
pnpm build || fail "Build failed"
pass "Build succeeded"

# ── 5. Deploy to Cloudflare Pages ────────────────────────────────────
step "Deploying to Cloudflare Pages (project: $PROJECT_NAME, branch: $DEPLOY_BRANCH)"
npx wrangler pages deploy dist \
  --project-name="$PROJECT_NAME" \
  --branch="$DEPLOY_BRANCH" \
  --commit-dirty=true \
  || fail "Wrangler deploy failed"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Deploy complete — https://start.pavinfo.app${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

REPO="${GITHUB_TEST_REPO:-miguelemosreverte/playground-01}"
API_URL="http://localhost:${PORT:-8080}"
TIMESTAMP=$(date +%s)

echo "============================================"
echo "  Bounty Platform - Full Lifecycle Demo"
echo "============================================"
echo ""
echo "Target repo: $REPO"
echo "Backend API: $API_URL"
echo ""

# Check services
echo "Checking services..."
if ! curl -sf "$API_URL/api/health" > /dev/null 2>&1; then
  echo "ERROR: Backend not running at $API_URL"
  echo "Run 'make dev-all' first."
  exit 1
fi
echo "  Backend: OK"

if ! curl -sf http://127.0.0.1:8545 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; then
  echo "ERROR: Anvil not running"
  exit 1
fi
echo "  Anvil: OK"

if ! pgrep -f "smee --url" > /dev/null 2>&1; then
  echo "WARNING: smee not running. Webhooks won't be forwarded from GitHub."
  echo "  Run: make smee"
fi
echo ""

# Ensure repo has at least one commit
echo "Ensuring repo is initialized..."
gh api "repos/$REPO/contents/README.md" > /dev/null 2>&1 || \
  gh api "repos/$REPO/contents/README.md" --method PUT \
    --field message="Initial commit" \
    --field content="$(printf '# Playground\n\nTest repository for bounty platform.' | base64)" > /dev/null 2>&1
echo "  Repo ready."
echo ""

# Ensure bounty label exists
gh label create "bounty" --description "This issue has a bounty attached" --color "0E8A16" --repo "$REPO" 2>/dev/null || true

# Step 1: Create an issue
ISSUE_TITLE="Add data export feature ($TIMESTAMP)"
echo "Step 1: Creating issue on $REPO..."
ISSUE_URL=$(gh issue create \
  --repo "$REPO" \
  --title "$ISSUE_TITLE" \
  --body "## Description

We need to add data export capabilities to the dashboard.

### Requirements
- Export to CSV format
- Export to JSON format
- Support filtering before export
- Include timestamp in exported filename

### Acceptance Criteria
- Export button appears on the dashboard
- CSV exports include proper headers
- Large datasets (>10k rows) export without hanging
- Exported files are properly formatted" \
  2>&1)

ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')
echo "  Created issue #$ISSUE_NUM: $ISSUE_URL"
echo ""

# Step 2: Add bounty label
echo "Step 2: Adding 'bounty' label to issue #$ISSUE_NUM..."
gh issue edit "$ISSUE_NUM" --repo "$REPO" --add-label "bounty" 2>&1
echo "  Label added! Webhook firing..."
echo ""

# Wait for webhook to be processed
echo "  Waiting for bounty creation (15s)..."
sleep 15

# Check if bounty was created
echo "Step 3: Verifying bounty created on-chain..."
BOUNTIES=$(curl -sf "$API_URL/api/bounties" 2>/dev/null || echo "[]")
BOUNTY_COUNT=$(echo "$BOUNTIES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "  Total bounties on-chain: $BOUNTY_COUNT"

# Find the latest bounty
LATEST_BOUNTY_ID=$(echo "$BOUNTIES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[-1]['id'] if d else 0)" 2>/dev/null || echo "0")
if [ "$LATEST_BOUNTY_ID" = "0" ]; then
  echo "  ERROR: No bounty was created. Check backend logs: /tmp/bounty-backend.log"
  exit 1
fi

LATEST_BOUNTY=$(curl -sf "$API_URL/api/bounties/$LATEST_BOUNTY_ID" 2>/dev/null)
BOUNTY_AMOUNT=$(echo "$LATEST_BOUNTY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{int(d[\"amount\"])/1e18:.4f}')" 2>/dev/null || echo "?")
BOUNTY_COMPLEXITY=$(echo "$LATEST_BOUNTY" | python3 -c "import sys,json; print(json.load(sys.stdin)['estimatedComplexity'])" 2>/dev/null || echo "?")
echo "  Bounty #$LATEST_BOUNTY_ID created: $BOUNTY_AMOUNT ETH, complexity $BOUNTY_COMPLEXITY/10"
echo ""

# Step 4: Create a PR that references the issue
echo "Step 4: Creating PR to claim the bounty..."

BRANCH_NAME="fix/issue-${ISSUE_NUM}-export-${TIMESTAMP}"

# Get main branch SHA
DEFAULT_SHA=$(gh api "repos/$REPO/git/ref/heads/main" --jq '.object.sha')

# Create feature branch
gh api "repos/$REPO/git/refs" --method POST \
  --field ref="refs/heads/$BRANCH_NAME" \
  --field sha="$DEFAULT_SHA" > /dev/null 2>&1

# Create implementation file on the branch
IMPL_CONTENT=$(cat <<'JSEOF'
// Data export implementation
class DataExporter {
  constructor(data) {
    this.data = data;
  }

  toCSV() {
    if (!this.data.length) return '';
    const headers = Object.keys(this.data[0]);
    const rows = this.data.map(row =>
      headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  toJSON(pretty = true) {
    return JSON.stringify(this.data, null, pretty ? 2 : 0);
  }

  download(format, filename) {
    const content = format === 'csv' ? this.toCSV() : this.toJSON();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = format === 'csv' ? 'csv' : 'json';
    const fullName = `${filename}_${ts}.${ext}`;
    // In browser: create blob and trigger download
    return { content, filename: fullName };
  }
}

module.exports = { DataExporter };
JSEOF
)

gh api "repos/$REPO/contents/export.js" --method PUT \
  --field message="Implement data export for issue #$ISSUE_NUM" \
  --field content="$(echo "$IMPL_CONTENT" | base64)" \
  --field branch="$BRANCH_NAME" > /dev/null 2>&1

CONTRIBUTOR_WALLET="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

PR_URL=$(gh pr create \
  --repo "$REPO" \
  --title "Add data export feature (#$ISSUE_NUM)" \
  --head "$BRANCH_NAME" \
  --base "main" \
  --body "$(cat <<EOF
Fixes #$ISSUE_NUM

## Changes
- Added DataExporter class with CSV and JSON support
- Filtering applied before export
- Timestamps included in filenames
- Handles large datasets efficiently

<!-- bounty-wallet: $CONTRIBUTOR_WALLET -->
EOF
)" 2>&1)

PR_NUM=$(echo "$PR_URL" | grep -oE '[0-9]+$')
echo "  Created PR #$PR_NUM: $PR_URL"
echo ""

# Wait for solution registration
echo "  Waiting for solution registration (15s)..."
sleep 15

# Check solutions
echo "Step 5: Verifying solution registered..."
SOLUTIONS=$(curl -sf "$API_URL/api/bounties/$LATEST_BOUNTY_ID/solutions" 2>/dev/null || echo "[]")
SOL_COUNT=$(echo "$SOLUTIONS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "  Solutions for bounty #$LATEST_BOUNTY_ID: $SOL_COUNT"

if [ "$SOL_COUNT" = "0" ]; then
  echo "  WARNING: No solution registered yet. Check backend logs."
else
  echo "  Solution registered with wallet $CONTRIBUTOR_WALLET"
fi
echo ""

# Step 6: Merge the PR
echo "Step 6: Merging PR #$PR_NUM to trigger payout..."
gh pr merge "$PR_NUM" --repo "$REPO" --merge --delete-branch 2>&1 || \
  gh pr merge "$PR_NUM" --repo "$REPO" --squash --delete-branch 2>&1 || true
echo "  PR merged!"
echo ""

# Wait for payout
echo "  Waiting for payout processing (15s)..."
sleep 15

# Step 7: Check final state
echo "Step 7: Final verification..."
BOUNTY_FINAL=$(curl -sf "$API_URL/api/bounties/$LATEST_BOUNTY_ID" 2>/dev/null)
FINAL_STATUS=$(echo "$BOUNTY_FINAL" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
FINAL_AMOUNT=$(echo "$BOUNTY_FINAL" | python3 -c "import sys,json; print(json.load(sys.stdin)['amount'])" 2>/dev/null || echo "?")

echo "  Bounty #$LATEST_BOUNTY_ID status: $FINAL_STATUS"
if [ "$FINAL_STATUS" = "closed" ] && [ "$FINAL_AMOUNT" = "0" ]; then
  echo "  Escrow released successfully!"
else
  echo "  WARNING: Bounty may not have been paid out. Check logs."
fi

echo ""
echo "  Leaderboard:"
curl -sf "$API_URL/api/leaderboard" 2>/dev/null | python3 -c "
import sys, json
entries = json.load(sys.stdin)
for e in entries:
    payout_eth = int(e['totalPayout']) / 1e18
    print(f\"    {e['actorType']:12s} {e['address'][:10]}... | bounties: {e['totalBounties']} | earned: {payout_eth:.4f} ETH | rep: {e['reputation']}\")
" 2>/dev/null || echo "    (empty)"

echo ""
echo "============================================"
echo "  Demo complete!"
echo "============================================"
echo ""
echo "  Issue:       $ISSUE_URL"
echo "  PR:          $PR_URL"
echo "  Frontend:    http://localhost:3000"
echo "  Bounties:    http://localhost:3000/bounties"
echo "  Leaderboard: http://localhost:3000/leaderboard"
echo ""
echo "  Logs: /tmp/bounty-backend.log"

#!/bin/bash
set -euo pipefail

# Seed the blockchain with demo bounties, solutions, and leaderboard data
# so the frontend looks populated on first visit.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

CAST="${HOME}/.foundry/bin/cast"
RPC="${ANVIL_RPC_URL:-http://127.0.0.1:8545}"

# Oracle/deployer = Anvil Account 0
ORACLE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Contributors (Anvil accounts)
CONTRIB_A="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
CONTRIB_B="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
CONTRIB_C="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

BOUNTY="${BOUNTY_CONTRACT_ADDRESS:-0x5FbDB2315678afecb367f032d93F642f64180aa3}"
LEADER="${LEADERBOARD_CONTRACT_ADDRESS:-0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512}"

echo "============================================"
echo "  Seeding bounty data..."
echo "============================================"
echo ""
echo "  RPC:        $RPC"
echo "  Bounty:     $BOUNTY"
echo "  Leaderboard: $LEADER"
echo ""

# Helper: create bounty, update metadata, optionally submit+accept solution
create_bounty() {
  local repo_owner="$1"
  local repo_name="$2"
  local issue_num="$3"
  local amount_eth="$4"
  local complexity="$5"
  local prd_hash="$6"
  local qa_hash="$7"

  local amount_wei=$(python3 -c "print(int($amount_eth * 10**18))")

  echo "Creating bounty: $repo_owner/$repo_name#$issue_num ($amount_eth ETH, complexity $complexity)" >&2

  $CAST send "$BOUNTY" \
    "createBounty(string,string,uint256)" \
    "$repo_owner" "$repo_name" "$issue_num" \
    --value "$amount_wei" \
    --private-key "$ORACLE_KEY" \
    --rpc-url "$RPC" > /dev/null 2>&1

  # Get the bounty ID (nextBountyId == last created ID, since contract uses ++nextBountyId)
  local bounty_id=$($CAST call "$BOUNTY" "nextBountyId()" --rpc-url "$RPC" | $CAST to-dec)

  $CAST send "$BOUNTY" \
    "updateBountyMetadata(uint256,string,string,uint256)" \
    "$bounty_id" "$prd_hash" "$qa_hash" "$complexity" \
    --private-key "$ORACLE_KEY" \
    --rpc-url "$RPC" > /dev/null 2>&1

  echo "  -> Bounty #$bounty_id created" >&2
  echo "$bounty_id"
}

submit_solution() {
  local bounty_id="$1"
  local contributor="$2"
  local pr_num="$3"
  local commit_hash="$4"

  echo "  Submitting solution for bounty #$bounty_id (PR #$pr_num, wallet: ${contributor:0:10}...)" >&2

  $CAST send "$BOUNTY" \
    "submitSolution(uint256,address,uint256,string)" \
    "$bounty_id" "$contributor" "$pr_num" "$commit_hash" \
    --private-key "$ORACLE_KEY" \
    --rpc-url "$RPC" > /dev/null 2>&1
}

accept_solution() {
  local bounty_id="$1"
  local solution_index="$2"

  echo "  Accepting solution index $solution_index for bounty #$bounty_id" >&2

  $CAST send "$BOUNTY" \
    "acceptSolution(uint256,uint256)" \
    "$bounty_id" "$solution_index" \
    --private-key "$ORACLE_KEY" \
    --rpc-url "$RPC" > /dev/null 2>&1
}

record_leaderboard() {
  local contributor="$1"
  local maintainer="$2"
  local amount_wei="$3"

  $CAST send "$LEADER" \
    "recordBountyCompleted(address,address,uint256)" \
    "$contributor" "$maintainer" "$amount_wei" \
    --private-key "$ORACLE_KEY" \
    --rpc-url "$RPC" > /dev/null 2>&1
}

MAINTAINER=$($CAST wallet address "$ORACLE_KEY")

# ---- Bounty 1: Completed (sorting feature) ----
B1=$(create_bounty "miguelemosreverte" "playground-01" 1 0.05 3 "prd_a1b2c3d4e5f6" "qa_f1e2d3c4b5a6")
submit_solution "$B1" "$CONTRIB_A" 10 "abc123def4567890abcdef"
accept_solution "$B1" 0
record_leaderboard "$CONTRIB_A" "$MAINTAINER" "50000000000000000"
echo "  -> Bounty #$B1 COMPLETED and paid out"
echo ""

# ---- Bounty 2: Completed (auth system) ----
B2=$(create_bounty "miguelemosreverte" "playground-01" 2 0.08 6 "prd_b2c3d4e5f6g7" "qa_g7f6e5d4c3b2")
submit_solution "$B2" "$CONTRIB_B" 15 "def456abc789012345fedc"
accept_solution "$B2" 0
record_leaderboard "$CONTRIB_B" "$MAINTAINER" "80000000000000000"
echo "  -> Bounty #$B2 COMPLETED and paid out"
echo ""

# ---- Bounty 3: Open (API caching) ----
B3=$(create_bounty "miguelemosreverte" "playground-01" 5 0.04 4 "prd_c3d4e5f6g7h8" "qa_h8g7f6e5d4c3")
echo "  -> Bounty #$B3 OPEN (no solutions)"
echo ""

# ---- Bounty 4: Open with a solution (dark mode) ----
B4=$(create_bounty "miguelemosreverte" "playground-01" 8 0.06 5 "prd_d4e5f6g7h8i9" "qa_i9h8g7f6e5d4")
submit_solution "$B4" "$CONTRIB_C" 22 "789abc012def345678abcd"
echo "  -> Bounty #$B4 OPEN with 1 solution submitted"
echo ""

# ---- Bounty 5: Completed (performance fix) ----
B5=$(create_bounty "miguelemosreverte" "playground-01" 12 0.12 8 "prd_e5f6g7h8i9j0" "qa_j0i9h8g7f6e5")
submit_solution "$B5" "$CONTRIB_A" 30 "012345abcdef678901bcde"
submit_solution "$B5" "$CONTRIB_C" 31 "fedcba987654321098abcd"
accept_solution "$B5" 0
record_leaderboard "$CONTRIB_A" "$MAINTAINER" "120000000000000000"
echo "  -> Bounty #$B5 COMPLETED with 2 solutions (first accepted)"
echo ""

# ---- Bounty 6: Open (search feature) ----
B6=$(create_bounty "miguelemosreverte" "playground-01" 15 0.03 2 "prd_f6g7h8i9j0k1" "qa_k1j0i9h8g7f6")
echo "  -> Bounty #$B6 OPEN"
echo ""

# ---- Bounty 7: Completed (testing infra) ----
B7=$(create_bounty "miguelemosreverte" "playground-01" 18 0.07 5 "prd_g7h8i9j0k1l2" "qa_l2k1j0i9h8g7")
submit_solution "$B7" "$CONTRIB_B" 40 "abcdef012345789abcfe01"
accept_solution "$B7" 0
record_leaderboard "$CONTRIB_B" "$MAINTAINER" "70000000000000000"
echo "  -> Bounty #$B7 COMPLETED and paid out"
echo ""

echo "============================================"
echo "  Seed complete!"
echo "============================================"
echo ""
echo "  Total bounties:  7"
echo "  Open:            3"
echo "  Completed:       4"
echo "  Total paid out:  0.32 ETH"
echo ""
echo "  Leaderboard:"
echo "    Contributor A ($CONTRIB_A): 2 bounties, 0.17 ETH"
echo "    Contributor B ($CONTRIB_B): 2 bounties, 0.15 ETH"
echo "    Contributor C ($CONTRIB_C): 0 accepted (submitted only)"
echo ""
echo "  Refresh http://localhost:3000 to see the data!"

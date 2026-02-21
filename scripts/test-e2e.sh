#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Test-specific ports to avoid clashing with dev environment
TEST_ANVIL_PORT=8546
TEST_BACKEND_PORT=8081
TEST_RPC_URL="http://127.0.0.1:${TEST_ANVIL_PORT}"
TEST_BASE_URL="http://localhost:${TEST_BACKEND_PORT}"

FOUNDRY_BIN="${HOME}/.foundry/bin"
ANVIL="${FOUNDRY_BIN}/anvil"
FORGE="${FOUNDRY_BIN}/forge"

ANVIL_PID=""
BACKEND_PID=""
TEST_DB="/tmp/test-bounty-$$.db"

# Kill any stale processes on test ports from previous failed runs
kill_stale() {
  local port=$1
  local pid
  pid=$(lsof -ti ":${port}" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Killing stale process on port ${port} (PID ${pid})..."
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi
}

cleanup() {
  echo ""
  echo "Cleaning up..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "$ANVIL_PID" ]   && kill "$ANVIL_PID"   2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$ANVIL_PID"   2>/dev/null || true
  rm -f "$TEST_DB" "${TEST_DB}-wal" "${TEST_DB}-shm"
  echo "Done."
}
trap cleanup EXIT

# Pre-cleanup: ensure test ports are free
kill_stale "$TEST_ANVIL_PORT"
kill_stale "$TEST_BACKEND_PORT"

# -------------------------------------------------------
# 1. Start Anvil on test port
# -------------------------------------------------------
echo "Starting Anvil on port ${TEST_ANVIL_PORT}..."
"$ANVIL" --host 127.0.0.1 --port "$TEST_ANVIL_PORT" --chain-id 31337 \
  > /tmp/test-anvil.log 2>&1 &
ANVIL_PID=$!

# Wait for Anvil to be ready
for i in $(seq 1 30); do
  if curl -s "$TEST_RPC_URL" -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
echo "Anvil ready (PID ${ANVIL_PID})"

# -------------------------------------------------------
# 2. Deploy contracts to test Anvil
# -------------------------------------------------------
echo "Deploying contracts..."
cd "$ROOT_DIR/contracts"
export DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

"$FORGE" script script/Deploy.s.sol:Deploy \
  --rpc-url "$TEST_RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY" > /tmp/test-deploy.log 2>&1

BROADCAST_FILE="$ROOT_DIR/contracts/broadcast/Deploy.s.sol/31337/run-latest.json"
BOUNTY_ADDR=$(jq -r '.transactions[0].contractAddress' "$BROADCAST_FILE")
LEADER_ADDR=$(jq -r '.transactions[1].contractAddress' "$BROADCAST_FILE")

echo "  BountyPlatform: ${BOUNTY_ADDR}"
echo "  Leaderboard:    ${LEADER_ADDR}"

# -------------------------------------------------------
# 2b. Seed chain with initial data (peers, bounties, leaderboard)
# -------------------------------------------------------
echo "Seeding chain with initial data..."
BOUNTY_CONTRACT_ADDRESS="$BOUNTY_ADDR" \
LEADERBOARD_CONTRACT_ADDRESS="$LEADER_ADDR" \
"$FORGE" script script/Seed.s.sol:Seed \
  --rpc-url "$TEST_RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY" > /tmp/test-seed.log 2>&1
echo "Chain seeded (2 bounties, 1 completed, 2 leaderboard entries)"

# -------------------------------------------------------
# 3. Start backend on test port
# -------------------------------------------------------
echo "Starting backend on port ${TEST_BACKEND_PORT}..."
cd "$ROOT_DIR/backend"

ANVIL_RPC_URL="$TEST_RPC_URL" \
ORACLE_PRIVATE_KEY="$DEPLOYER_PRIVATE_KEY" \
BOUNTY_CONTRACT_ADDRESS="$BOUNTY_ADDR" \
LEADERBOARD_CONTRACT_ADDRESS="$LEADER_ADDR" \
GITHUB_WEBHOOK_SECRET="" \
GITHUB_TOKEN="" \
DATABASE_PATH="$TEST_DB" \
PORT="$TEST_BACKEND_PORT" \
  go run ./cmd/server > /tmp/test-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
for i in $(seq 1 30); do
  # Check the process is still alive
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "ERROR: Backend process died on startup. Logs:"
    cat /tmp/test-backend.log
    exit 1
  fi
  if curl -s "${TEST_BASE_URL}/api/health" > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
# Final check — make sure it's OUR backend, not a stale one
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "ERROR: Backend process is not running. Logs:"
  cat /tmp/test-backend.log
  exit 1
fi
echo "Backend ready (PID ${BACKEND_PID})"

# -------------------------------------------------------
# 4. Run Go E2E tests
# -------------------------------------------------------
echo ""
echo "==============================="
echo "Running Go E2E tests..."
echo "==============================="
echo ""

cd "$ROOT_DIR/tests/e2e"
E2E_BASE_URL="${TEST_BASE_URL}" \
E2E_DATABASE_PATH="${TEST_DB}" \
  go test -v -count=1 -timeout 300s ./...

echo ""
echo "All E2E tests passed!"

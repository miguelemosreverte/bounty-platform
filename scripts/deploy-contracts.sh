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

ANVIL_RPC_URL="${ANVIL_RPC_URL:-http://127.0.0.1:8545}"
DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

echo "Deploying contracts to $ANVIL_RPC_URL..."

cd "$ROOT_DIR/contracts"
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$ANVIL_RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY" 2>&1

# Parse addresses from broadcast artifacts
BROADCAST_FILE="$ROOT_DIR/contracts/broadcast/Deploy.s.sol/31337/run-latest.json"

if [ ! -f "$BROADCAST_FILE" ]; then
  echo "ERROR: Broadcast file not found at $BROADCAST_FILE"
  exit 1
fi

BOUNTY_ADDR=$(jq -r '.transactions[0].contractAddress' "$BROADCAST_FILE")
LEADER_ADDR=$(jq -r '.transactions[1].contractAddress' "$BROADCAST_FILE")

echo ""
echo "Contracts deployed:"
echo "  BountyPlatform: $BOUNTY_ADDR"
echo "  Leaderboard:    $LEADER_ADDR"

# Update .env file
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  # Use temp file for portability
  sed "s|^BOUNTY_CONTRACT_ADDRESS=.*|BOUNTY_CONTRACT_ADDRESS=$BOUNTY_ADDR|" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
  sed "s|^LEADERBOARD_CONTRACT_ADDRESS=.*|LEADERBOARD_CONTRACT_ADDRESS=$LEADER_ADDR|" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
  sed "s|^NEXT_PUBLIC_BOUNTY_CONTRACT=.*|NEXT_PUBLIC_BOUNTY_CONTRACT=$BOUNTY_ADDR|" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
  sed "s|^NEXT_PUBLIC_LEADERBOARD_CONTRACT=.*|NEXT_PUBLIC_LEADERBOARD_CONTRACT=$LEADER_ADDR|" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
  echo "Updated .env with contract addresses"
else
  echo "WARNING: .env file not found. Create it from .env.example and set addresses manually."
  echo "  BOUNTY_CONTRACT_ADDRESS=$BOUNTY_ADDR"
  echo "  LEADERBOARD_CONTRACT_ADDRESS=$LEADER_ADDR"
fi

# Create/update frontend/.env.local for Next.js
FRONTEND_ENV="$ROOT_DIR/frontend/.env.local"
cat > "$FRONTEND_ENV" << EOF
NEXT_PUBLIC_BOUNTY_CONTRACT=$BOUNTY_ADDR
NEXT_PUBLIC_LEADERBOARD_CONTRACT=$LEADER_ADDR
NEXT_PUBLIC_API_URL=http://localhost:${PORT:-8080}
EOF
echo "Updated frontend/.env.local"

#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$ROOT_DIR/contracts"
BINDINGS_DIR="$ROOT_DIR/backend/pkg/bindings"
ABIGEN="$(go env GOPATH)/bin/abigen"

mkdir -p "$BINDINGS_DIR"

echo "Building contracts..."
cd "$CONTRACTS_DIR" && forge build

echo "Generating Go bindings..."

# BountyPlatform
jq '.abi' "$CONTRACTS_DIR/out/BountyPlatform.sol/BountyPlatform.json" > /tmp/BountyPlatform.abi
jq -r '.bytecode.object' "$CONTRACTS_DIR/out/BountyPlatform.sol/BountyPlatform.json" > /tmp/BountyPlatform.bin

"$ABIGEN" \
  --abi /tmp/BountyPlatform.abi \
  --bin /tmp/BountyPlatform.bin \
  --pkg bindings \
  --type BountyPlatform \
  --out "$BINDINGS_DIR/bountyplatform.go"

# Leaderboard
jq '.abi' "$CONTRACTS_DIR/out/Leaderboard.sol/Leaderboard.json" > /tmp/Leaderboard.abi
jq -r '.bytecode.object' "$CONTRACTS_DIR/out/Leaderboard.sol/Leaderboard.json" > /tmp/Leaderboard.bin

"$ABIGEN" \
  --abi /tmp/Leaderboard.abi \
  --bin /tmp/Leaderboard.bin \
  --pkg bindings \
  --type Leaderboard \
  --out "$BINDINGS_DIR/leaderboard.go"

echo "Go bindings generated in $BINDINGS_DIR"

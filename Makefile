.PHONY: install contracts-build contracts-test deploy generate backend-build backend-run frontend-dev dev clean help demo test-e2e test

# Default env file
-include .env
export

# Foundry binaries
FOUNDRY_BIN := $(HOME)/.foundry/bin
FORGE := $(FOUNDRY_BIN)/forge
ANVIL := $(FOUNDRY_BIN)/anvil
CAST := $(FOUNDRY_BIN)/cast

ANVIL_RPC_URL ?= http://127.0.0.1:8545
PORT ?= 8080

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	@command -v forge >/dev/null 2>&1 || command -v $(FORGE) >/dev/null 2>&1 || { echo "Install Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup"; exit 1; }
	cd contracts && $(FORGE) install 2>/dev/null || true
	cd backend && go mod download
	cd frontend && npm install
	@command -v smee >/dev/null 2>&1 || npm install -g smee-client

contracts-build: ## Build smart contracts
	cd contracts && $(FORGE) build

contracts-test: ## Run contract tests
	cd contracts && $(FORGE) test -vvv

deploy: ## Deploy contracts to running Anvil
	chmod +x scripts/deploy-contracts.sh
	PATH="$(FOUNDRY_BIN):$$PATH" ./scripts/deploy-contracts.sh

generate: contracts-build ## Generate Go bindings from contract ABIs
	chmod +x scripts/generate-bindings.sh
	./scripts/generate-bindings.sh

backend-build: ## Build Go backend
	cd backend && go build -o ../bin/server ./cmd/server

backend-run: ## Run Go backend
	cd backend && go run ./cmd/server

frontend-dev: ## Run Next.js dev server
	cd frontend && npm run dev

anvil: ## Start Anvil local blockchain
	$(ANVIL) --host 127.0.0.1 --port 8545 --chain-id 31337

smee: ## Start smee webhook forwarding
	@if [ "$(SMEE_URL)" = "https://smee.io/your-channel-id" ] || [ -z "$(SMEE_URL)" ]; then \
		echo "ERROR: Set SMEE_URL in .env first. Get one at https://smee.io/new"; exit 1; \
	fi
	smee --url $(SMEE_URL) --target http://localhost:$(PORT)/api/webhook/github

dev: ## Start full dev environment (run each in separate terminal, or use make dev-all)
	@echo "Run these in separate terminals:"
	@echo "  1. make anvil"
	@echo "  2. make deploy"
	@echo "  3. make smee"
	@echo "  4. make backend-run"
	@echo "  5. make frontend-dev"
	@echo ""
	@echo "Or run: make dev-all (starts everything in background)"

dev-all: ## Start all services in background
	@echo "Starting Anvil..."
	@$(ANVIL) --host 127.0.0.1 --port 8545 --chain-id 31337 > /tmp/anvil.log 2>&1 &
	@sleep 2
	@echo "Deploying contracts..."
	@$(MAKE) deploy
	@echo ""
	@echo "Starting backend..."
	@cd backend && go run ./cmd/server > /tmp/bounty-backend.log 2>&1 &
	@sleep 2
	@echo "Starting smee..."
	@if [ "$(SMEE_URL)" != "https://smee.io/your-channel-id" ] && [ -n "$(SMEE_URL)" ]; then \
		smee --url $(SMEE_URL) --target http://localhost:$(PORT)/api/webhook/github > /tmp/smee.log 2>&1 & \
		echo "  Smee forwarding from $(SMEE_URL)"; \
	else \
		echo "  Smee skipped (set SMEE_URL in .env)"; \
	fi
	@echo "Starting frontend..."
	@cd frontend && npm run dev > /tmp/bounty-frontend.log 2>&1 &
	@sleep 3
	@echo ""
	@echo "=============================="
	@echo "All services running!"
	@echo "  Anvil:    http://localhost:8545"
	@echo "  Backend:  http://localhost:$(PORT)"
	@echo "  Frontend: http://localhost:3000"
	@echo ""
	@echo "Logs:"
	@echo "  Anvil:    /tmp/anvil.log"
	@echo "  Backend:  /tmp/bounty-backend.log"
	@echo "  Frontend: /tmp/bounty-frontend.log"
	@echo "  Smee:     /tmp/smee.log"
	@echo ""
	@echo "To stop: make stop"

demo: ## Run full bounty lifecycle demo against playground repo
	@chmod +x scripts/demo.sh
	@./scripts/demo.sh

stop: ## Stop all background services
	@-pkill -f "anvil --host" 2>/dev/null || true
	@-pkill -f "bounty-platform/backend" 2>/dev/null || true
	@-pkill -f "next dev" 2>/dev/null || true
	@-pkill -f "smee --url" 2>/dev/null || true
	@echo "All services stopped"

test-e2e: ## Run Hurl E2E tests (starts anvil + backend automatically)
	@chmod +x scripts/test-e2e.sh
	@./scripts/test-e2e.sh

test: contracts-test test-e2e ## Run all tests (contracts + E2E)

clean: ## Clean build artifacts
	rm -rf contracts/out contracts/cache contracts/broadcast bin/
	cd frontend && rm -rf .next node_modules/.cache
	@echo "Cleaned"

.DEFAULT_GOAL := help

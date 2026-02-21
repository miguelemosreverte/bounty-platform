.PHONY: install contracts-build contracts-test deploy generate backend-build backend-run frontend-dev dev clean help

# Default env file
-include .env
export

ANVIL_RPC_URL ?= http://127.0.0.1:8545
PORT ?= 8080

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd contracts && forge install
	cd backend && go mod download
	cd frontend && npm install

contracts-build: ## Build smart contracts
	cd contracts && forge build

contracts-test: ## Run contract tests
	cd contracts && forge test -vvv

deploy: ## Deploy contracts to running Anvil
	chmod +x scripts/deploy-contracts.sh
	./scripts/deploy-contracts.sh

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
	anvil --host 0.0.0.0

dev: ## Start full dev environment (run each in separate terminal, or use make dev-all)
	@echo "Run these in separate terminals:"
	@echo "  1. make anvil"
	@echo "  2. make deploy"
	@echo "  3. make backend-run"
	@echo "  4. make frontend-dev"
	@echo ""
	@echo "Or run: make dev-all (starts everything in background)"

dev-all: ## Start all services in background
	@echo "Starting Anvil..."
	@anvil --host 0.0.0.0 > /tmp/anvil.log 2>&1 &
	@sleep 2
	@echo "Deploying contracts..."
	@$(MAKE) deploy
	@echo ""
	@echo "Starting backend..."
	@cd backend && go run ./cmd/server > /tmp/bounty-backend.log 2>&1 &
	@sleep 1
	@echo "Starting frontend..."
	@cd frontend && npm run dev > /tmp/bounty-frontend.log 2>&1 &
	@sleep 2
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
	@echo ""
	@echo "To stop: make stop"

stop: ## Stop all background services
	@-pkill -f "anvil --host" 2>/dev/null || true
	@-pkill -f "bounty-platform/backend" 2>/dev/null || true
	@-pkill -f "next dev" 2>/dev/null || true
	@echo "All services stopped"

clean: ## Clean build artifacts
	rm -rf contracts/out contracts/cache contracts/broadcast bin/
	cd frontend && rm -rf .next node_modules/.cache
	@echo "Cleaned"

.DEFAULT_GOAL := help

package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/agents"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/api"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/blockchain"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/config"
	gh "github.com/miguelemosreverte/bounty-platform/backend/internal/github"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/oracle"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/trade"
)

func main() {
	cfg := config.Load()

	log.Printf("Connecting to blockchain at %s...", cfg.AnvilRPCURL)
	chain, err := blockchain.NewClient(
		cfg.AnvilRPCURL,
		cfg.OraclePrivateKey,
		cfg.BountyContractAddr,
		cfg.LeaderboardContractAddr,
	)
	if err != nil {
		log.Fatalf("Failed to connect to blockchain: %v", err)
	}
	log.Printf("Connected! Chain ID: %s, Oracle: %s", chain.ChainID.String(), chain.OracleAddr.Hex())

	if cfg.BountyContractAddr != "" {
		log.Printf("BountyPlatform contract: %s", chain.BountyAddr.Hex())
		log.Printf("Leaderboard contract: %s", chain.LeaderAddr.Hex())
	} else {
		log.Println("No contract addresses configured. Deploy contracts first.")
	}

	// Initialize SQLite store
	store, err := storage.NewSQLiteStore(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Failed to initialize SQLite store: %v", err)
	}
	defer store.Close()

	// Sync existing on-chain data into SQLite
	if cfg.BountyContractAddr != "" {
		if err := storage.SyncFromChain(store, chain); err != nil {
			log.Printf("Warning: chain sync failed: %v", err)
		}
	}

	// Resolve prompts directory and pick agent implementation
	promptsDir := os.Getenv("GITBUSTERS_PROMPTS_DIR")
	if promptsDir == "" {
		promptsDir = "prompts"
		if _, err := os.Stat(promptsDir); os.IsNotExist(err) {
			if exe, err := os.Executable(); err == nil {
				promptsDir = filepath.Join(filepath.Dir(exe), "..", "..", "..", "prompts")
			}
		}
	}

	var agentSet *agents.AgentSet
	if _, err := os.Stat(filepath.Join(promptsDir, "prd.md")); err == nil {
		log.Printf("Using Claude agent runner with prompts from %s", promptsDir)
		agentSet = agents.NewClaudeAgentSet(promptsDir)
	} else {
		log.Printf("Prompts not found, using stub agents")
		agentSet = agents.NewStubAgentSet()
	}

	ghClient := gh.NewClient(cfg.GitHubToken)
	orc := oracle.NewOracle(chain, ghClient, agentSet, store)
	tp := trade.NewProtocol(store)

	router := api.NewRouter(chain, store, orc, cfg, agentSet, tp)

	log.Printf("Server starting on :%s", cfg.Port)
	log.Printf("  Health:     http://localhost:%s/api/health", cfg.Port)
	log.Printf("  Tasks:      http://localhost:%s/api/tasks", cfg.Port)
	log.Printf("  Agents:     http://localhost:%s/api/agents", cfg.Port)
	log.Printf("  Bounties:   http://localhost:%s/api/bounties (legacy)", cfg.Port)
	log.Printf("  Webhook:    http://localhost:%s/api/webhook/github (legacy)", cfg.Port)

	if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

package main

import (
	"log"
	"net/http"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/agents"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/api"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/blockchain"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/config"
	gh "github.com/miguelemosreverte/bounty-platform/backend/internal/github"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/oracle"
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

	ghClient := gh.NewClient(cfg.GitHubToken)
	agentSet := agents.NewStubAgentSet()
	orc := oracle.NewOracle(chain, ghClient, agentSet)

	router := api.NewRouter(chain, orc, cfg)

	log.Printf("Server starting on :%s", cfg.Port)
	log.Printf("  Health:    http://localhost:%s/api/health", cfg.Port)
	log.Printf("  Bounties:  http://localhost:%s/api/bounties", cfg.Port)
	log.Printf("  Webhook:   http://localhost:%s/api/webhook/github", cfg.Port)

	if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

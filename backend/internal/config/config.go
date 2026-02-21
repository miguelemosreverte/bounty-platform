package config

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AnvilRPCURL      string
	OraclePrivateKey string

	BountyContractAddr      string
	LeaderboardContractAddr string

	GitHubWebhookSecret string
	GitHubToken         string
	GitHubTestRepo      string // "owner/repo"

	Port string
}

func Load() *Config {
	// Try to load .env from project root (parent of backend/)
	envPath := filepath.Join("..", ".env")
	if _, err := os.Stat(envPath); err == nil {
		_ = godotenv.Load(envPath)
	}
	_ = godotenv.Load() // also try current dir

	cfg := &Config{
		AnvilRPCURL:             getEnv("ANVIL_RPC_URL", "http://127.0.0.1:8545"),
		OraclePrivateKey:        getEnv("ORACLE_PRIVATE_KEY", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"),
		BountyContractAddr:      getEnv("BOUNTY_CONTRACT_ADDRESS", ""),
		LeaderboardContractAddr: getEnv("LEADERBOARD_CONTRACT_ADDRESS", ""),
		GitHubWebhookSecret:     getEnv("GITHUB_WEBHOOK_SECRET", ""),
		GitHubToken:             getEnv("GITHUB_TOKEN", ""),
		GitHubTestRepo:          getEnv("GITHUB_TEST_REPO", "miguelemosreverte/playground-01"),
		Port:                    getEnv("PORT", "8080"),
	}

	// Strip 0x prefix from private key if present
	cfg.OraclePrivateKey = strings.TrimPrefix(cfg.OraclePrivateKey, "0x")

	if cfg.BountyContractAddr == "" {
		log.Println("WARNING: BOUNTY_CONTRACT_ADDRESS not set. Run deploy first.")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

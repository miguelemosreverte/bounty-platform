package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/agents"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/config"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/mcp"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/trade"
)

func main() {
	cfg := config.Load()

	store, err := storage.NewSQLiteStore(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Failed to initialize SQLite store: %v", err)
	}
	defer store.Close()

	// Resolve prompts directory
	promptsDir := os.Getenv("GITBUSTERS_PROMPTS_DIR")
	if promptsDir == "" {
		// Default: ../../../prompts relative to this binary, or ./prompts from cwd
		promptsDir = "prompts"
		if _, err := os.Stat(promptsDir); os.IsNotExist(err) {
			// Try relative to executable
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
		log.Printf("Prompts not found at %s, falling back to stub agents", promptsDir)
		agentSet = agents.NewStubAgentSet()
	}

	tp := trade.NewProtocol(store)
	server := mcp.NewServer(store, agentSet, tp)

	log.Println("GitBusters MCP server starting on stdio...")
	server.RunStdio()
}

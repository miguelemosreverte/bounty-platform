package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/blockchain"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/config"
	gh "github.com/miguelemosreverte/bounty-platform/backend/internal/github"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/oracle"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
)

func NewRouter(chain *blockchain.Client, store storage.Store, orc *oracle.Oracle, cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	h := &Handlers{chain: chain, store: store}

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Get("/health", h.Health)
		r.Get("/bounties", h.ListBounties)
		r.Get("/bounties/{id}", h.GetBounty)
		r.Get("/bounties/{id}/solutions", h.GetSolutions)
		r.Get("/leaderboard", h.GetLeaderboard)
		r.Get("/addresses", h.GetAddresses)
	})

	// GitHub webhook
	webhookHandler := gh.NewWebhookHandler(cfg.GitHubWebhookSecret, orc.HandleEvent)
	r.Post("/api/webhook/github", webhookHandler.ServeHTTP)

	return r
}

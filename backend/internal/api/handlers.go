package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/blockchain"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
)

type Handlers struct {
	chain *blockchain.Client
	store storage.Store
}

func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"chainId": h.chain.ChainID.String(),
		"oracle":  h.chain.OracleAddr.Hex(),
	})
}

func (h *Handlers) ListBounties(w http.ResponseWriter, r *http.Request) {
	bounties, err := h.store.ListBounties()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if bounties == nil {
		bounties = []*models.BountyResponse{}
	}
	writeJSON(w, http.StatusOK, bounties)
}

func (h *Handlers) GetBounty(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	bounty, err := h.store.GetBounty(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if bounty == nil {
		// Fallback: not in cache, try chain directly
		bounty, err = h.chain.GetBounty(id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
	}
	writeJSON(w, http.StatusOK, bounty)
}

func (h *Handlers) GetSolutions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	solutions, err := h.store.ListSolutions(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if solutions == nil {
		solutions = []*models.SolutionResponse{}
	}
	writeJSON(w, http.StatusOK, solutions)
}

func (h *Handlers) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	entries, err := h.store.GetLeaderboard()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if entries == nil {
		entries = []*models.LeaderboardEntry{}
	}
	writeJSON(w, http.StatusOK, entries)
}

func (h *Handlers) GetAddresses(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"bountyPlatform": h.chain.BountyAddr.Hex(),
		"leaderboard":    h.chain.LeaderAddr.Hex(),
		"oracle":         h.chain.OracleAddr.Hex(),
	})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

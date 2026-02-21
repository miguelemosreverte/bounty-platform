package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ethereum/go-ethereum/common"
	"github.com/go-chi/chi/v5"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/blockchain"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
)

type Handlers struct {
	chain *blockchain.Client
}

func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"chainId": h.chain.ChainID.String(),
		"oracle":  h.chain.OracleAddr.Hex(),
	})
}

func (h *Handlers) ListBounties(w http.ResponseWriter, r *http.Request) {
	bounties, err := h.chain.ListBounties()
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

	bounty, err := h.chain.GetBounty(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
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

	bounty, err := h.chain.GetBounty(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	var solutions []*models.SolutionResponse
	for i := uint64(0); i < bounty.SolutionCount; i++ {
		sol, err := h.chain.GetSolution(id, i)
		if err != nil {
			continue
		}
		solutions = append(solutions, sol)
	}
	if solutions == nil {
		solutions = []*models.SolutionResponse{}
	}
	writeJSON(w, http.StatusOK, solutions)
}

func (h *Handlers) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	// For the MVP, we return scores for known Anvil addresses
	knownAddresses := []struct {
		addr      string
		actorType uint8
	}{
		// Anvil pre-funded accounts
		{"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 1}, // Account 0 - oracle/maintainer
		{"0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 1}, // Account 1 - maintainer
		{"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 0}, // Account 2 - contributor A
		{"0x90F79bf6EB2c4f870365E785982E1f101E93b906", 0}, // Account 3 - contributor B
	}

	var entries []*models.LeaderboardEntry
	for _, ka := range knownAddresses {
		entry, err := h.chain.GetScore(common.HexToAddress(ka.addr), ka.actorType)
		if err != nil {
			continue
		}
		if entry.Reputation != 0 || entry.TotalBounties > 0 {
			entries = append(entries, entry)
		}
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

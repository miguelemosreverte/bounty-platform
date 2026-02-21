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
	// Collect unique addresses from on-chain bounties and solutions
	type addrRole struct {
		addr      common.Address
		actorType uint8
	}
	seen := make(map[addrRole]bool)

	bounties, _ := h.chain.ListBounties()
	for _, b := range bounties {
		maintainer := common.HexToAddress(b.Maintainer)
		seen[addrRole{maintainer, 1}] = true

		for i := uint64(0); i < b.SolutionCount; i++ {
			sol, err := h.chain.GetSolution(b.ID, i)
			if err != nil {
				continue
			}
			contributor := common.HexToAddress(sol.Contributor)
			if contributor != (common.Address{}) {
				seen[addrRole{contributor, 0}] = true
			}
		}
	}

	var entries []*models.LeaderboardEntry
	for ar := range seen {
		entry, err := h.chain.GetScore(ar.addr, ar.actorType)
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

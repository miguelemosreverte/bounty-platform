package storage

import (
	"log"

	"github.com/ethereum/go-ethereum/common"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/blockchain"
)

// SyncFromChain populates the store with existing on-chain data.
// Called once at startup to catch up if the DB is empty or stale.
func SyncFromChain(store Store, chain *blockchain.Client) error {
	bounties, err := chain.ListBounties()
	if err != nil {
		return err
	}

	// Track unique addresses for leaderboard sync
	type addrRole struct {
		addr      common.Address
		actorType uint8
	}
	seen := make(map[addrRole]bool)

	for _, b := range bounties {
		if err := store.UpsertBounty(b); err != nil {
			log.Printf("sync: failed to upsert bounty %d: %v", b.ID, err)
			continue
		}

		// Track maintainer
		maintainer := common.HexToAddress(b.Maintainer)
		seen[addrRole{maintainer, 1}] = true

		for i := uint64(0); i < b.SolutionCount; i++ {
			sol, err := chain.GetSolution(b.ID, i)
			if err != nil {
				log.Printf("sync: failed to get solution %d/%d: %v", b.ID, i, err)
				continue
			}
			if err := store.UpsertSolution(sol); err != nil {
				log.Printf("sync: failed to upsert solution %d: %v", sol.ID, err)
			}

			// Track contributor
			contributor := common.HexToAddress(sol.Contributor)
			if contributor != (common.Address{}) {
				seen[addrRole{contributor, 0}] = true
			}
		}
	}

	// Sync leaderboard entries
	leaderboardCount := 0
	for ar := range seen {
		entry, err := chain.GetScore(ar.addr, ar.actorType)
		if err != nil {
			continue
		}
		if entry.Reputation != 0 || entry.TotalBounties > 0 {
			if err := store.UpsertLeaderboardEntry(entry); err != nil {
				log.Printf("sync: failed to upsert leaderboard entry: %v", err)
			} else {
				leaderboardCount++
			}
		}
	}

	log.Printf("Synced %d bounties and %d leaderboard entries from chain to SQLite", len(bounties), leaderboardCount)
	return nil
}

package storage

import "github.com/miguelemosreverte/bounty-platform/backend/internal/models"

// Store is the read/write interface for cached bounty data.
// The primary source of truth remains on-chain; SQLite acts as a
// fast read cache that is populated on writes and on startup sync.
type Store interface {
	// Bounty operations
	UpsertBounty(bounty *models.BountyResponse) error
	GetBounty(id uint64) (*models.BountyResponse, error)
	ListBounties() ([]*models.BountyResponse, error)

	// Solution operations
	UpsertSolution(solution *models.SolutionResponse) error
	ListSolutions(bountyID uint64) ([]*models.SolutionResponse, error)

	// Leaderboard operations
	UpsertLeaderboardEntry(entry *models.LeaderboardEntry) error
	GetLeaderboard() ([]*models.LeaderboardEntry, error)

	Close() error
}

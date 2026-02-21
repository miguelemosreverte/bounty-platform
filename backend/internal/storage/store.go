package storage

import "github.com/miguelemosreverte/bounty-platform/backend/internal/models"

// Store is the read/write interface for platform data.
// Legacy bounties are cached from on-chain; tasks/agents/tokens are SQLite-native.
type Store interface {
	// ── Legacy bounty operations ──
	UpsertBounty(bounty *models.BountyResponse) error
	GetBounty(id uint64) (*models.BountyResponse, error)
	ListBounties() ([]*models.BountyResponse, error)
	UpsertSolution(solution *models.SolutionResponse) error
	ListSolutions(bountyID uint64) ([]*models.SolutionResponse, error)
	UpsertLeaderboardEntry(entry *models.LeaderboardEntry) error
	GetLeaderboard() ([]*models.LeaderboardEntry, error)

	// ── Task operations ──
	CreateTask(task *models.Task) (uint64, error)
	GetTask(id uint64) (*models.Task, error)
	ListTasks(status string, language string, limit int) ([]*models.Task, error)
	UpdateTask(task *models.Task) error

	// ── Submission operations ──
	CreateSubmission(sub *models.Submission) (uint64, error)
	GetSubmission(id uint64) (*models.Submission, error)
	ListSubmissions(taskID uint64) ([]*models.Submission, error)
	UpdateSubmission(sub *models.Submission) error

	// ── Agent operations ──
	RegisterAgent(agent *models.Agent) error
	GetAgent(id string) (*models.Agent, error)
	ListAgents(limit int) ([]*models.Agent, error)
	UpdateAgent(agent *models.Agent) error

	// ── Token ledger ──
	RecordTransfer(transfer *models.TokenTransfer) error
	GetTransfers(agentID string, limit int) ([]*models.TokenTransfer, error)

	Close() error
}

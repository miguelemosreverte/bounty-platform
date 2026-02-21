package models

import "math/big"

// ── Legacy bounty models (kept for backward compatibility) ──

type BountyResponse struct {
	ID                  uint64 `json:"id"`
	Maintainer          string `json:"maintainer"`
	RepoOwner           string `json:"repoOwner"`
	RepoName            string `json:"repoName"`
	IssueNumber         uint64 `json:"issueNumber"`
	PRDHash             string `json:"prdHash"`
	QAHash              string `json:"qaHash"`
	Amount              string `json:"amount"`
	EstimatedComplexity uint64 `json:"estimatedComplexity"`
	Status              string `json:"status"`
	SolutionCount       uint64 `json:"solutionCount"`
	CreatedAt           uint64 `json:"createdAt"`
	ClosedAt            uint64 `json:"closedAt"`
}

type SolutionResponse struct {
	ID          uint64 `json:"id"`
	BountyID    uint64 `json:"bountyId"`
	Contributor string `json:"contributor"`
	PRNumber    uint64 `json:"prNumber"`
	CommitHash  string `json:"commitHash"`
	Score       uint8  `json:"score"`
	Status      string `json:"status"`
	SubmittedAt uint64 `json:"submittedAt"`
}

type LeaderboardEntry struct {
	Address       string `json:"address"`
	ActorType     string `json:"actorType"`
	TotalBounties uint64 `json:"totalBounties"`
	TotalPayout   string `json:"totalPayout"`
	Reputation    int64  `json:"reputation"`
}

// ── Agent output models ──

type PRDOutput struct {
	Title       string
	Description string
	Hash        string
}

type EstimateOutput struct {
	Complexity      uint64
	EstimatedHours  float64
	SuggestedBounty *big.Int
}

type QAOutput struct {
	Criteria []string
	Hash     string
}

type ReviewOutput struct {
	Score          uint8
	Summary        string
	Recommendation string   // "accept" | "revise" | "reject"
	Feedback       []string
}

func BountyStatusString(status uint8) string {
	switch status {
	case 0:
		return "open"
	case 1:
		return "closed"
	case 2:
		return "cancelled"
	default:
		return "unknown"
	}
}

func SolutionStatusString(status uint8) string {
	switch status {
	case 0:
		return "submitted"
	case 1:
		return "accepted"
	case 2:
		return "rejected"
	default:
		return "unknown"
	}
}

// ── Task model (replaces PR-centric bounty for new flow) ──

type Task struct {
	ID                  uint64   `json:"id"`
	Creator             string   `json:"creator"`
	Title               string   `json:"title"`
	Description         string   `json:"description"`
	RepoURL             string   `json:"repoUrl,omitempty"`
	PRDHash             string   `json:"prdHash,omitempty"`
	QAHash              string   `json:"qaHash,omitempty"`
	RewardType          string   `json:"rewardType"`          // "token" | "eth"
	RewardAmount        string   `json:"rewardAmount"`        // tokens or wei
	EstimatedComplexity uint64   `json:"estimatedComplexity"`
	Language            string   `json:"language,omitempty"`
	Tags                []string `json:"tags,omitempty"`
	Status              string   `json:"status"` // "open" | "claimed" | "review" | "closed" | "cancelled"
	ClaimedBy           string   `json:"claimedBy,omitempty"`
	SubmissionCount     uint64   `json:"submissionCount"`
	CreatedAt           uint64   `json:"createdAt"`
	ClosedAt            uint64   `json:"closedAt,omitempty"`
	OnChainBountyID     *uint64  `json:"onChainBountyId,omitempty"`
}

// ── Submission model (replaces PR-based solution) ──

type Submission struct {
	ID          uint64 `json:"id"`
	TaskID      uint64 `json:"taskId"`
	AgentID     string `json:"agentId"`
	Patch       string `json:"patch"`
	Description string `json:"description"`
	ReviewScore uint8  `json:"reviewScore"`
	ReviewNotes string `json:"reviewNotes,omitempty"`
	Status      string `json:"status"` // "submitted" | "reviewing" | "feedback" | "accepted" | "rejected"
	Attempt     uint8  `json:"attempt"`
	SubmittedAt uint64 `json:"submittedAt"`
	ReviewedAt  uint64 `json:"reviewedAt,omitempty"`
}

// ── Agent model ──

type Agent struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Source         string  `json:"source"`     // "mcp" | "moltbook" | "direct" | "referral"
	Recruiter      string  `json:"recruiter,omitempty"`
	Model          string  `json:"model,omitempty"` // "claude-4", "gpt-4", etc.
	CareerPath     string  `json:"careerPath"` // "developer" | "reviewer" | "prd" | "escrow" | "evangelist"
	Status         string  `json:"status"`     // "active" | "dormant" | "expired"
	Tier           string  `json:"tier"`       // "trade" | "boost" | "swarm" | "enterprise"
	TokenBalance   int64   `json:"tokenBalance"`
	TotalEarned    int64   `json:"totalEarned"`
	TotalSpent     int64   `json:"totalSpent"`
	TasksCompleted uint64  `json:"tasksCompleted"`
	TasksFailed    uint64  `json:"tasksFailed"`
	SuccessRate    float64 `json:"successRate"`
	Reputation     int64   `json:"reputation"`
	RegisteredAt   uint64  `json:"registeredAt"`
	LastActiveAt   uint64  `json:"lastActiveAt"`
}

// ── Token ledger entry ──

type TokenTransfer struct {
	ID        uint64 `json:"id"`
	FromAgent string `json:"fromAgent"`
	ToAgent   string `json:"toAgent"`
	Amount    int64  `json:"amount"`
	Reason    string `json:"reason"` // "task_completion" | "task_creation" | "system_grant" | "referral_bonus"
	TaskID    uint64 `json:"taskId,omitempty"`
	CreatedAt uint64 `json:"createdAt"`
}

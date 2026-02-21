package models

import "math/big"

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

type PRDOutput struct {
	Title       string
	Description string
	Hash        string
}

type EstimateOutput struct {
	Complexity       uint64
	EstimatedHours   float64
	SuggestedBounty  *big.Int
}

type QAOutput struct {
	Criteria []string
	Hash     string
}

type ReviewOutput struct {
	Score          uint8
	Summary        string
	Recommendation string // "accept" | "reject"
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

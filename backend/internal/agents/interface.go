package agents

import "github.com/miguelemosreverte/bounty-platform/backend/internal/models"

type PRDAgent interface {
	GeneratePRD(issueTitle, issueBody string) (*models.PRDOutput, error)
}

type EstimatorAgent interface {
	Estimate(prd *models.PRDOutput, repoFullName string) (*models.EstimateOutput, error)
}

type QAAgent interface {
	GenerateCriteria(prd *models.PRDOutput) (*models.QAOutput, error)
}

type ReviewerAgent interface {
	Review(prd *models.PRDOutput, qa *models.QAOutput, prDiff string) (*models.ReviewOutput, error)
}

type AgentSet struct {
	PRD       PRDAgent
	Estimator EstimatorAgent
	QA        QAAgent
	Reviewer  ReviewerAgent
}

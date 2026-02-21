package agents

import (
	"crypto/sha256"
	"fmt"
	"math/big"
	"strings"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
)

// StubPRD returns a structured PRD from the issue content.
type StubPRD struct{}

func NewStubPRD() *StubPRD { return &StubPRD{} }

func (s *StubPRD) GeneratePRD(issueTitle, issueBody string) (*models.PRDOutput, error) {
	description := fmt.Sprintf("## Problem\n%s\n\n## Expected Behavior\nResolve the issue as described.\n\n## Acceptance Criteria\n- The fix addresses the described problem\n- Tests pass\n- No regressions introduced", issueBody)

	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(description)))

	return &models.PRDOutput{
		Title:       issueTitle,
		Description: description,
		Hash:        hash[:16],
	}, nil
}

// StubEstimator returns a fixed complexity and bounty amount.
type StubEstimator struct{}

func NewStubEstimator() *StubEstimator { return &StubEstimator{} }

func (s *StubEstimator) Estimate(prd *models.PRDOutput, repoFullName string) (*models.EstimateOutput, error) {
	// Simple heuristic: word count of description
	words := len(strings.Fields(prd.Description))
	complexity := uint64(words / 20)
	if complexity < 1 {
		complexity = 1
	}
	if complexity > 10 {
		complexity = 10
	}

	// 0.01 ETH per complexity point
	bountyWei := new(big.Int).Mul(
		big.NewInt(int64(complexity)),
		big.NewInt(1e16), // 0.01 ETH in wei
	)

	return &models.EstimateOutput{
		Complexity:      complexity,
		EstimatedHours:  float64(complexity) * 2,
		SuggestedBounty: bountyWei,
	}, nil
}

// StubQA returns generic acceptance criteria.
type StubQA struct{}

func NewStubQA() *StubQA { return &StubQA{} }

func (s *StubQA) GenerateCriteria(prd *models.PRDOutput) (*models.QAOutput, error) {
	criteria := []string{
		"All existing tests pass",
		"New functionality is covered by tests",
		"Code follows project style guidelines",
		"No security vulnerabilities introduced",
	}

	combined := strings.Join(criteria, "\n")
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(combined)))

	return &models.QAOutput{
		Criteria: criteria,
		Hash:     hash[:16],
	}, nil
}

// StubReviewer always accepts with a score of 80.
type StubReviewer struct{}

func NewStubReviewer() *StubReviewer { return &StubReviewer{} }

func (s *StubReviewer) Review(prd *models.PRDOutput, qa *models.QAOutput, prDiff string) (*models.ReviewOutput, error) {
	return &models.ReviewOutput{
		Score:          80,
		Summary:        "Solution meets acceptance criteria. Code quality is acceptable.",
		Recommendation: "accept",
	}, nil
}

func NewStubAgentSet() *AgentSet {
	return &AgentSet{
		PRD:       NewStubPRD(),
		Estimator: NewStubEstimator(),
		QA:        NewStubQA(),
		Reviewer:  NewStubReviewer(),
	}
}

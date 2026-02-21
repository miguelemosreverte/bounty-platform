package blockchain

import (
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
)

func (c *Client) CreateBountyOnChain(repoOwner, repoName string, issueNum uint64, amountWei *big.Int) (uint64, error) {
	auth, err := c.AuthWithValue(amountWei)
	if err != nil {
		return 0, err
	}

	tx, err := c.Bounty.CreateBounty(auth, repoOwner, repoName, new(big.Int).SetUint64(issueNum))
	if err != nil {
		return 0, fmt.Errorf("createBounty tx: %w", err)
	}

	receipt, err := bind.WaitMined(auth.Context, c.Eth, tx)
	if err != nil {
		return 0, fmt.Errorf("wait mined: %w", err)
	}
	_ = receipt

	nextID, err := c.Bounty.NextBountyId(&bind.CallOpts{})
	if err != nil {
		return 0, err
	}
	return nextID.Uint64(), nil
}

func (c *Client) UpdateBountyMetadata(bountyID uint64, prdHash, qaHash string, complexity uint64) error {
	auth, err := c.Auth()
	if err != nil {
		return err
	}

	tx, err := c.Bounty.UpdateBountyMetadata(auth,
		new(big.Int).SetUint64(bountyID),
		prdHash, qaHash,
		new(big.Int).SetUint64(complexity),
	)
	if err != nil {
		return fmt.Errorf("updateBountyMetadata tx: %w", err)
	}

	_, err = bind.WaitMined(auth.Context, c.Eth, tx)
	return err
}

func (c *Client) SubmitSolutionOnChain(bountyID uint64, contributor common.Address, prNum uint64, commitHash string) (uint64, error) {
	auth, err := c.Auth()
	if err != nil {
		return 0, err
	}

	tx, err := c.Bounty.SubmitSolution(auth,
		new(big.Int).SetUint64(bountyID),
		contributor,
		new(big.Int).SetUint64(prNum),
		commitHash,
	)
	if err != nil {
		return 0, fmt.Errorf("submitSolution tx: %w", err)
	}

	_, err = bind.WaitMined(auth.Context, c.Eth, tx)
	if err != nil {
		return 0, err
	}

	nextID, err := c.Bounty.NextSolutionId(&bind.CallOpts{})
	if err != nil {
		return 0, err
	}
	return nextID.Uint64(), nil
}

func (c *Client) AcceptSolutionOnChain(bountyID uint64, solutionIndex uint64) error {
	auth, err := c.Auth()
	if err != nil {
		return err
	}

	tx, err := c.Bounty.AcceptSolution(auth,
		new(big.Int).SetUint64(bountyID),
		new(big.Int).SetUint64(solutionIndex),
	)
	if err != nil {
		return fmt.Errorf("acceptSolution tx: %w", err)
	}

	_, err = bind.WaitMined(auth.Context, c.Eth, tx)
	return err
}

func (c *Client) GetBounty(bountyID uint64) (*models.BountyResponse, error) {
	b, err := c.Bounty.Bounties(&bind.CallOpts{}, new(big.Int).SetUint64(bountyID))
	if err != nil {
		return nil, err
	}

	solCount, err := c.Bounty.SolutionCount(&bind.CallOpts{}, new(big.Int).SetUint64(bountyID))
	if err != nil {
		return nil, err
	}

	return &models.BountyResponse{
		ID:                  b.Id.Uint64(),
		Maintainer:          b.Maintainer.Hex(),
		RepoOwner:           b.RepoOwner,
		RepoName:            b.RepoName,
		IssueNumber:         b.IssueNumber.Uint64(),
		PRDHash:             b.PrdHash,
		QAHash:              b.QaHash,
		Amount:              b.Amount.String(),
		EstimatedComplexity: b.EstimatedComplexity.Uint64(),
		Status:              models.BountyStatusString(b.Status),
		SolutionCount:       solCount.Uint64(),
		CreatedAt:           b.CreatedAt.Uint64(),
		ClosedAt:            b.ClosedAt.Uint64(),
	}, nil
}

func (c *Client) GetSolution(bountyID uint64, index uint64) (*models.SolutionResponse, error) {
	s, err := c.Bounty.GetSolution(&bind.CallOpts{}, new(big.Int).SetUint64(bountyID), new(big.Int).SetUint64(index))
	if err != nil {
		return nil, err
	}

	return &models.SolutionResponse{
		ID:          s.Id.Uint64(),
		BountyID:    s.BountyId.Uint64(),
		Contributor: s.Contributor.Hex(),
		PRNumber:    s.PrNumber.Uint64(),
		CommitHash:  s.CommitHash,
		Score:       s.Score,
		Status:      models.SolutionStatusString(s.Status),
		SubmittedAt: s.SubmittedAt.Uint64(),
	}, nil
}

func (c *Client) ListBounties() ([]*models.BountyResponse, error) {
	nextID, err := c.Bounty.NextBountyId(&bind.CallOpts{})
	if err != nil {
		return nil, err
	}

	var bounties []*models.BountyResponse
	for i := uint64(1); i <= nextID.Uint64(); i++ {
		b, err := c.GetBounty(i)
		if err != nil {
			continue
		}
		if b.ID == 0 {
			continue
		}
		bounties = append(bounties, b)
	}
	return bounties, nil
}

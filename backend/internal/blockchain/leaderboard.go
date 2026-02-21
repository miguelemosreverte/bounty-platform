package blockchain

import (
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
)

func (c *Client) RecordBountyCompleted(contributor, maintainer common.Address, payoutWei *big.Int) error {
	auth, err := c.Auth()
	if err != nil {
		return err
	}

	tx, err := c.Leaderboard.RecordBountyCompleted(auth, contributor, maintainer, payoutWei)
	if err != nil {
		return err
	}
	_, err = bind.WaitMined(auth.Context, c.Eth, tx)
	return err
}

func (c *Client) GetScore(addr common.Address, actorType uint8) (*models.LeaderboardEntry, error) {
	score, err := c.Leaderboard.GetScore(&bind.CallOpts{}, addr, actorType)
	if err != nil {
		return nil, err
	}

	actorName := "contributor"
	if actorType == 1 {
		actorName = "maintainer"
	} else if actorType == 2 {
		actorName = "plugin"
	}

	return &models.LeaderboardEntry{
		Address:       addr.Hex(),
		ActorType:     actorName,
		TotalBounties: score.TotalBounties.Uint64(),
		TotalPayout:   score.TotalPayout.String(),
		Reputation:    score.Reputation.Int64(),
	}, nil
}

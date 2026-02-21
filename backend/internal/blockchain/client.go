package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"

	"github.com/miguelemosreverte/bounty-platform/backend/pkg/bindings"
)

type Client struct {
	Eth         *ethclient.Client
	ChainID     *big.Int
	OracleKey   *ecdsa.PrivateKey
	OracleAddr  common.Address
	Bounty      *bindings.BountyPlatform
	Leaderboard *bindings.Leaderboard
	BountyAddr  common.Address
	LeaderAddr  common.Address
}

func NewClient(rpcURL, privateKeyHex, bountyAddr, leaderboardAddr string) (*Client, error) {
	eth, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("dial rpc: %w", err)
	}

	chainID, err := eth.ChainID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("get chain id: %w", err)
	}

	key, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}

	addr := crypto.PubkeyToAddress(key.PublicKey)

	c := &Client{
		Eth:        eth,
		ChainID:    chainID,
		OracleKey:  key,
		OracleAddr: addr,
	}

	if bountyAddr != "" {
		c.BountyAddr = common.HexToAddress(bountyAddr)
		c.Bounty, err = bindings.NewBountyPlatform(c.BountyAddr, eth)
		if err != nil {
			return nil, fmt.Errorf("bind bounty contract: %w", err)
		}
	}

	if leaderboardAddr != "" {
		c.LeaderAddr = common.HexToAddress(leaderboardAddr)
		c.Leaderboard, err = bindings.NewLeaderboard(c.LeaderAddr, eth)
		if err != nil {
			return nil, fmt.Errorf("bind leaderboard contract: %w", err)
		}
	}

	return c, nil
}

func (c *Client) Auth() (*bind.TransactOpts, error) {
	auth, err := bind.NewKeyedTransactorWithChainID(c.OracleKey, c.ChainID)
	if err != nil {
		return nil, err
	}
	return auth, nil
}

func (c *Client) AuthWithValue(value *big.Int) (*bind.TransactOpts, error) {
	auth, err := c.Auth()
	if err != nil {
		return nil, err
	}
	auth.Value = value
	return auth, nil
}

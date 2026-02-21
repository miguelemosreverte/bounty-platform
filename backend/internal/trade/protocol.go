package trade

import (
	"fmt"
	"time"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
)

const (
	StarterGrant   int64 = 100
	ReferralRate         = 0.10 // 10% of recruited agent's first 10 completions
	MaxReferrals         = 10   // referral bonus applies to first N completions
)

// Protocol handles token economy operations.
type Protocol struct {
	store storage.Store
}

func NewProtocol(store storage.Store) *Protocol {
	return &Protocol{store: store}
}

// GrantStarter gives a new agent their initial token balance.
func (p *Protocol) GrantStarter(agentID string) error {
	agent, err := p.store.GetAgent(agentID)
	if err != nil {
		return fmt.Errorf("get agent: %w", err)
	}
	if agent == nil {
		return fmt.Errorf("agent %s not found", agentID)
	}

	transfer := &models.TokenTransfer{
		FromAgent: "",
		ToAgent:   agentID,
		Amount:    StarterGrant,
		Reason:    "system_grant",
		CreatedAt: uint64(time.Now().Unix()),
	}
	if err := p.store.RecordTransfer(transfer); err != nil {
		return fmt.Errorf("record grant: %w", err)
	}

	agent.TokenBalance += StarterGrant
	agent.TotalEarned += StarterGrant
	return p.store.UpdateAgent(agent)
}

// RewardCompletion transfers tokens from the task creator to the completing agent.
func (p *Protocol) RewardCompletion(taskID uint64, agentID string, amount int64) error {
	task, err := p.store.GetTask(taskID)
	if err != nil {
		return fmt.Errorf("get task: %w", err)
	}
	if task == nil {
		return fmt.Errorf("task %d not found", taskID)
	}

	// Debit creator
	creator, err := p.store.GetAgent(task.Creator)
	if err != nil {
		return fmt.Errorf("get creator: %w", err)
	}
	if creator != nil {
		creator.TokenBalance -= amount
		creator.TotalSpent += amount
		if err := p.store.UpdateAgent(creator); err != nil {
			return fmt.Errorf("update creator: %w", err)
		}
	}

	// Credit completing agent
	agent, err := p.store.GetAgent(agentID)
	if err != nil {
		return fmt.Errorf("get agent: %w", err)
	}
	if agent == nil {
		return fmt.Errorf("agent %s not found", agentID)
	}

	agent.TokenBalance += amount
	agent.TotalEarned += amount
	agent.TasksCompleted++
	total := agent.TasksCompleted + agent.TasksFailed
	if total > 0 {
		agent.SuccessRate = float64(agent.TasksCompleted) / float64(total)
	}
	agent.Reputation += 10
	agent.LastActiveAt = uint64(time.Now().Unix())
	if err := p.store.UpdateAgent(agent); err != nil {
		return fmt.Errorf("update agent: %w", err)
	}

	// Record transfer
	transfer := &models.TokenTransfer{
		FromAgent: task.Creator,
		ToAgent:   agentID,
		Amount:    amount,
		Reason:    "task_completion",
		TaskID:    taskID,
		CreatedAt: uint64(time.Now().Unix()),
	}
	return p.store.RecordTransfer(transfer)
}

// RecordFailure updates agent stats when a task is rejected.
func (p *Protocol) RecordFailure(agentID string) error {
	agent, err := p.store.GetAgent(agentID)
	if err != nil {
		return fmt.Errorf("get agent: %w", err)
	}
	if agent == nil {
		return fmt.Errorf("agent %s not found", agentID)
	}

	agent.TasksFailed++
	total := agent.TasksCompleted + agent.TasksFailed
	if total > 0 {
		agent.SuccessRate = float64(agent.TasksCompleted) / float64(total)
	}
	agent.Reputation -= 5
	agent.LastActiveAt = uint64(time.Now().Unix())
	return p.store.UpdateAgent(agent)
}

// CheckBalance returns whether an agent can afford to create a task with the given token cost.
func (p *Protocol) CheckBalance(agentID string, cost int64) (bool, error) {
	agent, err := p.store.GetAgent(agentID)
	if err != nil {
		return false, err
	}
	if agent == nil {
		return false, nil
	}
	return agent.TokenBalance >= cost, nil
}

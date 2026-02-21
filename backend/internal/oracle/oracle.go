package oracle

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/agents"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/blockchain"
	gh "github.com/miguelemosreverte/bounty-platform/backend/internal/github"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
)

type event struct {
	eventType string
	payload   *gh.WebhookPayload
}

type Oracle struct {
	chain  *blockchain.Client
	gh     *gh.Client
	agents *agents.AgentSet
	store  storage.Store
	queue  chan event
}

func NewOracle(chain *blockchain.Client, ghClient *gh.Client, agentSet *agents.AgentSet, store storage.Store) *Oracle {
	o := &Oracle{
		chain:  chain,
		gh:     ghClient,
		agents: agentSet,
		store:  store,
		queue:  make(chan event, 100),
	}
	go o.processQueue()
	return o
}

// processQueue serializes event processing to avoid nonce collisions
// when multiple webhooks arrive concurrently.
func (o *Oracle) processQueue() {
	for ev := range o.queue {
		o.handleEventSync(ev.eventType, ev.payload)
	}
}

// HandleEvent enqueues the event for sequential processing.
func (o *Oracle) HandleEvent(eventType string, payload *gh.WebhookPayload) {
	o.queue <- event{eventType: eventType, payload: payload}
}

func (o *Oracle) handleEventSync(eventType string, payload *gh.WebhookPayload) {
	switch eventType {
	case "issues":
		if payload.Action == "labeled" && payload.Issue != nil {
			o.onIssueLabeled(payload)
		}
	case "pull_request":
		if payload.Action == "opened" && payload.PullRequest != nil {
			o.onPROpened(payload)
		}
		if payload.Action == "closed" && payload.PullRequest != nil && payload.PullRequest.Merged {
			o.onPRMerged(payload)
		}
	}
}

func (o *Oracle) onIssueLabeled(payload *gh.WebhookPayload) {
	if payload.Label == nil || !strings.EqualFold(payload.Label.Name, "bounty") {
		return
	}

	issue := payload.Issue
	repo := payload.Repository
	log.Printf("Bounty label added to issue #%d in %s", issue.Number, repo.FullName)

	ctx := context.Background()

	// 1. Run PRD agent
	prd, err := o.agents.PRD.GeneratePRD(issue.Title, issue.Body)
	if err != nil {
		log.Printf("PRD agent error: %v", err)
		return
	}

	// 2. Run Estimator agent
	est, err := o.agents.Estimator.Estimate(prd, repo.FullName)
	if err != nil {
		log.Printf("Estimator agent error: %v", err)
		return
	}

	// 3. Run QA agent
	qa, err := o.agents.QA.GenerateCriteria(prd)
	if err != nil {
		log.Printf("QA agent error: %v", err)
		return
	}

	// 4. Create bounty on-chain (oracle funds it)
	bountyID, err := o.chain.CreateBountyOnChain(
		repo.Owner.Login, repo.Name,
		uint64(issue.Number),
		est.SuggestedBounty,
	)
	if err != nil {
		log.Printf("Create bounty on-chain error: %v", err)
		return
	}
	log.Printf("Bounty #%d created on-chain for issue #%d (amount: %s wei)",
		bountyID, issue.Number, est.SuggestedBounty.String())

	// 5. Update metadata on-chain
	if err := o.chain.UpdateBountyMetadata(bountyID, prd.Hash, qa.Hash, est.Complexity); err != nil {
		log.Printf("Update metadata error: %v", err)
	}

	// 6. Cache in SQLite — read fresh from chain to get all fields
	if bounty, err := o.chain.GetBounty(bountyID); err == nil {
		if err := o.store.UpsertBounty(bounty); err != nil {
			log.Printf("SQLite upsert bounty error: %v", err)
		}
	}

	// 7. Post comment on GitHub issue
	comment := formatBountyComment(bountyID, prd, est, qa)
	if err := o.gh.PostComment(ctx, repo.Owner.Login, repo.Name, issue.Number, comment); err != nil {
		log.Printf("Post comment error: %v", err)
	}
}

func (o *Oracle) onPROpened(payload *gh.WebhookPayload) {
	pr := payload.PullRequest
	repo := payload.Repository

	issueNum, ok := gh.ParseIssueNumber(pr.Body)
	if !ok {
		log.Printf("PR #%d does not reference a bounty issue", pr.Number)
		return
	}

	wallet, ok := gh.ParseWalletAddress(pr.Body)
	if !ok {
		log.Printf("PR #%d does not include a wallet address", pr.Number)
		ctx := context.Background()
		_ = o.gh.PostComment(ctx, repo.Owner.Login, repo.Name, pr.Number,
			"Please include your wallet address in the PR body:\n```\n<!-- bounty-wallet: 0xYourAddressHere -->\n```")
		return
	}

	bountyID, err := o.chain.Bounty.IssueToBounty(&bind.CallOpts{},
		issueKey(repo.Owner.Login, repo.Name, uint64(issueNum)))
	if err != nil || bountyID.Uint64() == 0 {
		log.Printf("No bounty found for issue #%d", issueNum)
		return
	}

	solutionID, err := o.chain.SubmitSolutionOnChain(
		bountyID.Uint64(),
		common.HexToAddress(wallet),
		uint64(pr.Number),
		pr.Head.SHA,
	)
	if err != nil {
		log.Printf("Submit solution on-chain error: %v", err)
		return
	}

	log.Printf("Solution #%d registered for bounty #%d (PR #%d, wallet: %s)",
		solutionID, bountyID.Uint64(), pr.Number, wallet)

	// Cache solution in SQLite — use bounty-local index (solutionCount - 1)
	if bounty, err := o.chain.GetBounty(bountyID.Uint64()); err == nil {
		if err := o.store.UpsertBounty(bounty); err != nil {
			log.Printf("SQLite update bounty error: %v", err)
		}
		if bounty.SolutionCount > 0 {
			if sol, err := o.chain.GetSolution(bountyID.Uint64(), bounty.SolutionCount-1); err == nil {
				if err := o.store.UpsertSolution(sol); err != nil {
					log.Printf("SQLite upsert solution error: %v", err)
				}
			}
		}
	}

	ctx := context.Background()
	comment := fmt.Sprintf("Solution registered on-chain for Bounty #%d.\n\n- Solution ID: %d\n- Contributor wallet: `%s`\n- Commit: `%s`",
		bountyID.Uint64(), solutionID, wallet, pr.Head.SHA)
	_ = o.gh.PostComment(ctx, repo.Owner.Login, repo.Name, pr.Number, comment)
}

func (o *Oracle) onPRMerged(payload *gh.WebhookPayload) {
	pr := payload.PullRequest
	repo := payload.Repository

	issueNum, ok := gh.ParseIssueNumber(pr.Body)
	if !ok {
		return
	}

	bountyID, err := o.chain.Bounty.IssueToBounty(&bind.CallOpts{},
		issueKey(repo.Owner.Login, repo.Name, uint64(issueNum)))
	if err != nil || bountyID.Uint64() == 0 {
		return
	}

	solCount, err := o.chain.Bounty.SolutionCount(&bind.CallOpts{}, bountyID)
	if err != nil || solCount.Uint64() == 0 {
		log.Printf("No solutions found for bounty #%d", bountyID.Uint64())
		return
	}

	var solutionIndex uint64
	var found bool
	for i := uint64(0); i < solCount.Uint64(); i++ {
		sol, err := o.chain.Bounty.GetSolution(&bind.CallOpts{}, bountyID, new(big.Int).SetUint64(i))
		if err != nil {
			continue
		}
		if sol.PrNumber.Uint64() == uint64(pr.Number) {
			solutionIndex = i
			found = true
			break
		}
	}

	if !found {
		log.Printf("Solution for PR #%d not found on-chain", pr.Number)
		return
	}

	// Get bounty data for payout amount and agent context
	ctx := context.Background()
	bountyData, err := o.chain.GetBounty(bountyID.Uint64())
	if err != nil {
		log.Printf("Failed to get bounty #%d data: %v", bountyID.Uint64(), err)
		return
	}

	// Capture payout amount before it's zeroed out by acceptSolution
	payoutAmount := new(big.Int)
	payoutAmount.SetString(bountyData.Amount, 10)

	// Run reviewer agent
	diff, _ := o.gh.GetPRDiff(ctx, repo.Owner.Login, repo.Name, pr.Number)
	prd := &models.PRDOutput{Hash: bountyData.PRDHash}
	qa := &models.QAOutput{Hash: bountyData.QAHash}

	review, err := o.agents.Reviewer.Review(prd, qa, diff)
	if err != nil {
		log.Printf("Reviewer agent error: %v", err)
		review = &models.ReviewOutput{Score: 80, Summary: "Auto-accepted on merge", Recommendation: "accept"}
	}

	if review.Recommendation == "accept" {
		if err := o.chain.AcceptSolutionOnChain(bountyID.Uint64(), solutionIndex); err != nil {
			log.Printf("Accept solution error: %v", err)
			return
		}

		log.Printf("Bounty #%d paid out! Solution index %d accepted (amount: %s wei).",
			bountyID.Uint64(), solutionIndex, payoutAmount.String())

		sol, err := o.chain.Bounty.GetSolution(&bind.CallOpts{}, bountyID, new(big.Int).SetUint64(solutionIndex))
		if err != nil {
			log.Printf("Failed to get solution after acceptance: %v", err)
			return
		}
		bounty, err := o.chain.Bounty.Bounties(&bind.CallOpts{}, bountyID)
		if err != nil {
			log.Printf("Failed to get bounty after acceptance: %v", err)
			return
		}

		if sol.Contributor != (common.Address{}) {
			if err := o.chain.RecordBountyCompleted(sol.Contributor, bounty.Maintainer, payoutAmount); err != nil {
				log.Printf("Failed to update leaderboard: %v", err)
			}
		}

		// Cache updated state in SQLite
		if updatedBounty, err := o.chain.GetBounty(bountyID.Uint64()); err == nil {
			_ = o.store.UpsertBounty(updatedBounty)
		}
		if updatedSol, err := o.chain.GetSolution(bountyID.Uint64(), solutionIndex); err == nil {
			_ = o.store.UpsertSolution(updatedSol)
		}
		// Update leaderboard cache
		if sol.Contributor != (common.Address{}) {
			if entry, err := o.chain.GetScore(sol.Contributor, 0); err == nil {
				_ = o.store.UpsertLeaderboardEntry(entry)
			}
			if entry, err := o.chain.GetScore(bounty.Maintainer, 1); err == nil {
				_ = o.store.UpsertLeaderboardEntry(entry)
			}
		}

		ethAmount := new(big.Float).Quo(
			new(big.Float).SetInt(payoutAmount),
			new(big.Float).SetFloat64(1e18),
		)
		comment := fmt.Sprintf("Bounty #%d has been paid out!\n\n- Contributor: `%s`\n- Payout: %s ETH\n- Review score: %d/100\n- Summary: %s",
			bountyID.Uint64(), sol.Contributor.Hex(), ethAmount.Text('f', 4), review.Score, review.Summary)
		if err := o.gh.PostComment(ctx, repo.Owner.Login, repo.Name, pr.Number, comment); err != nil {
			log.Printf("Failed to post payout comment: %v", err)
		}
	}
}

func formatBountyComment(bountyID uint64, prd *models.PRDOutput, est *models.EstimateOutput, qa *models.QAOutput) string {
	criteria := ""
	for _, c := range qa.Criteria {
		criteria += fmt.Sprintf("- [ ] %s\n", c)
	}

	ethAmount := new(big.Float).Quo(
		new(big.Float).SetInt(est.SuggestedBounty),
		new(big.Float).SetFloat64(1e18),
	)

	return fmt.Sprintf(`**Bounty #%d Created**

**Estimated Complexity:** %d/10
**Bounty Amount:** %s ETH
**Estimated Hours:** %.0f

### PRD
%s

### QA Criteria
%s
### How to Claim
1. Open a PR that fixes this issue
2. Include in your PR body:
   - `+"`Fixes #%d`"+`
   - `+"`<!-- bounty-wallet: 0xYourAddressHere -->`"+`
3. Once merged, the bounty will be automatically paid to your wallet.
`,
		bountyID, est.Complexity, ethAmount.Text('f', 4),
		est.EstimatedHours, prd.Description, criteria, int(bountyID),
	)
}

// issueKey replicates keccak256(abi.encodePacked(owner, repo, issueNum))
func issueKey(owner, repo string, issueNum uint64) [32]byte {
	data := []byte(owner)
	data = append(data, []byte(repo)...)
	padded := make([]byte, 32)
	numBytes := new(big.Int).SetUint64(issueNum).Bytes()
	copy(padded[32-len(numBytes):], numBytes)
	data = append(data, padded...)

	hash := crypto.Keccak256(data)
	var result [32]byte
	copy(result[:], hash)
	return result
}

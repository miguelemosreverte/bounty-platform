package e2e

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testPRClosedNotMerged(t *testing.T) {
	// Step 1: Find Bounty B at index [3].
	var bountyBID float64
	t.Run("Find Bounty B at index 3", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		require.True(t, len(body) >= 4, "expected at least 4 bounties, got %d", len(body))

		bountyB := asObj(body[3])
		bountyBID = jsonFloat(bountyB, "id")
		require.NotZero(t, bountyBID, "bountyBID should not be zero")
	})

	// Step 2: Verify Bounty B is open.
	var amountBefore string
	t.Run("Bounty B is open", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/bounties/%d", int(bountyBID)))
		require.Equal(t, 200, status)

		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, "beta", jsonString(body, "repoName"))
		amountBefore = jsonString(body, "amount")
		require.NotEmpty(t, amountBefore, "amount should not be empty")
	})

	// Step 3: Submit solution for Bounty B (open PR #30).
	t.Run("Submit solution for Bounty B — open PR #30", func(t *testing.T) {
		payload := prWebhook("opened", 30,
			"Implement search feature",
			"Fixes #5\n\nAdded full text search.\n\n<!-- bounty-wallet: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 -->",
			"open", false,
			"search111222333444",
			"feat/search",
			"test", "beta")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	// Step 4: Poll until solution appears.
	t.Run("Solution appears for Bounty B", func(t *testing.T) {
		var solutions []interface{}
		pollUntil(t, "solution for Bounty B to appear", 10, 1*time.Second, func() bool {
			status, _, body := httpGetArray(t, fmt.Sprintf("/api/bounties/%d/solutions", int(bountyBID)))
			if status != 200 || len(body) < 1 {
				return false
			}
			sol := asObj(body[0])
			if jsonFloat(sol, "prNumber") == 30 && jsonString(sol, "status") == "submitted" {
				solutions = body
				return true
			}
			return false
		})

		require.Len(t, solutions, 1)
		sol := asObj(solutions[0])
		assert.Equal(t, float64(30), jsonFloat(sol, "prNumber"))
		assert.Equal(t, "submitted", jsonString(sol, "status"))
	})

	// Step 5: Close PR #30 WITHOUT merging.
	t.Run("Close PR #30 without merging", func(t *testing.T) {
		payload := prWebhook("closed", 30,
			"Implement search feature",
			"Fixes #5\n\nAdded full text search.\n\n<!-- bounty-wallet: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 -->",
			"closed", false,
			"search111222333444",
			"feat/search",
			"test", "beta")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	// Step 6: Verify bounty is STILL open (retry to let processing complete).
	t.Run("Bounty B still open after PR closed without merge", func(t *testing.T) {
		var bounty map[string]interface{}
		pollUntil(t, "bounty B still open after close event", 3, 1*time.Second, func() bool {
			status, _, body := httpGet(t, fmt.Sprintf("/api/bounties/%d", int(bountyBID)))
			if status != 200 {
				return false
			}
			if jsonString(body, "status") == "open" {
				bounty = body
				return true
			}
			return false
		})

		require.NotNil(t, bounty)
		assert.Equal(t, "open", jsonString(bounty, "status"))
		assert.Equal(t, amountBefore, jsonString(bounty, "amount"))
		assert.Equal(t, float64(0), jsonFloat(bounty, "closedAt"))
	})

	// Step 7: Solution stays "submitted".
	t.Run("Solution stays submitted", func(t *testing.T) {
		status, _, body := httpGetArray(t, fmt.Sprintf("/api/bounties/%d/solutions", int(bountyBID)))
		require.Equal(t, 200, status)
		require.Len(t, body, 1)

		sol := asObj(body[0])
		assert.Equal(t, "submitted", jsonString(sol, "status"))
	})
}

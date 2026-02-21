package e2e

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testLeaderboard(t *testing.T) {
	// Step 1: Find Bounty C at index [4].
	var bountyCID float64
	t.Run("Find Bounty C at index 4", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		require.True(t, len(body) >= 5, "expected at least 5 bounties, got %d", len(body))

		bountyC := asObj(body[4])
		bountyCID = jsonFloat(bountyC, "id")
		require.NotZero(t, bountyCID, "bountyCID should not be zero")
	})

	// Step 2: Verify Bounty C is open.
	t.Run("Bounty C is open", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/bounties/%d", int(bountyCID)))
		require.Equal(t, 200, status)

		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, "gamma", jsonString(body, "repoName"))
	})

	// Step 3: Submit solution for Bounty C (open PR #40).
	t.Run("Submit solution for Bounty C — open PR #40", func(t *testing.T) {
		payload := prWebhook("opened", 40,
			"Implement notification system",
			"Fixes #10\n\nFull implementation of notification system.\n\n<!-- bounty-wallet: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 -->",
			"open", false,
			"notify111222333444",
			"feat/notifications",
			"test", "gamma")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	// Step 4: Poll until solution appears.
	t.Run("Solution appears for Bounty C", func(t *testing.T) {
		var solutions []interface{}
		pollUntil(t, "solution for Bounty C to appear", 10, 1*time.Second, func() bool {
			status, _, body := httpGetArray(t, fmt.Sprintf("/api/bounties/%d/solutions", int(bountyCID)))
			if status != 200 || len(body) < 1 {
				return false
			}
			sol := asObj(body[0])
			if jsonFloat(sol, "prNumber") == 40 && jsonString(sol, "status") == "submitted" {
				solutions = body
				return true
			}
			return false
		})

		require.Len(t, solutions, 1)
		sol := asObj(solutions[0])
		assert.Equal(t, float64(40), jsonFloat(sol, "prNumber"))
		assert.Equal(t, "submitted", jsonString(sol, "status"))
	})

	// Step 5: Merge PR #40.
	t.Run("Merge PR #40", func(t *testing.T) {
		payload := prWebhook("closed", 40,
			"Implement notification system",
			"Fixes #10\n\nFull implementation of notification system.\n\n<!-- bounty-wallet: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 -->",
			"closed", true,
			"notify111222333444",
			"feat/notifications",
			"test", "gamma")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	// Step 6: Poll until Bounty C closes.
	t.Run("Bounty C closes after merge", func(t *testing.T) {
		var bounty map[string]interface{}
		pollUntil(t, "Bounty C to close", 10, 1*time.Second, func() bool {
			status, _, body := httpGet(t, fmt.Sprintf("/api/bounties/%d", int(bountyCID)))
			if status != 200 {
				return false
			}
			if jsonString(body, "status") == "closed" && jsonString(body, "amount") == "0" {
				bounty = body
				return true
			}
			return false
		})

		require.NotNil(t, bounty)
		assert.Equal(t, "closed", jsonString(bounty, "status"))
		assert.Equal(t, "0", jsonString(bounty, "amount"))
	})

	// Step 7: Verify leaderboard has >= 4 entries.
	t.Run("Leaderboard has at least 4 entries", func(t *testing.T) {
		var leaderboard []interface{}
		pollUntil(t, "leaderboard to have >= 4 entries", 5, 1*time.Second, func() bool {
			status, _, body := httpGetArray(t, "/api/leaderboard")
			if status != 200 {
				return false
			}
			leaderboard = body
			return len(body) >= 4
		})

		require.GreaterOrEqual(t, len(leaderboard), 4,
			"expected at least 4 leaderboard entries (seed contributor 0x7099..., contributor 0x3C44..., contributor 0x90F7..., maintainer oracle)")
	})

	// Step 8: Verify at least one contributor and one maintainer.
	t.Run("Leaderboard has contributors and maintainers", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/leaderboard")
		require.Equal(t, 200, status)

		contributors := countByField(body, "actorType", "contributor")
		maintainers := countByField(body, "actorType", "maintainer")
		assert.GreaterOrEqual(t, contributors, 1, "expected at least 1 contributor")
		assert.GreaterOrEqual(t, maintainers, 1, "expected at least 1 maintainer")
	})

	// Step 9: Verify active participants have non-zero stats.
	t.Run("Active participants have non-zero stats", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/leaderboard")
		require.Equal(t, 200, status)
		require.True(t, len(body) >= 1)

		first := asObj(body[0])
		assert.GreaterOrEqual(t, jsonFloat(first, "totalBounties"), float64(1))
		assert.NotEqual(t, "0", jsonString(first, "totalPayout"))
		assert.Greater(t, jsonFloat(first, "reputation"), float64(0))
	})

	// Step 10: Final state summary.
	t.Run("Final bounty state summary", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		require.True(t, len(body) >= 5, "expected at least 5 bounties")

		// [0] seed 1 — closed
		assert.Equal(t, "closed", jsonString(asObj(body[0]), "status"), "seed bounty 1 should be closed")
		// [1] seed 2 — open
		assert.Equal(t, "open", jsonString(asObj(body[1]), "status"), "seed bounty 2 should be open")
		// [2] bounty A — closed
		assert.Equal(t, "closed", jsonString(asObj(body[2]), "status"), "bounty A should be closed")
		// [3] bounty B — open
		assert.Equal(t, "open", jsonString(asObj(body[3]), "status"), "bounty B should be open")
		// [4] bounty C — closed
		assert.Equal(t, "closed", jsonString(asObj(body[4]), "status"), "bounty C should be closed")
	})

	// Step 11: Verify solution for Bounty C is accepted.
	t.Run("Solution for Bounty C is accepted", func(t *testing.T) {
		status, _, body := httpGetArray(t, fmt.Sprintf("/api/bounties/%d/solutions", int(bountyCID)))
		require.Equal(t, 200, status)
		require.True(t, len(body) >= 1)

		sol := asObj(body[0])
		assert.Equal(t, "accepted", jsonString(sol, "status"))
		assert.GreaterOrEqual(t, jsonFloat(sol, "score"), float64(0))
	})
}

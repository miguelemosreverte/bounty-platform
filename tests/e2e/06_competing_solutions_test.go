package e2e

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testCompetingSolutions(t *testing.T) {
	var bountyAID float64

	t.Run("Get bounty list and find Bounty A at index 2", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		require.GreaterOrEqual(t, len(body), 5, "expected at least 5 bounties")

		bountyAID = jsonFloat(asObj(body[2]), "id")
		require.NotZero(t, bountyAID)
	})

	t.Run("Verify Bounty A is open with 0 solutions", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d", int(bountyAID))
		status, _, body := httpGet(t, path)
		require.Equal(t, 200, status)

		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, float64(0), jsonFloat(body, "solutionCount"))
		assert.Equal(t, "alpha", jsonString(body, "repoName"))
	})

	t.Run("Contributor 1 submits PR #20", func(t *testing.T) {
		payload := prWebhook("opened", 20, "Implement login page (approach 1)",
			"Fixes #1\n\nUsing React-based login form.\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
			"open", false, "aaa111bbb222ccc333", "fix/login-v1", "test", "alpha")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	t.Run("Poll until solution 1 appears", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d/solutions", int(bountyAID))
		pollUntil(t, "waiting for first solution on Bounty A", 30, 1*time.Second, func() bool {
			status, _, body := httpGetArray(t, path)
			if status != 200 || len(body) != 1 {
				return false
			}
			sol := asObj(body[0])
			return jsonFloat(sol, "prNumber") == 20 &&
				jsonString(sol, "status") == "submitted" &&
				strings.EqualFold(jsonString(sol, "contributor"), "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")
		})
	})

	t.Run("Contributor 2 submits PR #21", func(t *testing.T) {
		payload := prWebhook("opened", 21, "Implement login page (approach 2)",
			"Fixes #1\n\nUsing Vue-based login form.\n\n<!-- bounty-wallet: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 -->",
			"open", false, "ddd444eee555fff666", "fix/login-v2", "test", "alpha")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	t.Run("Poll until 2 solutions appear", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d/solutions", int(bountyAID))
		pollUntil(t, "waiting for second solution on Bounty A", 30, 1*time.Second, func() bool {
			status, _, body := httpGetArray(t, path)
			if status != 200 || len(body) != 2 {
				return false
			}
			sol0 := asObj(body[0])
			sol1 := asObj(body[1])
			return jsonFloat(sol0, "prNumber") == 20 &&
				jsonFloat(sol1, "prNumber") == 21 &&
				jsonString(sol0, "status") == "submitted" &&
				jsonString(sol1, "status") == "submitted"
		})
	})

	t.Run("Verify solutionCount is 2 and bounty still open", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d", int(bountyAID))
		status, _, body := httpGet(t, path)
		require.Equal(t, 200, status)

		assert.Equal(t, float64(2), jsonFloat(body, "solutionCount"))
		assert.Equal(t, "open", jsonString(body, "status"))
	})

	t.Run("Merge PR #20 — Contributor 1 wins", func(t *testing.T) {
		payload := prWebhook("closed", 20, "Implement login page (approach 1)",
			"Fixes #1\n\nUsing React-based login form.\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
			"closed", true, "aaa111bbb222ccc333", "fix/login-v1", "test", "alpha")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	t.Run("Poll until bounty closes", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d", int(bountyAID))
		pollUntil(t, "waiting for Bounty A to close", 30, 1*time.Second, func() bool {
			status, _, body := httpGet(t, path)
			return status == 200 &&
				jsonString(body, "status") == "closed" &&
				jsonString(body, "amount") == "0" &&
				jsonFloat(body, "closedAt") > 0
		})
	})

	t.Run("Verify solution statuses after merge", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d/solutions", int(bountyAID))
		status, _, body := httpGetArray(t, path)
		require.Equal(t, 200, status)
		require.Len(t, body, 2)

		sol0 := asObj(body[0])
		assert.Equal(t, "accepted", jsonString(sol0, "status"))
		assert.Equal(t, float64(20), jsonFloat(sol0, "prNumber"))
		assert.GreaterOrEqual(t, jsonFloat(sol0, "score"), float64(0))

		sol1 := asObj(body[1])
		assert.Equal(t, "submitted", jsonString(sol1, "status"))
		assert.Equal(t, float64(21), jsonFloat(sol1, "prNumber"))
	})

	t.Run("Leaderboard has at least 1 entry", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/leaderboard")
		require.Equal(t, 200, status)
		assert.GreaterOrEqual(t, len(body), 1)
	})
}

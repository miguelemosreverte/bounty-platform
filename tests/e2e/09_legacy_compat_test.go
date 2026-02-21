package e2e

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testLegacyCompat(t *testing.T) {
	t.Run("GET /api/bounties returns seeded bounties", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		assert.GreaterOrEqual(t, len(body), 2)
	})

	t.Run("GET /api/bounties/1 returns closed bounty", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/1")
		require.Equal(t, 200, status)

		assert.Equal(t, "closed", jsonString(body, "status"))
		assert.GreaterOrEqual(t, jsonFloat(body, "solutionCount"), float64(1))
		assert.Equal(t, float64(1), jsonFloat(body, "id"))
	})

	t.Run("GET /api/bounties/1/solutions returns solutions", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties/1/solutions")
		require.Equal(t, 200, status)
		assert.GreaterOrEqual(t, len(body), 1)
	})

	t.Run("GET /api/leaderboard returns entries", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/leaderboard")
		require.Equal(t, 200, status)
		assert.GreaterOrEqual(t, len(body), 2)
	})

	t.Run("GET /api/addresses has contract addresses", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/addresses")
		require.Equal(t, 200, status)

		assert.NotEmpty(t, jsonString(body, "oracle"))
		assert.NotEmpty(t, jsonString(body, "bountyPlatform"))
		assert.NotEmpty(t, jsonString(body, "leaderboard"))
	})

	t.Run("Webhook creates bounty", func(t *testing.T) {
		status, _, _ := httpPost(t, "/api/webhook/github",
			issueWebhook("labeled", "bounty", 999,
				"Legacy bounty test",
				"## Description\nTest legacy webhook.",
				"test", "legacy"),
			webhookHeaders("issues"))
		require.Equal(t, 200, status)
	})

	var bounties []interface{}

	t.Run("Poll until legacy bounty appears", func(t *testing.T) {
		pollUntil(t, "legacy bounty appears", 20, 1*time.Second, func() bool {
			status, _, body := httpGetArray(t, "/api/bounties")
			if status != 200 {
				return false
			}
			bounties = body
			return len(body) > 2
		})
	})

	t.Run("Verify new legacy bounty", func(t *testing.T) {
		require.Greater(t, len(bounties), 2, "bounties should have been populated by poll")

		var found map[string]interface{}
		for _, item := range bounties {
			b := asObj(item)
			if jsonString(b, "repoName") == "legacy" {
				found = b
				break
			}
		}
		require.NotNil(t, found, "should find bounty with repoName 'legacy'")

		assert.Equal(t, "test", jsonString(found, "repoOwner"))
		assert.Equal(t, "legacy", jsonString(found, "repoName"))
		assert.Equal(t, "open", jsonString(found, "status"))
	})
}

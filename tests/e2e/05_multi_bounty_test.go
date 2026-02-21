package e2e

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testMultiBounty(t *testing.T) {
	addrRegex := `^0x[0-9a-fA-F]{40}$`

	var bountyAID, bountyBID, bountyCID float64

	t.Run("Verify seeded state has 2 bounties", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		require.Len(t, body, 2)
	})

	t.Run("Create Bounty A — issue labeled in test/alpha", func(t *testing.T) {
		payload := issueWebhook("labeled", "bounty", 1, "Add login page",
			"## Description\nWe need a login page.",
			"test", "alpha")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("issues"))
		assert.Equal(t, 200, status)
	})

	t.Run("Create Bounty B — issue labeled in test/beta", func(t *testing.T) {
		payload := issueWebhook("labeled", "bounty", 5, "Implement search functionality",
			"## Description\nWe need full text search across all resources.\n\n### Requirements\n- Search by title and description\n- Support filtering by date range\n- Show results ranked by relevance\n- Highlight matching terms in results\n- Support pagination of search results\n\n### Acceptance Criteria\n- Search returns results within 200ms\n- Works with 10000+ documents",
			"test", "beta")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("issues"))
		assert.Equal(t, 200, status)
	})

	t.Run("Create Bounty C — issue labeled in test/gamma", func(t *testing.T) {
		payload := issueWebhook("labeled", "bounty", 10, "Build real-time notification system",
			"## Description\nImplement a comprehensive real-time notification system that supports multiple delivery channels.\n\n### Requirements\n- WebSocket-based real-time push notifications\n- Email notification delivery for offline users\n- In-app notification center with read/unread status\n- Notification preferences per user per channel\n- Rate limiting to prevent notification spam\n- Support for notification templates\n- Batch notification delivery for digest mode\n- Priority levels (critical, high, normal, low)\n\n### Technical Details\n- Use Redis pub/sub for inter-service notification distribution\n- Implement exponential backoff for failed email deliveries\n- Store notification history for 90 days\n- Support rich content (markdown, links, images) in notifications\n\n### Acceptance Criteria\n- Notifications delivered within 500ms of trigger event\n- System handles 10000 concurrent WebSocket connections\n- Email delivery rate above 99 percent\n- User can configure preferences per notification type\n- Admin dashboard shows delivery analytics",
			"test", "gamma")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("issues"))
		assert.Equal(t, 200, status)
	})

	t.Run("Poll until 5 bounties appear and capture IDs", func(t *testing.T) {
		var bounties []interface{}
		pollUntil(t, "waiting for 5 bounties (2 seed + 3 new)", 30, 1*time.Second, func() bool {
			status, _, body := httpGetArray(t, "/api/bounties")
			if status == 200 && len(body) == 5 {
				bounties = body
				return true
			}
			return false
		})

		require.Len(t, bounties, 5)
		bountyAID = jsonFloat(asObj(bounties[2]), "id")
		bountyBID = jsonFloat(asObj(bounties[3]), "id")
		bountyCID = jsonFloat(asObj(bounties[4]), "id")
		require.NotZero(t, bountyAID)
		require.NotZero(t, bountyBID)
		require.NotZero(t, bountyCID)
	})

	t.Run("Verify Bounty A details", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d", int(bountyAID))
		status, _, body := httpGet(t, path)
		require.Equal(t, 200, status)

		assert.Equal(t, "test", jsonString(body, "repoOwner"))
		assert.Equal(t, "alpha", jsonString(body, "repoName"))
		assert.Equal(t, float64(1), jsonFloat(body, "issueNumber"))
		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, float64(0), jsonFloat(body, "solutionCount"))
		assert.GreaterOrEqual(t, jsonFloat(body, "estimatedComplexity"), float64(1))
		assert.Regexp(t, addrRegex, jsonString(body, "maintainer"))
		assert.NotEmpty(t, jsonString(body, "prdHash"))
		assert.NotEmpty(t, jsonString(body, "qaHash"))
		assert.NotEqual(t, "0", jsonString(body, "amount"))
		assert.Greater(t, jsonFloat(body, "createdAt"), float64(0))
		assert.Equal(t, float64(0), jsonFloat(body, "closedAt"))
	})

	t.Run("Verify Bounty B details", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d", int(bountyBID))
		status, _, body := httpGet(t, path)
		require.Equal(t, 200, status)

		assert.Equal(t, "test", jsonString(body, "repoOwner"))
		assert.Equal(t, "beta", jsonString(body, "repoName"))
		assert.Equal(t, float64(5), jsonFloat(body, "issueNumber"))
		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, float64(0), jsonFloat(body, "solutionCount"))
		assert.GreaterOrEqual(t, jsonFloat(body, "estimatedComplexity"), float64(1))
		assert.Regexp(t, addrRegex, jsonString(body, "maintainer"))
		assert.NotEmpty(t, jsonString(body, "prdHash"))
		assert.NotEmpty(t, jsonString(body, "qaHash"))
		assert.NotEqual(t, "0", jsonString(body, "amount"))
		assert.Greater(t, jsonFloat(body, "createdAt"), float64(0))
		assert.Equal(t, float64(0), jsonFloat(body, "closedAt"))
	})

	t.Run("Verify Bounty C details", func(t *testing.T) {
		path := fmt.Sprintf("/api/bounties/%d", int(bountyCID))
		status, _, body := httpGet(t, path)
		require.Equal(t, 200, status)

		assert.Equal(t, "test", jsonString(body, "repoOwner"))
		assert.Equal(t, "gamma", jsonString(body, "repoName"))
		assert.Equal(t, float64(10), jsonFloat(body, "issueNumber"))
		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, float64(0), jsonFloat(body, "solutionCount"))
		assert.GreaterOrEqual(t, jsonFloat(body, "estimatedComplexity"), float64(1))
		assert.Regexp(t, addrRegex, jsonString(body, "maintainer"))
		assert.NotEmpty(t, jsonString(body, "prdHash"))
		assert.NotEmpty(t, jsonString(body, "qaHash"))
		assert.NotEqual(t, "0", jsonString(body, "amount"))
		assert.Greater(t, jsonFloat(body, "createdAt"), float64(0))
		assert.Equal(t, float64(0), jsonFloat(body, "closedAt"))
	})

	t.Run("All 3 new bounties have 0 solutions", func(t *testing.T) {
		for _, id := range []float64{bountyAID, bountyBID, bountyCID} {
			path := fmt.Sprintf("/api/bounties/%d/solutions", int(id))
			status, _, body := httpGetArray(t, path)
			require.Equal(t, 200, status)
			assert.Empty(t, body, "expected 0 solutions for bounty %d", int(id))
		}
	})
}

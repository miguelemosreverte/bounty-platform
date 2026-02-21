package e2e

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testTokenEconomy(t *testing.T) {
	t.Run("Creator balance decreased after task completion", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+agentCreatorID)
		require.Equal(t, 200, status)

		assert.Equal(t, float64(50), jsonFloat(body, "tokenBalance"), "creator should have 100 - 50 = 50 tokens")
		assert.Equal(t, float64(50), jsonFloat(body, "totalSpent"), "creator should have spent 50 tokens on reward")
		assert.Equal(t, float64(100), jsonFloat(body, "totalEarned"), "creator totalEarned should be 100 (starter grant only)")
	})

	t.Run("Worker balance increased after task completion", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+agentWorkerID)
		require.Equal(t, 200, status)

		assert.Equal(t, float64(150), jsonFloat(body, "tokenBalance"), "worker should have 100 + 50 = 150 tokens")
		assert.Equal(t, float64(150), jsonFloat(body, "totalEarned"), "worker totalEarned should be 100 starter + 50 reward")
		assert.Equal(t, float64(0), jsonFloat(body, "totalSpent"), "worker should have spent nothing")
	})

	t.Run("Observer balance unchanged", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+agentObserverID)
		require.Equal(t, 200, status)

		assert.Equal(t, float64(100), jsonFloat(body, "tokenBalance"), "observer should still have 100 tokens")
		assert.Equal(t, float64(100), jsonFloat(body, "totalEarned"), "observer totalEarned should be 100 (starter grant)")
		assert.Equal(t, float64(0), jsonFloat(body, "totalSpent"), "observer should have spent nothing")
	})

	t.Run("Agent list ordered by reputation", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/agents")
		require.Equal(t, 200, status)
		require.GreaterOrEqual(t, len(body), 3, "should have at least 3 agents")

		first := asObj(body[0])
		assert.Equal(t, agentWorkerID, jsonString(first, "id"), "first agent should be agent-worker (highest reputation)")
		assert.Equal(t, float64(10), jsonFloat(first, "reputation"), "agent-worker should have reputation 10")
	})
}

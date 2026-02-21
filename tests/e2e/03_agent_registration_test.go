package e2e

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	agentCreatorID  = "agent-creator"
	agentWorkerID   = "agent-worker"
	agentObserverID = "agent-observer"
)

func testAgentRegistration(t *testing.T) {
	t.Run("Register agent-creator", func(t *testing.T) {
		status, _, body := httpPostJSON(t, "/api/agents/register",
			agentPayload(agentCreatorID, "Creator Agent", "direct", "claude-4", "developer"))
		require.Equal(t, 201, status)

		assert.Equal(t, agentCreatorID, jsonString(body, "id"))
		assert.Equal(t, "Creator Agent", jsonString(body, "name"))
		assert.Equal(t, "active", jsonString(body, "status"))
		assert.Equal(t, "trade", jsonString(body, "tier"))
		assert.Equal(t, float64(100), jsonFloat(body, "tokenBalance"))
	})

	t.Run("Register agent-worker", func(t *testing.T) {
		status, _, body := httpPostJSON(t, "/api/agents/register",
			agentPayload(agentWorkerID, "Worker Agent", "mcp", "claude-4", "developer"))
		require.Equal(t, 201, status)

		assert.Equal(t, float64(100), jsonFloat(body, "tokenBalance"))
	})

	t.Run("Register agent-observer", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/agents/register",
			agentPayload(agentObserverID, "Observer Agent", "direct", "", "reviewer"))
		require.Equal(t, 201, status)
	})

	t.Run("Get agent by ID", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+agentCreatorID)
		require.Equal(t, 200, status)

		assert.Equal(t, agentCreatorID, jsonString(body, "id"))
		assert.Equal(t, "Creator Agent", jsonString(body, "name"))
		assert.Equal(t, "active", jsonString(body, "status"))
		assert.Equal(t, "trade", jsonString(body, "tier"))
		assert.Equal(t, float64(100), jsonFloat(body, "tokenBalance"))
	})

	t.Run("Duplicate registration returns 409", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/agents/register",
			agentPayload(agentCreatorID, "Creator Agent", "direct", "claude-4", "developer"))
		assert.Equal(t, 409, status)
	})

	t.Run("Missing id returns 400", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/agents/register", `{"name":"x"}`)
		assert.Equal(t, 400, status)
	})

	t.Run("Missing name returns 400", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/agents/register", `{"id":"x"}`)
		assert.Equal(t, 400, status)
	})

	t.Run("List all agents", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/agents")
		require.Equal(t, 200, status)
		assert.GreaterOrEqual(t, len(body), 3)
	})
}

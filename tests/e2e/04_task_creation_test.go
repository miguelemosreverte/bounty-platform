package e2e

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var (
	taskAID float64
	taskBID float64
	taskCID float64
)

func testTaskCreation(t *testing.T) {
	t.Run("Create task A — auth feature", func(t *testing.T) {
		status, _, body := httpPostJSON(t, "/api/tasks",
			taskPayload(agentCreatorID, "Implement authentication",
				"Add JWT-based auth to the API with login and token refresh endpoints.",
				"", "token", "50", "go", nil))
		require.Equal(t, 201, status)

		taskAID = jsonFloat(body, "id")
		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, agentCreatorID, jsonString(body, "creator"))
		assert.Equal(t, "token", jsonString(body, "rewardType"))
		assert.Equal(t, "50", jsonString(body, "rewardAmount"))
		assert.NotEmpty(t, jsonString(body, "prdHash"))
		assert.NotEmpty(t, jsonString(body, "qaHash"))
		assert.Greater(t, jsonFloat(body, "estimatedComplexity"), float64(0))
	})

	t.Run("Create task B — search feature", func(t *testing.T) {
		status, _, body := httpPostJSON(t, "/api/tasks",
			taskPayload(agentCreatorID, "Add search functionality",
				"Implement full-text search across all resources with filtering and pagination.",
				"", "token", "30", "go", []string{"backend", "search"}))
		require.Equal(t, 201, status)

		taskBID = jsonFloat(body, "id")
	})

	t.Run("Create task C — UI components", func(t *testing.T) {
		status, _, body := httpPostJSON(t, "/api/tasks",
			taskPayload(agentCreatorID, "Build notification UI",
				"Create React notification components with real-time updates.",
				"", "token", "40", "typescript", []string{"frontend"}))
		require.Equal(t, 201, status)

		taskCID = jsonFloat(body, "id")
	})

	t.Run("List all tasks", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/tasks")
		require.Equal(t, 200, status)
		assert.Len(t, body, 3)
	})

	t.Run("Filter tasks by status=open", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/tasks?status=open")
		require.Equal(t, 200, status)
		assert.Len(t, body, 3)
	})

	t.Run("Filter tasks by language=go", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/tasks?language=go")
		require.Equal(t, 200, status)
		assert.Len(t, body, 2)
	})

	t.Run("Filter tasks by language=typescript", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/tasks?language=typescript")
		require.Equal(t, 200, status)
		assert.Len(t, body, 1)
	})

	t.Run("Get task A details", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/tasks/%.0f", taskAID))
		require.Equal(t, 200, status)

		assert.Equal(t, "Implement authentication", jsonString(body, "title"))
		assert.Equal(t, agentCreatorID, jsonString(body, "creator"))
		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, "50", jsonString(body, "rewardAmount"))
	})

	t.Run("Get non-existent task returns 404", func(t *testing.T) {
		status, _, _ := httpGet(t, "/api/tasks/99999")
		assert.Equal(t, 404, status)
	})
}

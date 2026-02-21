package e2e

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testMultiAgent(t *testing.T) {
	var submissionBID float64
	var submissionCID float64

	t.Run("Agent-worker claims task B", func(t *testing.T) {
		status, _, body := httpPostJSON(t,
			fmt.Sprintf("/api/tasks/%.0f/claim", taskBID),
			claimPayload(agentWorkerID))
		require.Equal(t, 200, status)

		assert.Equal(t, "claimed", jsonString(body, "status"))
	})

	t.Run("Agent-worker submits for task B", func(t *testing.T) {
		status, _, body := httpPostJSON(t,
			fmt.Sprintf("/api/tasks/%.0f/submissions", taskBID),
			submissionPayload(agentWorkerID,
				samplePatch("search.go", `fmt.Println("search implemented")`),
				"Full-text search implementation"))
		require.Equal(t, 201, status)

		submissionBID = jsonFloat(body, "id")
	})

	t.Run("Task B accepted after review", func(t *testing.T) {
		var finalBody map[string]interface{}

		pollUntil(t, "task B submission reviewed", 10, 500*time.Millisecond, func() bool {
			status, _, body := httpGet(t, fmt.Sprintf("/api/submissions/%.0f", submissionBID))
			if status != 200 {
				return false
			}
			finalBody = body
			return jsonString(body, "status") != "submitted"
		})

		require.NotNil(t, finalBody)
		assert.Equal(t, "accepted", jsonString(finalBody, "status"))
		assert.Equal(t, float64(80), jsonFloat(finalBody, "reviewScore"))
	})

	t.Run("Agent-observer claims task C", func(t *testing.T) {
		status, _, body := httpPostJSON(t,
			fmt.Sprintf("/api/tasks/%.0f/claim", taskCID),
			claimPayload(agentObserverID))
		require.Equal(t, 200, status)

		assert.Equal(t, "claimed", jsonString(body, "status"))
	})

	t.Run("Agent-observer submits for task C", func(t *testing.T) {
		status, _, body := httpPostJSON(t,
			fmt.Sprintf("/api/tasks/%.0f/submissions", taskCID),
			submissionPayload(agentObserverID,
				samplePatch("notify.tsx", `console.log("notifications")`),
				"React notification components"))
		require.Equal(t, 201, status)

		submissionCID = jsonFloat(body, "id")
	})

	t.Run("Task C accepted after review", func(t *testing.T) {
		var finalBody map[string]interface{}

		pollUntil(t, "task C submission reviewed", 10, 500*time.Millisecond, func() bool {
			status, _, body := httpGet(t, fmt.Sprintf("/api/submissions/%.0f", submissionCID))
			if status != 200 {
				return false
			}
			finalBody = body
			return jsonString(body, "status") != "submitted"
		})

		require.NotNil(t, finalBody)
		assert.Equal(t, "accepted", jsonString(finalBody, "status"))
	})

	t.Run("Agent-worker has 2 completions", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+agentWorkerID)
		require.Equal(t, 200, status)

		assert.Equal(t, float64(2), jsonFloat(body, "tasksCompleted"))
		assert.Equal(t, float64(20), jsonFloat(body, "reputation"))
		assert.Equal(t, float64(1.0), jsonFloat(body, "successRate"))
		assert.Equal(t, float64(180), jsonFloat(body, "tokenBalance"), "worker should have 150 + 30 = 180 tokens")
	})

	t.Run("Agent-observer has 1 completion", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+agentObserverID)
		require.Equal(t, 200, status)

		assert.Equal(t, float64(1), jsonFloat(body, "tasksCompleted"))
		assert.Equal(t, float64(10), jsonFloat(body, "reputation"))
		assert.Equal(t, float64(140), jsonFloat(body, "tokenBalance"), "observer should have 100 + 40 = 140 tokens")
	})

	t.Run("All 3 tasks are closed", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/tasks")
		require.Equal(t, 200, status)

		closed := countByField(body, "status", "closed")
		assert.Equal(t, 3, closed, "all 3 tasks should be closed")
	})

	t.Run("Agent list sorted by reputation", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/agents")
		require.Equal(t, 200, status)
		require.GreaterOrEqual(t, len(body), 3)

		first := asObj(body[0])
		assert.Equal(t, float64(20), jsonFloat(first, "reputation"), "first agent should have highest reputation")
	})
}

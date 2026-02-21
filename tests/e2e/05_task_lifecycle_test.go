package e2e

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var submissionAID float64

func testTaskLifecycle(t *testing.T) {
	t.Run("Claim task A", func(t *testing.T) {
		status, _, body := httpPostJSON(t,
			fmt.Sprintf("/api/tasks/%.0f/claim", taskAID),
			claimPayload(agentWorkerID))
		require.Equal(t, 200, status)

		assert.Equal(t, "claimed", jsonString(body, "status"))
		assert.Equal(t, agentWorkerID, jsonString(body, "claimedBy"))
	})

	t.Run("Verify task A is claimed", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/tasks/%.0f", taskAID))
		require.Equal(t, 200, status)

		assert.Equal(t, "claimed", jsonString(body, "status"))
	})

	t.Run("Submit solution for task A", func(t *testing.T) {
		status, _, body := httpPostJSON(t,
			fmt.Sprintf("/api/tasks/%.0f/submissions", taskAID),
			submissionPayload(agentWorkerID,
				samplePatch("auth.go", `fmt.Println("JWT auth implemented")`),
				"Implemented JWT authentication with login and refresh endpoints"))
		require.Equal(t, 201, status)

		submissionAID = jsonFloat(body, "id")
		// Stub reviewer is instant — status may already be "reviewing" or even "accepted"
		subStatus := jsonString(body, "status")
		assert.Contains(t, []string{"submitted", "reviewing", "accepted"}, subStatus,
			"expected initial submission status to be submitted, reviewing, or accepted; got %s", subStatus)
		assert.Equal(t, float64(1), jsonFloat(body, "attempt"))
	})

	t.Run("Poll until submission reviewed", func(t *testing.T) {
		var finalBody map[string]interface{}

		pollUntil(t, "submission reviewed", 10, 500*time.Millisecond, func() bool {
			status, _, body := httpGet(t, fmt.Sprintf("/api/submissions/%.0f", submissionAID))
			if status != 200 {
				return false
			}
			finalBody = body
			s := jsonString(body, "status")
			return s != "submitted" && s != "reviewing"
		})

		require.NotNil(t, finalBody)
		assert.Equal(t, "accepted", jsonString(finalBody, "status"))
		assert.Equal(t, float64(80), jsonFloat(finalBody, "reviewScore"))
		assert.NotEmpty(t, jsonString(finalBody, "reviewNotes"))
	})

	t.Run("Task A is closed", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/tasks/%.0f", taskAID))
		require.Equal(t, 200, status)

		assert.Equal(t, "closed", jsonString(body, "status"))
		assert.Greater(t, jsonFloat(body, "closedAt"), float64(0))
		assert.Equal(t, float64(1), jsonFloat(body, "submissionCount"))
	})

	t.Run("List submissions for task A", func(t *testing.T) {
		status, _, body := httpGetArray(t, fmt.Sprintf("/api/tasks/%.0f/submissions", taskAID))
		require.Equal(t, 200, status)
		assert.Len(t, body, 1)
	})

	t.Run("Agent-worker stats updated", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+agentWorkerID)
		require.Equal(t, 200, status)

		assert.Equal(t, float64(1), jsonFloat(body, "tasksCompleted"))
		assert.Equal(t, float64(10), jsonFloat(body, "reputation"))
		assert.Equal(t, float64(1.0), jsonFloat(body, "successRate"))
	})
}

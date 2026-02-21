package e2e

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func testTaskErrors(t *testing.T) {
	t.Run("Create task without title returns 400", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/tasks", `{"creator":"agent-creator","description":"test"}`)
		assert.Equal(t, 400, status)
	})

	t.Run("Create task without creator returns 400", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/tasks", `{"title":"test"}`)
		assert.Equal(t, 400, status)
	})

	t.Run("Claim non-existent task returns 404", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/tasks/99999/claim", claimPayload("agent-worker"))
		assert.Equal(t, 404, status)
	})

	t.Run("Claim closed task returns 409", func(t *testing.T) {
		path := fmt.Sprintf("/api/tasks/%d/claim", int(taskAID))
		status, _, _ := httpPostJSON(t, path, claimPayload("agent-worker"))
		assert.Equal(t, 409, status)
	})

	t.Run("Claim with non-existent agent returns 400", func(t *testing.T) {
		path := fmt.Sprintf("/api/tasks/%d/claim", int(taskBID))
		status, _, _ := httpPostJSON(t, path, claimPayload("nonexistent-agent"))
		assert.Equal(t, 400, status)
	})

	t.Run("Submit to non-existent task returns 404", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/tasks/99999/submissions",
			submissionPayload("agent-worker", "diff", "desc"))
		assert.Equal(t, 404, status)
	})

	t.Run("Submit without patch returns 400", func(t *testing.T) {
		path := fmt.Sprintf("/api/tasks/%d/submissions", int(taskBID))
		status, _, _ := httpPostJSON(t, path, submissionPayload("agent-worker", "", "test"))
		assert.Equal(t, 400, status)
	})

	t.Run("Register agent without id returns 400", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/agents/register", `{"name":"test"}`)
		assert.Equal(t, 400, status)
	})

	t.Run("Register agent without name returns 400", func(t *testing.T) {
		status, _, _ := httpPostJSON(t, "/api/agents/register", `{"id":"test"}`)
		assert.Equal(t, 400, status)
	})

	t.Run("Get non-existent agent returns 404", func(t *testing.T) {
		status, _, _ := httpGet(t, "/api/agents/nonexistent-agent-xyz")
		assert.Equal(t, 404, status)
	})

	t.Run("Get task with invalid id returns 400", func(t *testing.T) {
		status, _, _ := httpGet(t, "/api/tasks/abc")
		assert.Equal(t, 400, status)
	})

	t.Run("Get non-existent submission returns 404", func(t *testing.T) {
		status, _, _ := httpGet(t, "/api/submissions/99999")
		assert.Equal(t, 404, status)
	})
}

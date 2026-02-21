package e2e

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mcpAgentID is the agent registered through the MCP protocol.
const mcpAgentID = "mcp-agent-alpha"

var mcpTaskID float64

func testMCP(t *testing.T) {
	dbPath := os.Getenv("E2E_DATABASE_PATH")
	if dbPath == "" {
		t.Skip("E2E_DATABASE_PATH not set — cannot start MCP server")
	}

	c := startMCP(t, dbPath)

	// ── Protocol handshake ──

	t.Run("Initialize", func(t *testing.T) {
		resp := c.call(t, "initialize", map[string]any{
			"protocolVersion": "2024-11-05",
			"capabilities":    map[string]any{},
			"clientInfo":      map[string]any{"name": "e2e-test", "version": "1.0"},
		})
		require.Nil(t, resp.Error)

		var result map[string]interface{}
		require.NoError(t, json.Unmarshal(resp.Result, &result))
		assert.Equal(t, "2024-11-05", jsonString(result, "protocolVersion"))

		serverInfo := asObj(result["serverInfo"])
		assert.Equal(t, "gitbusters-hive", jsonString(serverInfo, "name"))
	})

	t.Run("List tools returns 8 tools", func(t *testing.T) {
		resp := c.call(t, "tools/list", nil)
		require.Nil(t, resp.Error)

		var result map[string]interface{}
		require.NoError(t, json.Unmarshal(resp.Result, &result))

		tools, ok := result["tools"].([]interface{})
		require.True(t, ok)
		assert.Len(t, tools, 8)

		// Verify expected tool names
		names := make(map[string]bool)
		for _, tool := range tools {
			m := asObj(tool)
			names[jsonString(m, "name")] = true
		}
		for _, expected := range []string{
			"list_tasks", "get_task", "claim_task", "submit_solution",
			"get_feedback", "my_status", "create_task", "register_agent",
		} {
			assert.True(t, names[expected], "missing tool: %s", expected)
		}
	})

	// ── Agent registration via MCP ──

	t.Run("Register agent via MCP", func(t *testing.T) {
		result := c.toolCallJSON(t, "register_agent", map[string]any{
			"id":          mcpAgentID,
			"name":        "MCP Alpha Agent",
			"model":       "claude-4",
			"career_path": "developer",
		})

		assert.Contains(t, jsonString(result, "message"), "Welcome")
		agent := asObj(result["agent"])
		assert.Equal(t, mcpAgentID, jsonString(agent, "id"))
		assert.Equal(t, "MCP Alpha Agent", jsonString(agent, "name"))
		assert.Equal(t, "mcp", jsonString(agent, "source"))
		assert.Equal(t, float64(100), jsonFloat(agent, "tokenBalance"))
	})

	t.Run("MCP agent visible via HTTP", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/agents/"+mcpAgentID)
		require.Equal(t, 200, status)
		assert.Equal(t, mcpAgentID, jsonString(body, "id"))
		assert.Equal(t, "mcp", jsonString(body, "source"))
	})

	t.Run("Duplicate registration returns existing agent", func(t *testing.T) {
		result := c.toolCallJSON(t, "register_agent", map[string]any{
			"id":   mcpAgentID,
			"name": "MCP Alpha Agent",
		})
		// MCP duplicate returns the agent (not an error, unlike HTTP 409)
		assert.Contains(t, jsonString(result, "message"), "already registered")
	})

	// ── Task creation via MCP ──

	t.Run("Create task via MCP", func(t *testing.T) {
		result := c.toolCallJSON(t, "create_task", map[string]any{
			"title":         "MCP-created task: implement caching",
			"description":   "Add Redis caching layer for API responses",
			"creator":       mcpAgentID,
			"language":      "go",
			"reward_type":   "token",
			"reward_amount": "25",
			"tags":          []string{"backend", "performance"},
		})

		mcpTaskID = jsonFloat(result, "id")
		assert.Greater(t, mcpTaskID, float64(0))
		assert.Equal(t, "open", jsonString(result, "status"))
		assert.Equal(t, mcpAgentID, jsonString(result, "creator"))
		assert.NotEmpty(t, jsonString(result, "prdHash"))
	})

	t.Run("MCP task visible via HTTP", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/tasks/%.0f", mcpTaskID))
		require.Equal(t, 200, status)
		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, mcpAgentID, jsonString(body, "creator"))
	})

	// ── Browse tasks via MCP ──

	t.Run("List tasks via MCP", func(t *testing.T) {
		// There should be at least 1 open task (the one we just created)
		// Other tasks from suites 03-08 may be closed already
		result := c.toolCallJSONArray(t, "list_tasks", map[string]any{
			"status": "open",
		})
		assert.GreaterOrEqual(t, len(result), 1)

		// Our MCP-created task should be in the list
		found := false
		for _, item := range result {
			m := asObj(item)
			if jsonFloat(m, "id") == mcpTaskID {
				found = true
				break
			}
		}
		assert.True(t, found, "MCP-created task not found in list_tasks")
	})

	t.Run("Get task via MCP", func(t *testing.T) {
		result := c.toolCallJSON(t, "get_task", map[string]any{
			"task_id": mcpTaskID,
		})

		task := asObj(result["task"])
		assert.Equal(t, mcpTaskID, jsonFloat(task, "id"))
		assert.Equal(t, "open", jsonString(task, "status"))
	})

	// ── Claim + submit via MCP ──

	t.Run("Claim task via MCP", func(t *testing.T) {
		result := c.toolCallJSON(t, "claim_task", map[string]any{
			"task_id":  mcpTaskID,
			"agent_id": mcpAgentID,
		})

		assert.Contains(t, jsonString(result, "message"), "claimed")
		task := asObj(result["task"])
		assert.Equal(t, "claimed", jsonString(task, "status"))
		assert.Equal(t, mcpAgentID, jsonString(task, "claimedBy"))
	})

	var mcpSubmissionID float64

	t.Run("Submit solution via MCP", func(t *testing.T) {
		// MCP submit_solution runs review synchronously (unlike HTTP which is async)
		result := c.toolCallJSON(t, "submit_solution", map[string]any{
			"task_id":     mcpTaskID,
			"agent_id":    mcpAgentID,
			"patch":       samplePatch("cache.go", `fmt.Println("Redis caching implemented")`),
			"description": "Added Redis caching with TTL support",
		})

		mcpSubmissionID = jsonFloat(result, "id")
		assert.Greater(t, mcpSubmissionID, float64(0))
		// MCP review is synchronous — should already be accepted
		assert.Equal(t, "accepted", jsonString(result, "status"))
		assert.Equal(t, float64(80), jsonFloat(result, "reviewScore"))
	})

	t.Run("Get feedback via MCP", func(t *testing.T) {
		result := c.toolCallJSON(t, "get_feedback", map[string]any{
			"submission_id": mcpSubmissionID,
		})

		assert.Equal(t, "accepted", jsonString(result, "status"))
		assert.Equal(t, float64(80), jsonFloat(result, "reviewScore"))
		assert.NotEmpty(t, jsonString(result, "reviewNotes"))
	})

	// ── Agent status via MCP ──

	t.Run("My status via MCP", func(t *testing.T) {
		result := c.toolCallJSON(t, "my_status", map[string]any{
			"agent_id": mcpAgentID,
		})

		agent := asObj(result["agent"])
		assert.Equal(t, mcpAgentID, jsonString(agent, "id"))
		assert.Equal(t, float64(1), jsonFloat(agent, "tasksCompleted"))
		assert.Equal(t, float64(10), jsonFloat(agent, "reputation"))
		// Balance: 100 starter - 25 (task creation) + 25 (task completion) = 100
		assert.Equal(t, float64(100), jsonFloat(agent, "tokenBalance"))

		// Should include recent transfers
		transfers, ok := result["recent_transfers"].([]interface{})
		assert.True(t, ok, "expected recent_transfers array")
		assert.GreaterOrEqual(t, len(transfers), 1)
	})

	// ── Cross-protocol verification ──

	t.Run("Task closed visible via HTTP", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/tasks/%.0f", mcpTaskID))
		require.Equal(t, 200, status)
		assert.Equal(t, "closed", jsonString(body, "status"))
		assert.Greater(t, jsonFloat(body, "closedAt"), float64(0))
	})

	t.Run("Submission visible via HTTP", func(t *testing.T) {
		status, _, body := httpGet(t, fmt.Sprintf("/api/submissions/%.0f", mcpSubmissionID))
		require.Equal(t, 200, status)
		assert.Equal(t, "accepted", jsonString(body, "status"))
		assert.Equal(t, float64(80), jsonFloat(body, "reviewScore"))
	})

	// ── MCP error cases ──

	t.Run("Unknown tool returns error", func(t *testing.T) {
		text, isErr := c.toolCall(t, "nonexistent_tool", nil)
		assert.True(t, isErr)
		assert.Contains(t, text, "unknown tool")
	})

	t.Run("Claim already-closed task returns error", func(t *testing.T) {
		text, isErr := c.toolCall(t, "claim_task", map[string]any{
			"task_id":  mcpTaskID,
			"agent_id": mcpAgentID,
		})
		assert.True(t, isErr)
		assert.Contains(t, text, "not open")
	})

	t.Run("Get non-existent task returns error", func(t *testing.T) {
		text, isErr := c.toolCall(t, "get_task", map[string]any{
			"task_id": 99999,
		})
		assert.True(t, isErr)
		assert.Contains(t, text, "not found")
	})

	t.Run("Register agent missing fields returns error", func(t *testing.T) {
		text, isErr := c.toolCall(t, "register_agent", map[string]any{
			"id": "",
		})
		assert.True(t, isErr)
		assert.Contains(t, text, "required")
	})

	t.Run("Unknown JSON-RPC method returns error", func(t *testing.T) {
		resp := c.call(t, "nonexistent/method", nil)
		require.NotNil(t, resp.Error)
		assert.Equal(t, -32601, resp.Error.Code)
	})
}

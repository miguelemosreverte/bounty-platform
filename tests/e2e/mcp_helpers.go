package e2e

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// mcpClient wraps a running MCP server subprocess and provides JSON-RPC helpers.
type mcpClient struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	reader *bufio.Reader
	nextID atomic.Int64
	mu     sync.Mutex // serialise request/response pairs
}

// startMCP builds and starts the MCP server binary, returning a connected client.
func startMCP(t *testing.T, dbPath string) *mcpClient {
	t.Helper()

	// Build the MCP binary
	binPath := t.TempDir() + "/mcp-server"
	build := exec.Command("go", "build", "-o", binPath, "./cmd/mcp")
	build.Dir = projectRoot() + "/backend"
	out, err := build.CombinedOutput()
	require.NoError(t, err, "go build mcp: %s", string(out))

	// Start the MCP server
	cmd := exec.Command(binPath)
	cmd.Env = append(os.Environ(),
		"DATABASE_PATH="+dbPath,
		"ANVIL_RPC_URL=http://127.0.0.1:8546",
		"ORACLE_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	)

	stdin, err := cmd.StdinPipe()
	require.NoError(t, err)
	stdout, err := cmd.StdoutPipe()
	require.NoError(t, err)
	cmd.Stderr = nil // suppress log output

	require.NoError(t, cmd.Start())

	c := &mcpClient{
		cmd:    cmd,
		stdin:  stdin,
		reader: bufio.NewReader(stdout),
	}

	t.Cleanup(func() {
		stdin.Close()
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
	})

	return c
}

// jsonRPCRequest is a JSON-RPC 2.0 request.
type jsonRPCReq struct {
	JSONRPC string `json:"jsonrpc"`
	ID      int64  `json:"id"`
	Method  string `json:"method"`
	Params  any    `json:"params,omitempty"`
}

// jsonRPCResp is a JSON-RPC 2.0 response.
type jsonRPCResp struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int64           `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// call sends a JSON-RPC request and returns the parsed response.
func (c *mcpClient) call(t *testing.T, method string, params any) *jsonRPCResp {
	t.Helper()
	c.mu.Lock()
	defer c.mu.Unlock()

	id := c.nextID.Add(1)
	req := jsonRPCReq{JSONRPC: "2.0", ID: id, Method: method, Params: params}
	data, err := json.Marshal(req)
	require.NoError(t, err)
	data = append(data, '\n')

	start := time.Now()
	_, err = c.stdin.Write(data)
	require.NoError(t, err, "write to MCP stdin")

	line, err := c.reader.ReadBytes('\n')
	dur := time.Since(start)
	require.NoError(t, err, "read from MCP stdout")

	var resp jsonRPCResp
	require.NoError(t, json.Unmarshal(line, &resp), "parse MCP response: %s", string(line))

	// Record for report
	recordMCPRequest(t, method, params, &resp, dur)

	return &resp
}

// toolCall sends a tools/call request and returns the parsed tool result.
func (c *mcpClient) toolCall(t *testing.T, toolName string, args map[string]any) (content string, isError bool) {
	t.Helper()
	resp := c.call(t, "tools/call", map[string]any{
		"name":      toolName,
		"arguments": args,
	})
	require.Nil(t, resp.Error, "MCP tool %s returned RPC error: %v", toolName, resp.Error)

	var result struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		IsError bool `json:"isError"`
	}
	require.NoError(t, json.Unmarshal(resp.Result, &result))

	if len(result.Content) > 0 {
		content = result.Content[0].Text
	}
	return content, result.IsError
}

// toolCallJSON calls a tool and parses the text content as JSON into a map.
func (c *mcpClient) toolCallJSON(t *testing.T, toolName string, args map[string]any) map[string]interface{} {
	t.Helper()
	text, isErr := c.toolCall(t, toolName, args)
	require.False(t, isErr, "MCP tool %s returned error: %s", toolName, text)

	var result map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(text), &result), "parse tool result: %s", text)
	return result
}

// toolCallJSONArray calls a tool and parses the text content as a JSON array.
func (c *mcpClient) toolCallJSONArray(t *testing.T, toolName string, args map[string]any) []interface{} {
	t.Helper()
	text, isErr := c.toolCall(t, toolName, args)
	require.False(t, isErr, "MCP tool %s returned error: %s", toolName, text)

	var result []interface{}
	require.NoError(t, json.Unmarshal([]byte(text), &result), "parse tool array: %s", text)
	return result
}

// projectRoot returns the bounty-platform root directory.
func projectRoot() string {
	// tests/e2e is two levels below root
	dir, _ := os.Getwd()
	return filepath.Dir(filepath.Dir(dir))
}

// recordMCPRequest logs an MCP interaction for the HTML report.
func recordMCPRequest(t *testing.T, method string, params any, resp *jsonRPCResp, dur time.Duration) {
	requestLogsMu.Lock()
	defer requestLogsMu.Unlock()

	reqBody := ""
	if params != nil {
		b, _ := json.MarshalIndent(params, "", "  ")
		reqBody = string(b)
	}

	resBody := ""
	statusCode := 200
	if resp.Error != nil {
		statusCode = resp.Error.Code
		resBody = fmt.Sprintf(`{"error": {"code": %d, "message": %q}}`, resp.Error.Code, resp.Error.Message)
	} else if resp.Result != nil {
		resBody = prettyJSON(resp.Result)
	}

	if len(resBody) > 2000 {
		resBody = resBody[:2000] + "\n... (truncated)"
	}
	if len(reqBody) > 1000 {
		reqBody = reqBody[:1000] + "\n... (truncated)"
	}

	requestLogs = append(requestLogs, RequestLog{
		TestName:   t.Name(),
		Method:     "MCP",
		Path:       method,
		ReqBody:    reqBody,
		ReqHeaders: map[string]string{"Protocol": "JSON-RPC 2.0"},
		StatusCode: statusCode,
		ResBody:    resBody,
		Duration:   dur,
		Timestamp:  time.Now(),
	})
}

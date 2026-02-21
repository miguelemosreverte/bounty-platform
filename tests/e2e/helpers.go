package e2e

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// baseURL is set from the E2E_BASE_URL environment variable in TestMain.
var baseURL string

// suiteResults collects test results for the report.
var suiteResults []SuiteResult

// SuiteResult holds the outcome of one test suite.
type SuiteResult struct {
	Name     string
	Passed   bool
	Duration time.Duration
}

// ---------------------------------------------------------------------------
// HTTP request/response recording — captures every call for the report
// ---------------------------------------------------------------------------

// RequestLog records a single HTTP interaction.
type RequestLog struct {
	TestName   string            // full t.Name(), e.g. "TestE2E/05_MultiBounty/Verify..."
	Method     string            // GET, POST
	Path       string            // /api/bounties
	ReqBody    string            // request body (POST only)
	ReqHeaders map[string]string // custom headers
	StatusCode int
	ResBody    string // response body (pretty-printed, truncated)
	Duration   time.Duration
	Timestamp  time.Time
}

var (
	requestLogs   []RequestLog
	requestLogsMu sync.Mutex
)

func recordRequest(t *testing.T, method, path, reqBody string, reqHeaders map[string]string, statusCode int, resBody []byte, dur time.Duration) {
	requestLogsMu.Lock()
	defer requestLogsMu.Unlock()

	// Pretty-print JSON responses
	body := prettyJSON(resBody)
	// Truncate very long responses
	if len(body) > 2000 {
		body = body[:2000] + "\n... (truncated)"
	}

	// Pretty-print request body too
	req := prettyJSON([]byte(reqBody))
	if len(req) > 1000 {
		req = req[:1000] + "\n... (truncated)"
	}

	requestLogs = append(requestLogs, RequestLog{
		TestName:   t.Name(),
		Method:     method,
		Path:       path,
		ReqBody:    req,
		ReqHeaders: reqHeaders,
		StatusCode: statusCode,
		ResBody:    body,
		Duration:   dur,
		Timestamp:  time.Now(),
	})
}

func prettyJSON(data []byte) string {
	var buf bytes.Buffer
	if err := json.Indent(&buf, data, "", "  "); err != nil {
		return string(data) // not JSON, return as-is
	}
	return buf.String()
}

// ---------------------------------------------------------------------------
// HTTP helpers — each one records the interaction automatically
// ---------------------------------------------------------------------------

// httpGet performs a GET and returns status + parsed JSON object body.
func httpGet(t *testing.T, path string) (int, http.Header, map[string]interface{}) {
	t.Helper()
	start := time.Now()
	resp, err := http.Get(baseURL + path)
	dur := time.Since(start)
	require.NoError(t, err, "GET %s", path)
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	recordRequest(t, "GET", path, "", nil, resp.StatusCode, body, dur)
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)
	return resp.StatusCode, resp.Header, result
}

// httpGetArray performs a GET and returns status + parsed JSON array body.
func httpGetArray(t *testing.T, path string) (int, http.Header, []interface{}) {
	t.Helper()
	start := time.Now()
	resp, err := http.Get(baseURL + path)
	dur := time.Since(start)
	require.NoError(t, err, "GET %s", path)
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	recordRequest(t, "GET", path, "", nil, resp.StatusCode, body, dur)
	var result []interface{}
	_ = json.Unmarshal(body, &result)
	return resp.StatusCode, resp.Header, result
}

// httpGetRaw performs a GET and returns status + raw response body.
func httpGetRaw(t *testing.T, path string) (int, http.Header, []byte) {
	t.Helper()
	start := time.Now()
	resp, err := http.Get(baseURL + path)
	dur := time.Since(start)
	require.NoError(t, err, "GET %s", path)
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	recordRequest(t, "GET", path, "", nil, resp.StatusCode, body, dur)
	return resp.StatusCode, resp.Header, body
}

// httpPost sends a POST with the given body string and headers.
func httpPost(t *testing.T, path string, body string, headers map[string]string) (int, http.Header, []byte) {
	t.Helper()
	req, err := http.NewRequest("POST", baseURL+path, strings.NewReader(body))
	require.NoError(t, err)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	start := time.Now()
	resp, err := http.DefaultClient.Do(req)
	dur := time.Since(start)
	require.NoError(t, err)
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	recordRequest(t, "POST", path, body, headers, resp.StatusCode, respBody, dur)
	return resp.StatusCode, resp.Header, respBody
}

// pollUntil repeatedly calls fn until it returns true or retries are exhausted.
func pollUntil(t *testing.T, description string, maxRetries int, interval time.Duration, fn func() bool) {
	t.Helper()
	for i := 0; i < maxRetries; i++ {
		if fn() {
			return
		}
		time.Sleep(interval)
	}
	t.Fatalf("pollUntil timed out: %s (after %d retries)", description, maxRetries)
}

// jsonFloat extracts a float64 from a JSON map (JSON numbers are float64).
func jsonFloat(m map[string]interface{}, key string) float64 {
	v, ok := m[key]
	if !ok {
		return 0
	}
	f, _ := v.(float64)
	return f
}

// jsonString extracts a string from a JSON map.
func jsonString(m map[string]interface{}, key string) string {
	v, _ := m[key].(string)
	return v
}

// asObj casts an interface{} to map[string]interface{}.
func asObj(v interface{}) map[string]interface{} {
	m, _ := v.(map[string]interface{})
	return m
}

// countByField counts array elements where field == value.
func countByField(arr []interface{}, field, value string) int {
	count := 0
	for _, item := range arr {
		if m, ok := item.(map[string]interface{}); ok {
			if jsonString(m, field) == value {
				count++
			}
		}
	}
	return count
}

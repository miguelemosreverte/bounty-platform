package e2e

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// ReportData holds all data for the report templates.
type ReportData struct {
	Timestamp     string
	TotalSuites   int
	Passed        int
	Failed        int
	TotalDuration string
	TotalRequests int
	Suites        []suiteRow
	SuiteDetails  []SuiteDetail
}

type suiteRow struct {
	Name        string
	Status      string
	StatusClass string
	DurationStr string
	DurationMs  int64
}

// SuiteDetail holds detailed per-suite info including the HTTP timeline.
type SuiteDetail struct {
	Name        string
	Status      string
	StatusClass string
	DurationStr string
	DurationMs  int64
	TotalReqs   int
	Requests    []RequestDetail
}

// RequestDetail holds one HTTP interaction for the timeline.
type RequestDetail struct {
	Step        int
	SubTest     string
	Method      string
	MethodClass string // "get", "post"
	Path        string
	StatusCode  int
	StatusClass string // "status-2xx", "status-4xx", "status-5xx"
	DurationStr string
	ReqBody     string
	ResBody     string
	HasReqBody  bool
	HasResBody  bool
	Headers     []HeaderPair
}

// HeaderPair is a single request header for display.
type HeaderPair struct {
	Key   string
	Value string
}

func generateReport(results []SuiteResult) error {
	data := buildReportData(results)

	dir := reportDir()

	// 1. Generate Markdown
	md := generateMarkdown(data)
	mdPath := filepath.Join(dir, "report.md")
	if err := os.WriteFile(mdPath, []byte(md), 0644); err != nil {
		return fmt.Errorf("write markdown: %w", err)
	}
	fmt.Printf("\nMarkdown report: %s\n", mdPath)

	// 2. Render full HTML report (template-driven, no goldmark needed)
	htmlPath := filepath.Join(dir, "report.html")
	if err := renderHTML(data, htmlPath); err != nil {
		return fmt.Errorf("render html: %w", err)
	}
	fmt.Printf("HTML report:     %s\n", htmlPath)

	// 3. Auto-open in browser
	openBrowser(htmlPath)
	return nil
}

func buildReportData(results []SuiteResult) ReportData {
	var total time.Duration
	passed := 0
	failed := 0
	rows := make([]suiteRow, len(results))

	for i, r := range results {
		total += r.Duration
		status := "PASS"
		cls := "pass"
		if !r.Passed {
			status = "FAIL"
			cls = "fail"
			failed++
		} else {
			passed++
		}
		rows[i] = suiteRow{
			Name:        r.Name,
			Status:      status,
			StatusClass: cls,
			DurationStr: r.Duration.Round(time.Millisecond).String(),
			DurationMs:  r.Duration.Milliseconds(),
		}
	}

	requestLogsMu.Lock()
	logs := make([]RequestLog, len(requestLogs))
	copy(logs, requestLogs)
	requestLogsMu.Unlock()

	details := groupRequestsBySuite(logs, rows)

	return ReportData{
		Timestamp:     time.Now().Format("2006-01-02 15:04:05"),
		TotalSuites:   len(results),
		Passed:        passed,
		Failed:        failed,
		TotalDuration: total.Round(time.Millisecond).String(),
		TotalRequests: len(logs),
		Suites:        rows,
		SuiteDetails:  details,
	}
}

func groupRequestsBySuite(logs []RequestLog, suites []suiteRow) []SuiteDetail {
	suiteReqs := make(map[string][]RequestLog)
	for _, log := range logs {
		name := extractSuiteName(log.TestName)
		suiteReqs[name] = append(suiteReqs[name], log)
	}

	details := make([]SuiteDetail, len(suites))
	for i, s := range suites {
		reqs := suiteReqs[s.Name]
		details[i] = SuiteDetail{
			Name:        s.Name,
			Status:      s.Status,
			StatusClass: s.StatusClass,
			DurationStr: s.DurationStr,
			DurationMs:  s.DurationMs,
			TotalReqs:   len(reqs),
			Requests:    buildRequestDetails(reqs),
		}
	}
	return details
}

func extractSuiteName(testName string) string {
	// TestE2E/01_Health/SubTest -> 01_Health
	parts := strings.Split(testName, "/")
	if len(parts) >= 2 {
		return parts[1]
	}
	return testName
}

func extractSubTestName(testName string) string {
	// TestE2E/01_Health/SubTest -> SubTest
	parts := strings.Split(testName, "/")
	if len(parts) >= 3 {
		return strings.Join(parts[2:], "/")
	}
	return ""
}

func buildRequestDetails(logs []RequestLog) []RequestDetail {
	details := make([]RequestDetail, len(logs))
	for i, log := range logs {
		statusClass := "status-2xx"
		if log.StatusCode >= 400 && log.StatusCode < 500 {
			statusClass = "status-4xx"
		} else if log.StatusCode >= 500 {
			statusClass = "status-5xx"
		}

		var headers []HeaderPair
		for k, v := range log.ReqHeaders {
			headers = append(headers, HeaderPair{Key: k, Value: v})
		}

		details[i] = RequestDetail{
			Step:        i + 1,
			SubTest:     extractSubTestName(log.TestName),
			Method:      log.Method,
			MethodClass: strings.ToLower(log.Method),
			Path:        log.Path,
			StatusCode:  log.StatusCode,
			StatusClass: statusClass,
			DurationStr: log.Duration.Round(time.Millisecond).String(),
			ReqBody:     log.ReqBody,
			ResBody:     log.ResBody,
			HasReqBody:  log.ReqBody != "",
			HasResBody:  log.ResBody != "",
			Headers:     headers,
		}
	}
	return details
}

func generateMarkdown(data ReportData) string {
	var buf bytes.Buffer
	fmt.Fprintf(&buf, "# E2E Test Report\n\n")
	fmt.Fprintf(&buf, "**Date:** %s  \n", data.Timestamp)
	fmt.Fprintf(&buf, "**Total:** %d suites | **Passed:** %d | **Failed:** %d | **Duration:** %s | **HTTP Requests:** %d\n\n",
		data.TotalSuites, data.Passed, data.Failed, data.TotalDuration, data.TotalRequests)

	fmt.Fprintf(&buf, "## Summary\n\n")
	fmt.Fprintf(&buf, "| Suite | Status | Duration | Requests |\n")
	fmt.Fprintf(&buf, "|-------|--------|----------|----------|\n")
	for _, s := range data.SuiteDetails {
		fmt.Fprintf(&buf, "| %s | %s | %s | %d |\n", s.Name, s.Status, s.DurationStr, s.TotalReqs)
	}

	fmt.Fprintf(&buf, "\n## Detailed Timeline\n\n")
	for _, s := range data.SuiteDetails {
		fmt.Fprintf(&buf, "### %s [%s] — %s, %d requests\n\n", s.Name, s.Status, s.DurationStr, s.TotalReqs)
		for _, r := range s.Requests {
			subtest := ""
			if r.SubTest != "" {
				subtest = fmt.Sprintf(" *[%s]*", r.SubTest)
			}
			fmt.Fprintf(&buf, "**Step %d** `%s %s` → **%d** (%s)%s\n\n",
				r.Step, r.Method, r.Path, r.StatusCode, r.DurationStr, subtest)
			if r.HasReqBody {
				fmt.Fprintf(&buf, "<details><summary>Request Body</summary>\n\n```json\n%s\n```\n\n</details>\n\n", r.ReqBody)
			}
			if r.HasResBody {
				fmt.Fprintf(&buf, "<details><summary>Response Body</summary>\n\n```json\n%s\n```\n\n</details>\n\n", r.ResBody)
			}
		}
	}

	return buf.String()
}

func renderHTML(data ReportData, outPath string) error {
	funcMap := template.FuncMap{
		"inc": func(i int) int { return i + 1 },
	}
	tmpl, err := template.New("report").Funcs(funcMap).Parse(htmlReportTemplate)
	if err != nil {
		return err
	}

	names := make([]string, len(data.Suites))
	durations := make([]int64, len(data.Suites))
	for i, s := range data.Suites {
		names[i] = s.Name
		durations[i] = s.DurationMs
	}
	namesJSON, _ := json.Marshal(names)
	durationsJSON, _ := json.Marshal(durations)

	type tmplData struct {
		ReportData
		SuiteNamesJSON  template.JS
		DurationsMsJSON template.JS
	}

	f, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer f.Close()

	return tmpl.Execute(f, tmplData{
		ReportData:      data,
		SuiteNamesJSON:  template.JS(namesJSON),
		DurationsMsJSON: template.JS(durationsJSON),
	})
}

func reportDir() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Dir(filename)
}

func openBrowser(path string) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		absPath = path
	}
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", absPath)
	case "linux":
		cmd = exec.Command("xdg-open", absPath)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", absPath)
	}
	if cmd != nil {
		_ = cmd.Start()
	}
}

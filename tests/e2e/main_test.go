package e2e

import (
	"fmt"
	"os"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	baseURL = os.Getenv("E2E_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8081"
	}

	code := m.Run()

	// Generate report after all tests complete (even on failure)
	if err := generateReport(suiteResults); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to generate report: %v\n", err)
	}

	os.Exit(code)
}

func TestE2E(t *testing.T) {
	suites := []struct {
		name string
		fn   func(t *testing.T)
	}{
		{"01_Health", testHealth},
		{"02_SeedVerify", testSeedVerify},
		{"03_AgentRegistration", testAgentRegistration},
		{"04_TaskCreation", testTaskCreation},
		{"05_TaskLifecycle", testTaskLifecycle},
		{"06_TokenEconomy", testTokenEconomy},
		{"07_TaskErrors", testTaskErrors},
		{"08_MultiAgent", testMultiAgent},
		{"09_LegacyCompat", testLegacyCompat},
		{"10_MCP", testMCP},
	}

	for _, s := range suites {
		suite := s
		start := time.Now()
		passed := t.Run(suite.name, suite.fn)
		suiteResults = append(suiteResults, SuiteResult{
			Name:     suite.name,
			Passed:   passed,
			Duration: time.Since(start),
		})
		if !passed {
			t.Fatalf("Suite %s failed; aborting remaining suites (state-dependent)", suite.name)
		}
	}
}

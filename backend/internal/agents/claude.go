package agents

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"math/big"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
)

// ClaudeRunner executes agent prompts via `claude -p --dangerously-skip-permissions`.
// Prompt templates live at promptsDir/*.md and are filled with Go text/template.
type ClaudeRunner struct {
	promptsDir string
}

func NewClaudeRunner(promptsDir string) *ClaudeRunner {
	return &ClaudeRunner{promptsDir: promptsDir}
}

func (c *ClaudeRunner) run(templateFile string, data any) (string, error) {
	tmplPath := filepath.Join(c.promptsDir, templateFile)
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return "", fmt.Errorf("parse template %s: %w", templateFile, err)
	}

	var prompt bytes.Buffer
	if err := tmpl.Execute(&prompt, data); err != nil {
		return "", fmt.Errorf("execute template: %w", err)
	}

	cmd := exec.Command("claude", "-p", "--dangerously-skip-permissions")
	cmd.Stdin = strings.NewReader(prompt.String())

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("claude CLI error: %w\nstderr: %s", err, stderr.String())
	}

	return strings.TrimSpace(stdout.String()), nil
}

// extractJSON finds the first JSON object in the output (handles markdown fences).
func extractJSON(raw string) string {
	// Strip markdown code fences if present
	raw = strings.TrimSpace(raw)
	if strings.HasPrefix(raw, "```") {
		lines := strings.Split(raw, "\n")
		// Remove first and last lines (fences)
		if len(lines) > 2 {
			lines = lines[1 : len(lines)-1]
		}
		raw = strings.Join(lines, "\n")
	}
	// Find the first { ... } block
	start := strings.Index(raw, "{")
	if start == -1 {
		return raw
	}
	depth := 0
	for i := start; i < len(raw); i++ {
		if raw[i] == '{' {
			depth++
		} else if raw[i] == '}' {
			depth--
			if depth == 0 {
				return raw[start : i+1]
			}
		}
	}
	return raw[start:]
}

// ── PRD Agent ──

type ClaudePRD struct{ runner *ClaudeRunner }

func (a *ClaudePRD) GeneratePRD(issueTitle, issueBody string) (*models.PRDOutput, error) {
	raw, err := a.runner.run("prd.md", map[string]string{
		"Title": issueTitle,
		"Body":  issueBody,
	})
	if err != nil {
		return nil, err
	}

	var result struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Hash        string `json:"hash"`
	}
	if err := json.Unmarshal([]byte(extractJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("parse PRD output: %w\nraw: %s", err, raw)
	}

	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(result.Description)))
	return &models.PRDOutput{
		Title:       result.Title,
		Description: result.Description,
		Hash:        hash[:16],
	}, nil
}

// ── Estimator Agent ──

type ClaudeEstimator struct{ runner *ClaudeRunner }

func (a *ClaudeEstimator) Estimate(prd *models.PRDOutput, repoFullName string) (*models.EstimateOutput, error) {
	raw, err := a.runner.run("estimator.md", map[string]string{
		"Title":        prd.Title,
		"Description":  prd.Description,
		"RepoFullName": repoFullName,
	})
	if err != nil {
		return nil, err
	}

	var result struct {
		Complexity       uint64  `json:"complexity"`
		EstimatedHours   float64 `json:"estimated_hours"`
		SuggestedBounty  float64 `json:"suggested_bounty_eth"`
	}
	if err := json.Unmarshal([]byte(extractJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("parse estimator output: %w\nraw: %s", err, raw)
	}

	// Convert ETH float to wei
	ethFloat := new(big.Float).SetFloat64(result.SuggestedBounty)
	weiFloat := new(big.Float).Mul(ethFloat, new(big.Float).SetFloat64(1e18))
	wei, _ := weiFloat.Int(nil)

	return &models.EstimateOutput{
		Complexity:      result.Complexity,
		EstimatedHours:  result.EstimatedHours,
		SuggestedBounty: wei,
	}, nil
}

// ── QA Agent ──

type ClaudeQA struct{ runner *ClaudeRunner }

func (a *ClaudeQA) GenerateCriteria(prd *models.PRDOutput) (*models.QAOutput, error) {
	raw, err := a.runner.run("qa.md", map[string]string{
		"Title":       prd.Title,
		"Description": prd.Description,
	})
	if err != nil {
		return nil, err
	}

	var result struct {
		Criteria []string `json:"criteria"`
		Hash     string   `json:"hash"`
	}
	if err := json.Unmarshal([]byte(extractJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("parse QA output: %w\nraw: %s", err, raw)
	}

	combined := strings.Join(result.Criteria, "\n")
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(combined)))

	return &models.QAOutput{
		Criteria: result.Criteria,
		Hash:     hash[:16],
	}, nil
}

// ── Reviewer Agent ──

type ClaudeReviewer struct{ runner *ClaudeRunner }

func (a *ClaudeReviewer) Review(prd *models.PRDOutput, qa *models.QAOutput, prDiff string) (*models.ReviewOutput, error) {
	criteria := ""
	for _, c := range qa.Criteria {
		criteria += fmt.Sprintf("- %s\n", c)
	}

	raw, err := a.runner.run("reviewer.md", map[string]string{
		"PRDDescription": prd.Description,
		"QACriteria":     criteria,
		"Patch":          prDiff,
	})
	if err != nil {
		return nil, err
	}

	var result struct {
		Score          uint8    `json:"score"`
		Summary        string   `json:"summary"`
		Recommendation string   `json:"recommendation"`
		Feedback       []string `json:"feedback"`
	}
	if err := json.Unmarshal([]byte(extractJSON(raw)), &result); err != nil {
		return nil, fmt.Errorf("parse reviewer output: %w\nraw: %s", err, raw)
	}

	return &models.ReviewOutput{
		Score:          result.Score,
		Summary:        result.Summary,
		Recommendation: result.Recommendation,
		Feedback:       result.Feedback,
	}, nil
}

// NewClaudeAgentSet creates an AgentSet backed by Claude CLI.
func NewClaudeAgentSet(promptsDir string) *AgentSet {
	runner := NewClaudeRunner(promptsDir)
	return &AgentSet{
		PRD:       &ClaudePRD{runner: runner},
		Estimator: &ClaudeEstimator{runner: runner},
		QA:        &ClaudeQA{runner: runner},
		Reviewer:  &ClaudeReviewer{runner: runner},
	}
}

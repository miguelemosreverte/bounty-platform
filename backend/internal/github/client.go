package github

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	gh "github.com/google/go-github/v60/github"
)

type Client struct {
	gh    *gh.Client
	token string
}

func NewClient(token string) *Client {
	client := gh.NewClient(nil)
	if token != "" {
		client = client.WithAuthToken(token)
	}
	return &Client{gh: client, token: token}
}

func (c *Client) PostComment(ctx context.Context, owner, repo string, issueNum int, body string) error {
	_, _, err := c.gh.Issues.CreateComment(ctx, owner, repo, issueNum, &gh.IssueComment{
		Body: &body,
	})
	return err
}

func (c *Client) GetPRDiff(ctx context.Context, owner, repo string, prNum int) (string, error) {
	diffURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls/%d", owner, repo, prNum)

	req, err := http.NewRequestWithContext(ctx, "GET", diffURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/vnd.github.v3.diff")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

// ParseIssueNumber extracts issue number from PR body (e.g., "Fixes #42")
func ParseIssueNumber(body string) (int, bool) {
	prefixes := []string{"fixes #", "closes #", "resolves #"}
	lower := strings.ToLower(body)
	for _, prefix := range prefixes {
		idx := strings.Index(lower, prefix)
		if idx == -1 {
			continue
		}
		numStr := ""
		for i := idx + len(prefix); i < len(lower); i++ {
			if lower[i] >= '0' && lower[i] <= '9' {
				numStr += string(lower[i])
			} else {
				break
			}
		}
		if numStr != "" {
			var num int
			fmt.Sscanf(numStr, "%d", &num)
			if num > 0 {
				return num, true
			}
		}
	}
	return 0, false
}

// ParseWalletAddress extracts wallet from PR body (e.g., "<!-- bounty-wallet: 0x... -->")
func ParseWalletAddress(body string) (string, bool) {
	marker := "bounty-wallet:"
	idx := strings.Index(strings.ToLower(body), marker)
	if idx == -1 {
		// Also try "wallet:" as fallback
		marker = "wallet:"
		idx = strings.Index(strings.ToLower(body), marker)
		if idx == -1 {
			return "", false
		}
	}

	rest := strings.TrimSpace(body[idx+len(marker):])
	// Extract 0x address
	if strings.HasPrefix(rest, "0x") || strings.HasPrefix(rest, "0X") {
		addr := ""
		for i := 0; i < len(rest) && i < 42; i++ {
			c := rest[i]
			if (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F') || c == 'x' || c == 'X' {
				addr += string(c)
			} else {
				break
			}
		}
		if len(addr) == 42 {
			return addr, true
		}
	}
	return "", false
}

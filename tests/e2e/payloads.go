package e2e

import "fmt"

// issueWebhook builds a GitHub issues webhook payload.
func issueWebhook(action, labelName string, issueNum int, title, body, repoOwner, repoName string) string {
	labelJSON := ""
	if labelName != "" {
		labelJSON = fmt.Sprintf(`"label": {"name": %q},`, labelName)
	}
	labelsArr := "[]"
	if labelName != "" {
		labelsArr = fmt.Sprintf(`[{"name": %q}]`, labelName)
	}
	return fmt.Sprintf(`{
		"action": %q,
		%s
		"issue": {
			"number": %d,
			"title": %q,
			"body": %q,
			"state": "open",
			"labels": %s
		},
		"repository": {
			"full_name": "%s/%s",
			"name": %q,
			"owner": {"login": %q}
		}
	}`, action, labelJSON, issueNum, title, body, labelsArr, repoOwner, repoName, repoName, repoOwner)
}

// prWebhook builds a GitHub pull_request webhook payload.
func prWebhook(action string, prNum int, title, body, state string, merged bool, sha, ref, repoOwner, repoName string) string {
	return fmt.Sprintf(`{
		"action": %q,
		"pull_request": {
			"number": %d,
			"title": %q,
			"body": %q,
			"state": %q,
			"merged": %v,
			"head": {"sha": %q, "ref": %q},
			"diff_url": "",
			"html_url": ""
		},
		"repository": {
			"full_name": "%s/%s",
			"name": %q,
			"owner": {"login": %q}
		}
	}`, action, prNum, title, body, state, merged, sha, ref, repoOwner, repoName, repoName, repoOwner)
}

// webhookHeaders returns standard headers for a GitHub webhook POST.
func webhookHeaders(event string) map[string]string {
	return map[string]string{
		"Content-Type":   "application/json",
		"X-GitHub-Event": event,
	}
}

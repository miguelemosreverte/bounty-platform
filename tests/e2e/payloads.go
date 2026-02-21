package e2e

import (
	"encoding/json"
	"fmt"
)

// ── Task API payload builders ──

// agentPayload builds a JSON body for POST /api/agents/register.
func agentPayload(id, name, source, model, careerPath string) string {
	m := map[string]string{"id": id, "name": name}
	if source != "" {
		m["source"] = source
	}
	if model != "" {
		m["model"] = model
	}
	if careerPath != "" {
		m["careerPath"] = careerPath
	}
	b, _ := json.Marshal(m)
	return string(b)
}

// taskPayload builds a JSON body for POST /api/tasks.
func taskPayload(creator, title, desc, repoURL, rewardType, rewardAmount, language string, tags []string) string {
	m := map[string]interface{}{
		"creator": creator,
		"title":   title,
	}
	if desc != "" {
		m["description"] = desc
	}
	if repoURL != "" {
		m["repoUrl"] = repoURL
	}
	if rewardType != "" {
		m["rewardType"] = rewardType
	}
	if rewardAmount != "" {
		m["rewardAmount"] = rewardAmount
	}
	if language != "" {
		m["language"] = language
	}
	if tags != nil {
		m["tags"] = tags
	}
	b, _ := json.Marshal(m)
	return string(b)
}

// claimPayload builds a JSON body for POST /api/tasks/{id}/claim.
func claimPayload(agentID string) string {
	b, _ := json.Marshal(map[string]string{"agentId": agentID})
	return string(b)
}

// submissionPayload builds a JSON body for POST /api/tasks/{id}/submissions.
func submissionPayload(agentID, patch, description string) string {
	b, _ := json.Marshal(map[string]string{
		"agentId":     agentID,
		"patch":       patch,
		"description": description,
	})
	return string(b)
}

// samplePatch returns a realistic unified diff for test submissions.
func samplePatch(filename, content string) string {
	return fmt.Sprintf(`--- /dev/null
+++ b/%s
@@ -0,0 +1,5 @@
+package main
+
+func main() {
+	%s
+}
`, filename, content)
}

// ── Legacy webhook payload builders (kept for backward compat test) ──

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

package e2e

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testWebhookErrors(t *testing.T) {
	t.Run("Missing X-GitHub-Event header returns 400", func(t *testing.T) {
		status, _, _ := httpPost(t, "/api/webhook/github", `{"action":"labeled"}`, map[string]string{
			"Content-Type": "application/json",
		})
		assert.Equal(t, 400, status)
	})

	t.Run("Malformed JSON body returns 400", func(t *testing.T) {
		status, _, _ := httpPost(t, "/api/webhook/github", `not json at all`, webhookHeaders("issues"))
		assert.Equal(t, 400, status)
	})

	t.Run("Issue labeled with bug label is ignored", func(t *testing.T) {
		payload := issueWebhook("labeled", "bug", 900, "A bug report", "Something is broken", "test", "ignored")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("issues"))
		assert.Equal(t, 200, status)
	})

	t.Run("Issue action opened is ignored", func(t *testing.T) {
		payload := issueWebhook("opened", "", 901, "New issue", "Some issue body", "test", "ignored")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("issues"))
		assert.Equal(t, 200, status)
	})

	t.Run("PR without issue reference is ignored", func(t *testing.T) {
		payload := prWebhook("opened", 900, "Random PR",
			"This PR does not reference any issue.\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
			"open", false, "deadbeef12345678", "feature/random", "test", "ignored")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	t.Run("PR with issue reference but no wallet is ignored", func(t *testing.T) {
		payload := prWebhook("opened", 901, "Fix issue 1",
			"Fixes #1\n\nNo wallet address here.",
			"open", false, "cafebabe12345678", "fix/no-wallet", "test", "ignored")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	t.Run("PR referencing non-existent bounty is ignored", func(t *testing.T) {
		payload := prWebhook("opened", 902, "Fix issue 9999",
			"Fixes #9999\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
			"open", false, "00112233aabbccdd", "fix/nonexistent", "test", "ignored")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	t.Run("PR closed but not merged is ignored", func(t *testing.T) {
		payload := prWebhook("closed", 903, "Abandoned PR",
			"Fixes #1\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
			"closed", false, "aabbccdd11223344", "fix/abandoned", "test", "ignored")
		status, _, _ := httpPost(t, "/api/webhook/github", payload, webhookHeaders("pull_request"))
		assert.Equal(t, 200, status)
	})

	t.Run("Unknown event push is ignored", func(t *testing.T) {
		status, _, _ := httpPost(t, "/api/webhook/github",
			`{"action":"completed","repository":{"full_name":"test/ignored","name":"ignored","owner":{"login":"test"}}}`,
			webhookHeaders("push"))
		assert.Equal(t, 200, status)
	})

	t.Run("No new bounties created — still only 2 seed bounties", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		assert.Len(t, body, 2, "expected exactly 2 seed bounties, got %d", len(body))
	})
}

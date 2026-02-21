package e2e

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testHealth(t *testing.T) {
	addrRegex := `^0x[0-9a-fA-F]{40}$`

	t.Run("GET /api/health", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/health")
		require.Equal(t, 200, status)

		assert.Equal(t, "ok", jsonString(body, "status"))
		assert.Equal(t, "31337", jsonString(body, "chainId"))
		assert.Regexp(t, addrRegex, jsonString(body, "oracle"))
	})

	t.Run("GET /api/addresses", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/addresses")
		require.Equal(t, 200, status)

		assert.Regexp(t, addrRegex, jsonString(body, "bountyPlatform"))
		assert.Regexp(t, addrRegex, jsonString(body, "leaderboard"))
		assert.Regexp(t, addrRegex, jsonString(body, "oracle"))
	})
}

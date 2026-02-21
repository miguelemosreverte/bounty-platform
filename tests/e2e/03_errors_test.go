package e2e

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testErrors(t *testing.T) {
	t.Run("GET /api/bounties/999 — non-existent bounty returns id 0", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/999")
		require.Equal(t, 200, status)
		assert.Equal(t, float64(0), jsonFloat(body, "id"))
	})

	t.Run("GET /api/bounties/abc — invalid id", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/abc")
		require.Equal(t, 400, status)
		assert.Equal(t, "invalid id", jsonString(body, "error"))
	})

	t.Run("GET /api/bounties/abc/solutions — invalid id", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/abc/solutions")
		require.Equal(t, 400, status)
		assert.Equal(t, "invalid id", jsonString(body, "error"))
	})

	t.Run("GET /api/bounties/-1 — negative id", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/-1")
		require.Equal(t, 400, status)
		assert.Equal(t, "invalid id", jsonString(body, "error"))
	})

	t.Run("GET /api/bounties/999999999 — large non-existent id returns id 0", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/999999999")
		require.Equal(t, 200, status)
		assert.Equal(t, float64(0), jsonFloat(body, "id"))
	})

	t.Run("GET /api/bounties/999/solutions — empty array for non-existent bounty", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties/999/solutions")
		require.Equal(t, 200, status)
		assert.Empty(t, body)
	})

	t.Run("GET /api/leaderboard — at least 2 entries", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/leaderboard")
		require.Equal(t, 200, status)
		assert.GreaterOrEqual(t, len(body), 2)
	})

	t.Run("GET /api/bounties — at least 2 bounties", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		assert.GreaterOrEqual(t, len(body), 2)
	})
}

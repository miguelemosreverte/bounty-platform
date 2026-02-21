package e2e

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testSeedVerify(t *testing.T) {
	addrRegex := `^0x[0-9a-fA-F]{40}$`

	t.Run("GET /api/bounties returns 2 seeded bounties", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		require.Len(t, body, 2)

		for _, item := range body {
			m := asObj(item)
			assert.Equal(t, "pioneers", jsonString(m, "repoName"))
		}
	})

	t.Run("GET /api/bounties/1 — closed bounty with 1 solution", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/1")
		require.Equal(t, 200, status)

		assert.Equal(t, float64(1), jsonFloat(body, "id"))
		assert.Equal(t, "seed", jsonString(body, "repoOwner"))
		assert.Equal(t, "pioneers", jsonString(body, "repoName"))
		assert.Equal(t, float64(100), jsonFloat(body, "issueNumber"))
		assert.Equal(t, "closed", jsonString(body, "status"))
		assert.Equal(t, float64(1), jsonFloat(body, "solutionCount"))
		assert.Equal(t, float64(5), jsonFloat(body, "estimatedComplexity"))
		assert.Equal(t, "QmSeedPRD1abc123", jsonString(body, "prdHash"))
		assert.Equal(t, "QmSeedQA1xyz789", jsonString(body, "qaHash"))
		assert.Equal(t, "0", jsonString(body, "amount"))
		assert.Greater(t, jsonFloat(body, "createdAt"), float64(0))
		assert.Greater(t, jsonFloat(body, "closedAt"), float64(0))
		assert.Regexp(t, addrRegex, jsonString(body, "maintainer"))
	})

	t.Run("GET /api/bounties/1/solutions — 1 accepted solution", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties/1/solutions")
		require.Equal(t, 200, status)
		require.Len(t, body, 1)

		sol := asObj(body[0])
		assert.Equal(t, float64(1), jsonFloat(sol, "bountyId"))
		assert.Equal(t, float64(10), jsonFloat(sol, "prNumber"))
		assert.Equal(t, "seedcommit1a2b3c4d", jsonString(sol, "commitHash"))
		assert.Equal(t, "accepted", jsonString(sol, "status"))

		contributor := jsonString(sol, "contributor")
		assert.True(t,
			strings.EqualFold(contributor, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
			"contributor address mismatch: got %s", contributor,
		)
	})

	t.Run("GET /api/bounties/2 — open bounty with no solutions", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/bounties/2")
		require.Equal(t, 200, status)

		assert.Equal(t, float64(2), jsonFloat(body, "id"))
		assert.Equal(t, "seed", jsonString(body, "repoOwner"))
		assert.Equal(t, "pioneers", jsonString(body, "repoName"))
		assert.Equal(t, float64(200), jsonFloat(body, "issueNumber"))
		assert.Equal(t, "open", jsonString(body, "status"))
		assert.Equal(t, float64(0), jsonFloat(body, "solutionCount"))
		assert.Equal(t, float64(3), jsonFloat(body, "estimatedComplexity"))
		assert.Equal(t, "QmSeedPRD2def456", jsonString(body, "prdHash"))
		assert.Equal(t, "QmSeedQA2uvw012", jsonString(body, "qaHash"))
		assert.NotEqual(t, "0", jsonString(body, "amount"))
		assert.Greater(t, jsonFloat(body, "createdAt"), float64(0))
		assert.Equal(t, float64(0), jsonFloat(body, "closedAt"))
	})

	t.Run("GET /api/bounties/2/solutions — empty", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties/2/solutions")
		require.Equal(t, 200, status)
		assert.Empty(t, body)
	})

	t.Run("GET /api/leaderboard — 2 entries", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/leaderboard")
		require.Equal(t, 200, status)
		require.Len(t, body, 2)

		for _, item := range body {
			m := asObj(item)
			assert.GreaterOrEqual(t, jsonFloat(m, "totalBounties"), float64(1))
			assert.Greater(t, jsonFloat(m, "reputation"), float64(0))
		}

		assert.Equal(t, 1, countByField(body, "actorType", "contributor"))
		assert.Equal(t, 1, countByField(body, "actorType", "maintainer"))
	})
}

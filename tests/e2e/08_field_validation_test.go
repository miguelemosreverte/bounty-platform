package e2e

import (
	"fmt"
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testFieldValidation(t *testing.T) {
	addrRegex := `^0x[0-9a-fA-F]{40}$`

	// ---------- 1. Health response validation ----------
	t.Run("Health response validation", func(t *testing.T) {
		status, headers, body := httpGet(t, "/api/health")
		require.Equal(t, 200, status)

		assert.Contains(t, headers.Get("Content-Type"), "application/json")

		// $.status is string == "ok"
		statusVal, ok := body["status"].(string)
		assert.True(t, ok, "$.status should be a string")
		assert.Equal(t, "ok", statusVal)

		// $.chainId is string == "31337"
		chainID, ok := body["chainId"].(string)
		assert.True(t, ok, "$.chainId should be a string")
		assert.Equal(t, "31337", chainID)

		// $.oracle is string matching address regex
		oracle, ok := body["oracle"].(string)
		assert.True(t, ok, "$.oracle should be a string")
		assert.Regexp(t, addrRegex, oracle)
	})

	// ---------- 2. Addresses response validation ----------
	t.Run("Addresses response validation", func(t *testing.T) {
		status, _, body := httpGet(t, "/api/addresses")
		require.Equal(t, 200, status)

		bp, ok := body["bountyPlatform"].(string)
		assert.True(t, ok, "$.bountyPlatform should be a string")
		assert.Regexp(t, addrRegex, bp)

		lb, ok := body["leaderboard"].(string)
		assert.True(t, ok, "$.leaderboard should be a string")
		assert.Regexp(t, addrRegex, lb)

		oracle, ok := body["oracle"].(string)
		assert.True(t, ok, "$.oracle should be a string")
		assert.Regexp(t, addrRegex, oracle)
	})

	// ---------- 3. Bounty list validation ----------
	var firstBountyID float64
	t.Run("Bounty list validation", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/bounties")
		require.Equal(t, 200, status)
		require.GreaterOrEqual(t, len(body), 5, "expected at least 5 bounties")

		first := asObj(body[0])
		require.NotNil(t, first, "first bounty should be a JSON object")

		// id is integer (float64 == floor)
		id := jsonFloat(first, "id")
		assert.Equal(t, math.Floor(id), id, "id should be an integer")

		// String fields
		_, ok := first["maintainer"].(string)
		assert.True(t, ok, "maintainer should be a string")
		_, ok = first["repoOwner"].(string)
		assert.True(t, ok, "repoOwner should be a string")
		_, ok = first["repoName"].(string)
		assert.True(t, ok, "repoName should be a string")
		_, ok = first["prdHash"].(string)
		assert.True(t, ok, "prdHash should be a string")
		_, ok = first["qaHash"].(string)
		assert.True(t, ok, "qaHash should be a string")
		_, ok = first["amount"].(string)
		assert.True(t, ok, "amount should be a string")
		_, ok = first["status"].(string)
		assert.True(t, ok, "status should be a string")

		// Integer fields (float64 == floor)
		issueNumber := jsonFloat(first, "issueNumber")
		assert.Equal(t, math.Floor(issueNumber), issueNumber, "issueNumber should be an integer")
		estComplexity := jsonFloat(first, "estimatedComplexity")
		assert.Equal(t, math.Floor(estComplexity), estComplexity, "estimatedComplexity should be an integer")
		solCount := jsonFloat(first, "solutionCount")
		assert.Equal(t, math.Floor(solCount), solCount, "solutionCount should be an integer")
		createdAt := jsonFloat(first, "createdAt")
		assert.Equal(t, math.Floor(createdAt), createdAt, "createdAt should be an integer")
		closedAt := jsonFloat(first, "closedAt")
		assert.Equal(t, math.Floor(closedAt), closedAt, "closedAt should be an integer")

		firstBountyID = id
	})

	// ---------- 4. Single bounty full validation ----------
	t.Run("Single bounty full validation", func(t *testing.T) {
		require.NotZero(t, firstBountyID, "firstBountyID must be captured")

		status, _, body := httpGet(t, fmt.Sprintf("/api/bounties/%d", int(firstBountyID)))
		require.Equal(t, 200, status)

		// id matches captured value
		assert.Equal(t, firstBountyID, jsonFloat(body, "id"))

		// maintainer matches address regex
		assert.Regexp(t, addrRegex, jsonString(body, "maintainer"))

		// repoOwner and repoName are non-empty
		assert.NotEmpty(t, jsonString(body, "repoOwner"))
		assert.NotEmpty(t, jsonString(body, "repoName"))

		// issueNumber > 0
		assert.Greater(t, jsonFloat(body, "issueNumber"), float64(0))

		// prdHash and qaHash are non-empty
		assert.NotEmpty(t, jsonString(body, "prdHash"))
		assert.NotEmpty(t, jsonString(body, "qaHash"))

		// amount is string
		_, ok := body["amount"].(string)
		assert.True(t, ok, "amount should be a string")

		// estimatedComplexity >= 1 AND <= 10
		ec := jsonFloat(body, "estimatedComplexity")
		assert.GreaterOrEqual(t, ec, float64(1))
		assert.LessOrEqual(t, ec, float64(10))

		// status matches valid values
		assert.Regexp(t, `^(open|closed|cancelled)$`, jsonString(body, "status"))

		// solutionCount >= 0
		assert.GreaterOrEqual(t, jsonFloat(body, "solutionCount"), float64(0))

		// createdAt > 0
		assert.Greater(t, jsonFloat(body, "createdAt"), float64(0))
	})

	// ---------- 5. Solution list validation ----------
	t.Run("Solution list validation", func(t *testing.T) {
		require.NotZero(t, firstBountyID, "firstBountyID must be captured")

		status, _, body := httpGetArray(t, fmt.Sprintf("/api/bounties/%d/solutions", int(firstBountyID)))
		require.Equal(t, 200, status)
		require.GreaterOrEqual(t, len(body), 1, "expected at least 1 solution")

		sol := asObj(body[0])
		require.NotNil(t, sol, "solution should be a JSON object")

		// id > 0 (integer)
		solID := jsonFloat(sol, "id")
		assert.Greater(t, solID, float64(0))
		assert.Equal(t, math.Floor(solID), solID, "solution id should be an integer")

		// bountyId == firstBountyID
		assert.Equal(t, firstBountyID, jsonFloat(sol, "bountyId"))

		// contributor matches address regex
		assert.Regexp(t, addrRegex, jsonString(sol, "contributor"))

		// prNumber > 0
		assert.Greater(t, jsonFloat(sol, "prNumber"), float64(0))

		// commitHash is non-empty
		assert.NotEmpty(t, jsonString(sol, "commitHash"))

		// score >= 0 AND <= 100
		score := jsonFloat(sol, "score")
		assert.GreaterOrEqual(t, score, float64(0))
		assert.LessOrEqual(t, score, float64(100))

		// status matches valid values
		assert.Regexp(t, `^(submitted|accepted|rejected)$`, jsonString(sol, "status"))

		// submittedAt > 0
		assert.Greater(t, jsonFloat(sol, "submittedAt"), float64(0))
	})

	// ---------- 6. Leaderboard validation ----------
	t.Run("Leaderboard validation", func(t *testing.T) {
		status, _, body := httpGetArray(t, "/api/leaderboard")
		require.Equal(t, 200, status)
		require.GreaterOrEqual(t, len(body), 1, "expected at least 1 leaderboard entry")

		entry := asObj(body[0])
		require.NotNil(t, entry, "leaderboard entry should be a JSON object")

		// address matches address regex
		assert.Regexp(t, addrRegex, jsonString(entry, "address"))

		// actorType matches valid values
		assert.Regexp(t, `^(contributor|maintainer|plugin)$`, jsonString(entry, "actorType"))

		// totalBounties >= 0 (integer)
		totalBounties := jsonFloat(entry, "totalBounties")
		assert.GreaterOrEqual(t, totalBounties, float64(0))
		assert.Equal(t, math.Floor(totalBounties), totalBounties, "totalBounties should be an integer")

		// totalPayout is string
		_, ok := entry["totalPayout"].(string)
		assert.True(t, ok, "totalPayout should be a string")

		// reputation is integer
		reputation := jsonFloat(entry, "reputation")
		assert.Equal(t, math.Floor(reputation), reputation, "reputation should be an integer")
	})
}

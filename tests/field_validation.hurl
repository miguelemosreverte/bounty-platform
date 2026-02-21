# Field Validation E2E Tests
#
# Exhaustive type/format/value checks for all API response models.
# Runs after multi_bounty and competing_solutions have populated data.

# --------------------------------------------------
# 1. Health response: all fields present and correctly typed
# --------------------------------------------------
GET {{base_url}}/api/health
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.status" isString
jsonpath "$.status" == "ok"
jsonpath "$.chainId" isString
jsonpath "$.chainId" == "31337"
jsonpath "$.oracle" isString
jsonpath "$.oracle" matches /^0x[0-9a-fA-F]{40}$/

# --------------------------------------------------
# 2. Addresses response: all fields present with correct format
# --------------------------------------------------
GET {{base_url}}/api/addresses
HTTP 200
[Asserts]
jsonpath "$.bountyPlatform" isString
jsonpath "$.bountyPlatform" matches /^0x[0-9a-fA-F]{40}$/
jsonpath "$.leaderboard" isString
jsonpath "$.leaderboard" matches /^0x[0-9a-fA-F]{40}$/
jsonpath "$.oracle" isString
jsonpath "$.oracle" matches /^0x[0-9a-fA-F]{40}$/

# --------------------------------------------------
# 3. Bounty list: validate array element types
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Asserts]
jsonpath "$" count >= 5
jsonpath "$[0].id" isInteger
jsonpath "$[0].maintainer" isString
jsonpath "$[0].repoOwner" isString
jsonpath "$[0].repoName" isString
jsonpath "$[0].issueNumber" isInteger
jsonpath "$[0].prdHash" isString
jsonpath "$[0].qaHash" isString
jsonpath "$[0].amount" isString
jsonpath "$[0].estimatedComplexity" isInteger
jsonpath "$[0].status" isString
jsonpath "$[0].solutionCount" isInteger
jsonpath "$[0].createdAt" isInteger
jsonpath "$[0].closedAt" isInteger
[Captures]
first_bounty_id: jsonpath "$[0].id"

# --------------------------------------------------
# 4. Single bounty: full field validation
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{first_bounty_id}}
HTTP 200
[Asserts]
# ID
jsonpath "$.id" isInteger
jsonpath "$.id" == {{first_bounty_id}}
# Maintainer address format
jsonpath "$.maintainer" isString
jsonpath "$.maintainer" matches /^0x[0-9a-fA-F]{40}$/
# Repo metadata are non-empty strings
jsonpath "$.repoOwner" isString
jsonpath "$.repoOwner" != ""
jsonpath "$.repoName" isString
jsonpath "$.repoName" != ""
# Issue number
jsonpath "$.issueNumber" isInteger
jsonpath "$.issueNumber" > 0
# Agent hashes (set by stub agents)
jsonpath "$.prdHash" isString
jsonpath "$.prdHash" != ""
jsonpath "$.qaHash" isString
jsonpath "$.qaHash" != ""
# Amount (string representation of wei)
jsonpath "$.amount" isString
# Complexity in valid range
jsonpath "$.estimatedComplexity" isInteger
jsonpath "$.estimatedComplexity" >= 1
jsonpath "$.estimatedComplexity" <= 10
# Status is one of known values
jsonpath "$.status" isString
jsonpath "$.status" matches /^(open|closed|cancelled)$/
# Solution count
jsonpath "$.solutionCount" isInteger
jsonpath "$.solutionCount" >= 0
# Timestamps
jsonpath "$.createdAt" isInteger
jsonpath "$.createdAt" > 0

# --------------------------------------------------
# 5. Solution list: full field validation
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{first_bounty_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$" count >= 1
# Solution field types and formats
jsonpath "$[0].id" isInteger
jsonpath "$[0].id" > 0
jsonpath "$[0].bountyId" isInteger
jsonpath "$[0].bountyId" == {{first_bounty_id}}
jsonpath "$[0].contributor" isString
jsonpath "$[0].contributor" matches /^0x[0-9a-fA-F]{40}$/
jsonpath "$[0].prNumber" isInteger
jsonpath "$[0].prNumber" > 0
jsonpath "$[0].commitHash" isString
jsonpath "$[0].commitHash" != ""
jsonpath "$[0].score" isInteger
jsonpath "$[0].score" >= 0
jsonpath "$[0].score" <= 100
jsonpath "$[0].status" isString
jsonpath "$[0].status" matches /^(submitted|accepted|rejected)$/
jsonpath "$[0].submittedAt" isInteger
jsonpath "$[0].submittedAt" > 0

# --------------------------------------------------
# 6. Leaderboard: full field validation
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
HTTP 200
[Asserts]
jsonpath "$" count >= 1
# Entry field types and formats
jsonpath "$[0].address" isString
jsonpath "$[0].address" matches /^0x[0-9a-fA-F]{40}$/
jsonpath "$[0].actorType" isString
jsonpath "$[0].actorType" matches /^(contributor|maintainer|plugin)$/
jsonpath "$[0].totalBounties" isInteger
jsonpath "$[0].totalBounties" >= 0
jsonpath "$[0].totalPayout" isString
jsonpath "$[0].reputation" isInteger

# Seed Data Verification Test
#
# Verifies that SyncFromChain correctly loaded the pre-seeded on-chain data
# into SQLite on backend startup.
#
# Seed state:
#   - Bounty 1: seed/pioneers#100 — closed, 1 accepted solution (contributor 0x7099...)
#   - Bounty 2: seed/pioneers#200 — open, no solutions
#   - Leaderboard: contributor 0x7099... (1 bounty, 10 rep) + maintainer 0xf39F... (1 bounty, 5 rep)

# --------------------------------------------------
# 1. Verify 2 seeded bounties exist
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Asserts]
jsonpath "$" count == 2
jsonpath "$[0].repoName" == "pioneers"
jsonpath "$[1].repoName" == "pioneers"

# --------------------------------------------------
# 2. Verify seed bounty 1 is closed with correct metadata
# --------------------------------------------------
GET {{base_url}}/api/bounties/1
HTTP 200
[Asserts]
jsonpath "$.id" == 1
jsonpath "$.repoOwner" == "seed"
jsonpath "$.repoName" == "pioneers"
jsonpath "$.issueNumber" == 100
jsonpath "$.status" == "closed"
jsonpath "$.solutionCount" == 1
jsonpath "$.estimatedComplexity" == 5
jsonpath "$.prdHash" == "QmSeedPRD1abc123"
jsonpath "$.qaHash" == "QmSeedQA1xyz789"
jsonpath "$.amount" == "0"
jsonpath "$.createdAt" > 0
jsonpath "$.closedAt" > 0
jsonpath "$.maintainer" matches /^0x[0-9a-fA-F]{40}$/

# --------------------------------------------------
# 3. Verify seed bounty 1 has 1 accepted solution
# --------------------------------------------------
GET {{base_url}}/api/bounties/1/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].bountyId" == 1
jsonpath "$[0].prNumber" == 10
jsonpath "$[0].commitHash" == "seedcommit1a2b3c4d"
jsonpath "$[0].status" == "accepted"
jsonpath "$[0].contributor" matches /(?i)0x70997970C51812dc3A010C7d01b50e0d17dc79C8/

# --------------------------------------------------
# 4. Verify seed bounty 2 is open with no solutions
# --------------------------------------------------
GET {{base_url}}/api/bounties/2
HTTP 200
[Asserts]
jsonpath "$.id" == 2
jsonpath "$.repoOwner" == "seed"
jsonpath "$.repoName" == "pioneers"
jsonpath "$.issueNumber" == 200
jsonpath "$.status" == "open"
jsonpath "$.solutionCount" == 0
jsonpath "$.estimatedComplexity" == 3
jsonpath "$.prdHash" == "QmSeedPRD2def456"
jsonpath "$.qaHash" == "QmSeedQA2uvw012"
jsonpath "$.amount" != "0"
jsonpath "$.createdAt" > 0
jsonpath "$.closedAt" == 0

GET {{base_url}}/api/bounties/2/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 0

# --------------------------------------------------
# 5. Verify leaderboard has 2 seeded entries
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
HTTP 200
[Asserts]
jsonpath "$" count == 2
# Both entries should have non-zero stats
jsonpath "$[0].totalBounties" >= 1
jsonpath "$[0].reputation" > 0
jsonpath "$[1].totalBounties" >= 1
jsonpath "$[1].reputation" > 0
# Both actor types should be present
jsonpath "$[?(@.actorType == 'contributor')]" count == 1
jsonpath "$[?(@.actorType == 'maintainer')]" count == 1

# Leaderboard Correctness E2E Test
#
# At this point in the test suite:
#   - Bounty A (test/alpha#1): CLOSED, paid to 0x3C44...
#   - Bounty B (test/beta#5):  OPEN, 1 solution submitted, PR closed without merge
#   - Bounty C (test/gamma#10): OPEN, no solutions
#
# This test:
#   1. Submits and merges a solution for Bounty C (different contributor)
#   2. Verifies leaderboard has correct counts, ordering, and actor types

# --------------------------------------------------
# 1. Get current bounty list — find Bounty C (index 4 after 2 seed bounties)
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Captures]
bounty_c_id: jsonpath "$[4].id"

# --------------------------------------------------
# 2. Verify Bounty C is open
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_c_id}}
HTTP 200
[Asserts]
jsonpath "$.status" == "open"
jsonpath "$.repoName" == "gamma"

# --------------------------------------------------
# 3. Submit solution for Bounty C (Contributor 2: 0x90F7...)
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 40,
    "title": "Implement notification system",
    "body": "Fixes #10\n\nFull implementation of notification system.\n\n<!-- bounty-wallet: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 -->",
    "state": "open",
    "merged": false,
    "head": {"sha": "notify111222333444", "ref": "feat/notifications"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/gamma",
    "name": "gamma",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 4. Poll until solution appears
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_c_id}}/solutions
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].prNumber" == 40
jsonpath "$[0].status" == "submitted"

# --------------------------------------------------
# 5. Merge PR #40 → Bounty C closes, Contributor 2 gets paid
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "closed",
  "pull_request": {
    "number": 40,
    "title": "Implement notification system",
    "body": "Fixes #10\n\nFull implementation of notification system.\n\n<!-- bounty-wallet: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 -->",
    "state": "closed",
    "merged": true,
    "head": {"sha": "notify111222333444", "ref": "feat/notifications"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/gamma",
    "name": "gamma",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 6. Poll until Bounty C closes
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_c_id}}
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$.status" == "closed"
jsonpath "$.amount" == "0"

# --------------------------------------------------
# 7. Verify leaderboard has entries for contributors + maintainer
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
[Options]
retry: 5
retry-interval: 1000
HTTP 200
[Asserts]
# After seed (1 completed) + 2 test-completed bounties:
#   - Seed Contributor 0x7099... (1 bounty, +10 rep)
#   - Contributor 0x3C44... (1 bounty, +10 rep)
#   - Contributor 0x90F7... (1 bounty, +10 rep)
#   - Maintainer oracle addr (3 bounties total)
jsonpath "$" count >= 4

# --------------------------------------------------
# 8. Verify at least one contributor and one maintainer exist
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
HTTP 200
[Asserts]
jsonpath "$[?(@.actorType == 'contributor')]" count >= 1
jsonpath "$[?(@.actorType == 'maintainer')]" count >= 1

# --------------------------------------------------
# 9. Verify active participants have non-zero stats
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
HTTP 200
[Asserts]
jsonpath "$[0].totalBounties" >= 1
jsonpath "$[0].totalPayout" != "0"
jsonpath "$[0].reputation" > 0

# --------------------------------------------------
# 10. Final state summary: verify all bounty statuses
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Asserts]
# Seed bounty 1: closed (pre-seeded)
jsonpath "$[0].status" == "closed"
# Seed bounty 2: open (pre-seeded)
jsonpath "$[1].status" == "open"
# Bounty A: closed (competing_solutions merged PR #20)
jsonpath "$[2].status" == "closed"
# Bounty B: open (PR closed without merge)
jsonpath "$[3].status" == "open"
# Bounty C: closed (we just merged PR #40)
jsonpath "$[4].status" == "closed"

# --------------------------------------------------
# 11. Solution for Bounty C is accepted
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_c_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$[0].status" == "accepted"
jsonpath "$[0].score" >= 0

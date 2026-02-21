# Full Bounty Lifecycle E2E Test
#
# This test walks through:
#   1. Empty bounty list
#   2. Issue labeled "bounty" -> bounty created on-chain
#   3. PR opened referencing the issue -> solution registered
#   4. PR merged -> payout processed, bounty closed
#   5. Leaderboard updated

# --------------------------------------------------
# 1. Initially no bounties exist
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Asserts]
jsonpath "$" count == 0

# --------------------------------------------------
# 2. Webhook: issue labeled "bounty"
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
{
  "action": "labeled",
  "label": {"name": "bounty"},
  "issue": {
    "number": 1,
    "title": "Test bounty issue",
    "body": "## Description\nTest bounty for E2E testing.\n\n### Requirements\n- Feature A\n- Feature B",
    "state": "open",
    "labels": [{"name": "bounty"}]
  },
  "repository": {
    "full_name": "test/repo",
    "name": "repo",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 3. Poll until bounty appears (oracle processes async)
# --------------------------------------------------
GET {{base_url}}/api/bounties
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].id" >= 0
jsonpath "$[0].repoOwner" == "test"
jsonpath "$[0].repoName" == "repo"
jsonpath "$[0].issueNumber" == 1
jsonpath "$[0].status" == "open"

# --------------------------------------------------
# 4. Capture bounty ID, then verify single-bounty endpoint
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Captures]
bounty_id: jsonpath "$[0].id"

GET {{base_url}}/api/bounties/{{bounty_id}}
HTTP 200
[Asserts]
jsonpath "$.status" == "open"
jsonpath "$.issueNumber" == 1
jsonpath "$.estimatedComplexity" >= 1
jsonpath "$.solutionCount" == 0

# --------------------------------------------------
# 5. No solutions yet
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 0

# --------------------------------------------------
# 6. Webhook: PR opened referencing issue #1
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 10,
    "title": "Fix issue #1",
    "body": "Fixes #1\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
    "state": "open",
    "merged": false,
    "head": {"sha": "abc123def456", "ref": "fix/issue-1"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/repo",
    "name": "repo",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 7. Poll until solution is registered
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_id}}/solutions
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].contributor" matches /(?i)0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC/
jsonpath "$[0].prNumber" == 10
jsonpath "$[0].status" == "submitted"

# --------------------------------------------------
# 8. Bounty now has solutionCount == 1
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_id}}
HTTP 200
[Asserts]
jsonpath "$.solutionCount" == 1

# Capture the current amount before merge for later comparison
GET {{base_url}}/api/bounties/{{bounty_id}}
HTTP 200
[Captures]
pre_merge_amount: jsonpath "$.amount"

# --------------------------------------------------
# 9. Webhook: PR merged
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "closed",
  "pull_request": {
    "number": 10,
    "title": "Fix issue #1",
    "body": "Fixes #1\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
    "state": "closed",
    "merged": true,
    "head": {"sha": "abc123def456", "ref": "fix/issue-1"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/repo",
    "name": "repo",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 10. Poll until bounty is closed and paid out
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_id}}
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$.status" == "closed"
jsonpath "$.amount" == "0"

# --------------------------------------------------
# 11. Solution is now accepted
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$[0].status" == "accepted"

# --------------------------------------------------
# 12. Leaderboard has entries
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
[Options]
retry: 5
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count >= 1

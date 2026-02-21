# Competing Solutions E2E Test
#
# For Bounty A (test/alpha#1, created in multi_bounty.hurl):
#   - Contributor 1 (0x3C44...) submits PR #20
#   - Contributor 2 (0x90F7...) submits PR #21
#   - PR #20 gets merged → Contributor 1 wins
#   - Bounty closes, Contributor 2's solution stays "submitted"

# --------------------------------------------------
# 1. Get bounty list and find Bounty A (test/alpha, index 2 after 2 seed bounties)
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Asserts]
jsonpath "$" count >= 5
[Captures]
bounty_a_id: jsonpath "$[2].id"

# --------------------------------------------------
# 2. Verify Bounty A is open with 0 solutions
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}
HTTP 200
[Asserts]
jsonpath "$.status" == "open"
jsonpath "$.solutionCount" == 0
jsonpath "$.repoName" == "alpha"

# --------------------------------------------------
# 3. Contributor 1 submits PR #20 for Bounty A
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 20,
    "title": "Implement login page (approach 1)",
    "body": "Fixes #1\n\nUsing React-based login form.\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
    "state": "open",
    "merged": false,
    "head": {"sha": "aaa111bbb222ccc333", "ref": "fix/login-v1"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/alpha",
    "name": "alpha",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 4. Poll until solution 1 appears
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}/solutions
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].prNumber" == 20
jsonpath "$[0].status" == "submitted"
jsonpath "$[0].contributor" matches /(?i)0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC/

# --------------------------------------------------
# 5. Contributor 2 submits PR #21 for same bounty
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 21,
    "title": "Implement login page (approach 2)",
    "body": "Fixes #1\n\nUsing Vue-based login form.\n\n<!-- bounty-wallet: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 -->",
    "state": "open",
    "merged": false,
    "head": {"sha": "ddd444eee555fff666", "ref": "fix/login-v2"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/alpha",
    "name": "alpha",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 6. Poll until both solutions appear
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}/solutions
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count == 2
jsonpath "$[0].prNumber" == 20
jsonpath "$[1].prNumber" == 21
jsonpath "$[0].status" == "submitted"
jsonpath "$[1].status" == "submitted"

# --------------------------------------------------
# 7. Bounty now shows solutionCount == 2
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}
HTTP 200
[Asserts]
jsonpath "$.solutionCount" == 2
jsonpath "$.status" == "open"

# --------------------------------------------------
# 8. Merge PR #20 (Contributor 1 wins)
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "closed",
  "pull_request": {
    "number": 20,
    "title": "Implement login page (approach 1)",
    "body": "Fixes #1\n\nUsing React-based login form.\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
    "state": "closed",
    "merged": true,
    "head": {"sha": "aaa111bbb222ccc333", "ref": "fix/login-v1"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/alpha",
    "name": "alpha",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 9. Poll until bounty closes
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$.status" == "closed"
jsonpath "$.amount" == "0"
jsonpath "$.closedAt" > 0

# --------------------------------------------------
# 10. Verify solution statuses: #20 accepted, #21 still submitted
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 2
jsonpath "$[0].status" == "accepted"
jsonpath "$[0].prNumber" == 20
jsonpath "$[0].score" >= 0
jsonpath "$[1].status" == "submitted"
jsonpath "$[1].prNumber" == 21

# --------------------------------------------------
# 11. Leaderboard has at least 1 entry
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
[Options]
retry: 5
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count >= 1

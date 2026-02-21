# PR Closed Without Merge — No Payout Test
#
# Uses Bounty B (test/beta#5) which is still open.
# Submits a solution, then closes the PR WITHOUT merging.
# Verifies the bounty remains open and the solution stays "submitted".

# --------------------------------------------------
# 1. Find Bounty B (test/beta, index 3 after 2 seed bounties)
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Captures]
bounty_b_id: jsonpath "$[3].id"

# --------------------------------------------------
# 2. Verify Bounty B is open
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_b_id}}
HTTP 200
[Asserts]
jsonpath "$.status" == "open"
jsonpath "$.repoName" == "beta"
[Captures]
amount_before: jsonpath "$.amount"

# --------------------------------------------------
# 3. Submit a solution for Bounty B (Contributor 3: 0x15d3...)
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 30,
    "title": "Implement search feature",
    "body": "Fixes #5\n\nAdded full text search.\n\n<!-- bounty-wallet: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 -->",
    "state": "open",
    "merged": false,
    "head": {"sha": "search111222333444", "ref": "feat/search"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/beta",
    "name": "beta",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 4. Poll until solution appears
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_b_id}}/solutions
[Options]
retry: 20
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].prNumber" == 30
jsonpath "$[0].status" == "submitted"

# --------------------------------------------------
# 5. Close PR #30 WITHOUT merging
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "closed",
  "pull_request": {
    "number": 30,
    "title": "Implement search feature",
    "body": "Fixes #5\n\nAdded full text search.\n\n<!-- bounty-wallet: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 -->",
    "state": "closed",
    "merged": false,
    "head": {"sha": "search111222333444", "ref": "feat/search"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/beta",
    "name": "beta",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 6. Wait, then verify bounty is STILL open with original amount
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_b_id}}
[Options]
retry: 3
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$.status" == "open"
jsonpath "$.amount" == {{amount_before}}
jsonpath "$.closedAt" == 0

# --------------------------------------------------
# 7. Solution stays "submitted" (not accepted, not rejected)
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_b_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].status" == "submitted"

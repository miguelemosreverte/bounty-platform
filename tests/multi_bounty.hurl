# Multi-Bounty Creation E2E Test
#
# Creates 3 bounties from different repos and issues:
#   Bounty A: test/alpha#1  (short description  → low complexity)
#   Bounty B: test/beta#5   (medium description → medium complexity)
#   Bounty C: test/gamma#10 (long description   → higher complexity)
#
# Then verifies the list and detail endpoints.

# --------------------------------------------------
# 1. Verify seeded state (2 pre-existing bounties from seed script)
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Asserts]
jsonpath "$" count == 2

# --------------------------------------------------
# 2. Create Bounty A: test/alpha issue #1 (short body)
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
{
  "action": "labeled",
  "label": {"name": "bounty"},
  "issue": {
    "number": 1,
    "title": "Add login page",
    "body": "## Description\nWe need a login page.",
    "state": "open",
    "labels": [{"name": "bounty"}]
  },
  "repository": {
    "full_name": "test/alpha",
    "name": "alpha",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 3. Create Bounty B: test/beta issue #5 (medium body)
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
{
  "action": "labeled",
  "label": {"name": "bounty"},
  "issue": {
    "number": 5,
    "title": "Implement search functionality",
    "body": "## Description\nWe need full text search across all resources.\n\n### Requirements\n- Search by title and description\n- Support filtering by date range\n- Show results ranked by relevance\n- Highlight matching terms in results\n- Support pagination of search results\n\n### Acceptance Criteria\n- Search returns results within 200ms\n- Works with 10000+ documents",
    "state": "open",
    "labels": [{"name": "bounty"}]
  },
  "repository": {
    "full_name": "test/beta",
    "name": "beta",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 4. Create Bounty C: test/gamma issue #10 (long body)
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
{
  "action": "labeled",
  "label": {"name": "bounty"},
  "issue": {
    "number": 10,
    "title": "Build real-time notification system",
    "body": "## Description\nImplement a comprehensive real-time notification system that supports multiple delivery channels.\n\n### Requirements\n- WebSocket-based real-time push notifications\n- Email notification delivery for offline users\n- In-app notification center with read/unread status\n- Notification preferences per user per channel\n- Rate limiting to prevent notification spam\n- Support for notification templates\n- Batch notification delivery for digest mode\n- Priority levels (critical, high, normal, low)\n\n### Technical Details\n- Use Redis pub/sub for inter-service notification distribution\n- Implement exponential backoff for failed email deliveries\n- Store notification history for 90 days\n- Support rich content (markdown, links, images) in notifications\n\n### Acceptance Criteria\n- Notifications delivered within 500ms of trigger event\n- System handles 10000 concurrent WebSocket connections\n- Email delivery rate above 99 percent\n- User can configure preferences per notification type\n- Admin dashboard shows delivery analytics",
    "state": "open",
    "labels": [{"name": "bounty"}]
  },
  "repository": {
    "full_name": "test/gamma",
    "name": "gamma",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 5. Poll until all 5 bounties appear (2 seed + 3 new)
# --------------------------------------------------
GET {{base_url}}/api/bounties
[Options]
retry: 30
retry-interval: 1000
HTTP 200
[Asserts]
jsonpath "$" count == 5

# --------------------------------------------------
# 6. Capture the three NEW bounty IDs (indices 2-4, after 2 seed bounties)
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Captures]
bounty_a_id: jsonpath "$[2].id"
bounty_b_id: jsonpath "$[3].id"
bounty_c_id: jsonpath "$[4].id"

# --------------------------------------------------
# 7. Verify Bounty A details (test/alpha#1)
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{bounty_a_id}}
jsonpath "$.repoOwner" == "test"
jsonpath "$.repoName" == "alpha"
jsonpath "$.issueNumber" == 1
jsonpath "$.status" == "open"
jsonpath "$.solutionCount" == 0
jsonpath "$.estimatedComplexity" >= 1
jsonpath "$.maintainer" matches /^0x[0-9a-fA-F]{40}$/
jsonpath "$.prdHash" != ""
jsonpath "$.qaHash" != ""
jsonpath "$.amount" != "0"
jsonpath "$.createdAt" > 0
jsonpath "$.closedAt" == 0

# --------------------------------------------------
# 8. Verify Bounty B details (test/beta#5)
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_b_id}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{bounty_b_id}}
jsonpath "$.repoOwner" == "test"
jsonpath "$.repoName" == "beta"
jsonpath "$.issueNumber" == 5
jsonpath "$.status" == "open"
jsonpath "$.solutionCount" == 0
jsonpath "$.estimatedComplexity" >= 1
jsonpath "$.amount" != "0"
jsonpath "$.createdAt" > 0

# --------------------------------------------------
# 9. Verify Bounty C details (test/gamma#10)
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_c_id}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{bounty_c_id}}
jsonpath "$.repoOwner" == "test"
jsonpath "$.repoName" == "gamma"
jsonpath "$.issueNumber" == 10
jsonpath "$.status" == "open"
jsonpath "$.solutionCount" == 0
jsonpath "$.estimatedComplexity" >= 1
jsonpath "$.amount" != "0"

# --------------------------------------------------
# 10. All bounties have zero solutions initially
# --------------------------------------------------
GET {{base_url}}/api/bounties/{{bounty_a_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 0

GET {{base_url}}/api/bounties/{{bounty_b_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 0

GET {{base_url}}/api/bounties/{{bounty_c_id}}/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 0

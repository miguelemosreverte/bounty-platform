# Webhook Error & Edge Case Tests
#
# These tests verify that the webhook endpoint correctly handles
# malformed, incomplete, and irrelevant payloads without creating
# any on-chain artifacts.

# --------------------------------------------------
# 1. Missing X-GitHub-Event header returns 400
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
{"action": "labeled"}
HTTP 400

# --------------------------------------------------
# 2. Malformed JSON body returns 400
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
```
not json at all
```
HTTP 400

# --------------------------------------------------
# 3. Issue labeled with NON-bounty label ("bug") — accepted but ignored
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
{
  "action": "labeled",
  "label": {"name": "bug"},
  "issue": {
    "number": 900,
    "title": "A bug report",
    "body": "Something is broken",
    "state": "open",
    "labels": [{"name": "bug"}]
  },
  "repository": {
    "full_name": "test/ignored",
    "name": "ignored",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 4. Issue event with action "opened" (not "labeled") — accepted but ignored
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
{
  "action": "opened",
  "issue": {
    "number": 901,
    "title": "New issue",
    "body": "Some issue body",
    "state": "open",
    "labels": []
  },
  "repository": {
    "full_name": "test/ignored",
    "name": "ignored",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 5. PR opened with NO issue reference — accepted but no solution created
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 900,
    "title": "Random PR",
    "body": "This PR does not reference any issue.\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
    "state": "open",
    "merged": false,
    "head": {"sha": "deadbeef12345678", "ref": "feature/random"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/ignored",
    "name": "ignored",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 6. PR opened with issue reference but NO wallet address — accepted but no solution
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 901,
    "title": "Fix issue 1",
    "body": "Fixes #1\n\nNo wallet address here.",
    "state": "open",
    "merged": false,
    "head": {"sha": "cafebabe12345678", "ref": "fix/no-wallet"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/ignored",
    "name": "ignored",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 7. PR opened referencing non-existent bounty issue — accepted but ignored
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "opened",
  "pull_request": {
    "number": 902,
    "title": "Fix issue 9999",
    "body": "Fixes #9999\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
    "state": "open",
    "merged": false,
    "head": {"sha": "00112233aabbccdd", "ref": "fix/nonexistent"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/ignored",
    "name": "ignored",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 8. PR closed but NOT merged — accepted but no payout
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: pull_request
{
  "action": "closed",
  "pull_request": {
    "number": 903,
    "title": "Abandoned PR",
    "body": "Fixes #1\n\n<!-- bounty-wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC -->",
    "state": "closed",
    "merged": false,
    "head": {"sha": "aabbccdd11223344", "ref": "fix/abandoned"},
    "diff_url": "",
    "html_url": ""
  },
  "repository": {
    "full_name": "test/ignored",
    "name": "ignored",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 9. Unknown event type ("push") — accepted but ignored
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: push
{
  "action": "completed",
  "repository": {
    "full_name": "test/ignored",
    "name": "ignored",
    "owner": {"login": "test"}
  }
}
HTTP 200

# --------------------------------------------------
# 10. Verify no NEW bounties were created by any of the above
#     (only the 2 seeded bounties should exist)
# --------------------------------------------------
GET {{base_url}}/api/bounties
[Options]
retry: 3
retry-interval: 500
HTTP 200
[Asserts]
jsonpath "$" count == 2

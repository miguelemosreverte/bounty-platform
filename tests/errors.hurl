# Error Handling E2E Tests

# --------------------------------------------------
# 1. Non-existent bounty returns a zero-value response (no on-chain data)
# --------------------------------------------------
GET {{base_url}}/api/bounties/999
HTTP 200
[Asserts]
jsonpath "$.id" == 0

# --------------------------------------------------
# 2. Invalid (non-numeric) bounty ID returns 400
# --------------------------------------------------
GET {{base_url}}/api/bounties/abc
HTTP 400
[Asserts]
jsonpath "$.error" == "invalid id"

# --------------------------------------------------
# 3. Webhook without X-GitHub-Event header returns 400
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
{}
HTTP 400

# --------------------------------------------------
# 4. Webhook with invalid JSON body returns 400
# --------------------------------------------------
POST {{base_url}}/api/webhook/github
Content-Type: application/json
X-GitHub-Event: issues
```
not valid json
```
HTTP 400

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
# 3. Invalid (non-numeric) solution bounty ID returns 400
# --------------------------------------------------
GET {{base_url}}/api/bounties/abc/solutions
HTTP 400
[Asserts]
jsonpath "$.error" == "invalid id"

# --------------------------------------------------
# 4. Negative bounty ID returns 400
# --------------------------------------------------
GET {{base_url}}/api/bounties/-1
HTTP 400
[Asserts]
jsonpath "$.error" == "invalid id"

# --------------------------------------------------
# 5. Very large bounty ID returns zero-value response
# --------------------------------------------------
GET {{base_url}}/api/bounties/999999999
HTTP 200
[Asserts]
jsonpath "$.id" == 0

# --------------------------------------------------
# 6. Solutions for non-existent bounty returns empty array
# --------------------------------------------------
GET {{base_url}}/api/bounties/999/solutions
HTTP 200
[Asserts]
jsonpath "$" count == 0

# --------------------------------------------------
# 7. Leaderboard returns seeded entries
# --------------------------------------------------
GET {{base_url}}/api/leaderboard
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$" count >= 2

# --------------------------------------------------
# 8. Bounties list returns seeded bounties
# --------------------------------------------------
GET {{base_url}}/api/bounties
HTTP 200
[Asserts]
jsonpath "$" count >= 2

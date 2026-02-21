# Health & Addresses E2E Tests

# --------------------------------------------------
# 1. Health endpoint returns ok with chain info
# --------------------------------------------------
GET {{base_url}}/api/health
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.status" == "ok"
jsonpath "$.chainId" == "31337"
jsonpath "$.oracle" matches /^0x[0-9a-fA-F]{40}$/

# --------------------------------------------------
# 2. Addresses endpoint returns deployed contracts
# --------------------------------------------------
GET {{base_url}}/api/addresses
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.bountyPlatform" matches /^0x[0-9a-fA-F]{40}$/
jsonpath "$.leaderboard" matches /^0x[0-9a-fA-F]{40}$/
jsonpath "$.oracle" matches /^0x[0-9a-fA-F]{40}$/

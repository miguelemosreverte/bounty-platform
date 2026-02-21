# Implementation Plan: MCP + Trade Protocol Pivot

## Context

The platform is pivoting from a **GitHub PR-centric bounty workflow** to an **MCP-first, agent-native marketplace**. The key shifts:

1. **MCP replaces PRs** — AI tools (Claude Code, Cursor) interact with the hive via MCP, not GitHub PRs
2. **Trade protocol** — Effort-for-effort token exchange bootstraps the marketplace without cash
3. **Agents as first-class citizens** — Bots discover tasks, claim them, submit solutions, earn tokens/ETH
4. **Humans can still create tasks** — But the primary interaction mode is AI-to-platform via MCP

### What's Being Replaced

```
OLD: GitHub issue labeled "bounty" → webhook → Oracle creates bounty on-chain
     PR opened with "Fixes #N" → webhook → Oracle submits solution
     PR merged → webhook → Oracle accepts + pays

NEW: Human/AI creates task via API/MCP → task enters the hive
     AI agent discovers task via MCP → claims it → submits solution (code patch)
     Adversarial AI review validates → escrow releases tokens/ETH
```

### What Stays Unchanged
- Smart contract escrow (BountyPlatform.sol) — core payment rail
- On-chain reputation (Leaderboard.sol) — trust layer
- AI agent plugins (PRD, Estimator, QA, Reviewer) — quality infrastructure
- SQLite cache + chain-as-source-of-truth pattern
- Backoffice dashboard structure (adapted content)
- Go backend + Next.js frontend stack

---

## Phase 1: MCP Server + Task API (Core Infrastructure)

### 1.1 — MCP Server (`backend/internal/mcp/`)

Create an MCP (Model Context Protocol) server that Claude Code, Cursor, and other AI tools can connect to. MCP is a JSON-RPC protocol over stdio/SSE.

**New files:**
```
backend/internal/mcp/
├── server.go          # MCP server (JSON-RPC handler, tool registration)
├── tools.go           # Tool definitions (list_tasks, claim_task, submit_solution, etc.)
├── transport_stdio.go # stdio transport for local connections
└── transport_sse.go   # SSE transport for remote connections
```

**MCP Tools to expose:**

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tasks` | Browse available tasks in the hive | `status`, `language`, `complexity_max`, `limit` |
| `get_task` | Get full task details (requirements, QA criteria) | `task_id` |
| `claim_task` | Reserve a task for your agent | `task_id`, `agent_id` |
| `submit_solution` | Submit a code patch/diff as a solution | `task_id`, `patch` (unified diff), `description` |
| `get_feedback` | Get AI review feedback on a submission | `submission_id` |
| `resubmit_solution` | Iterate on a submission after feedback | `submission_id`, `patch`, `description` |
| `my_status` | Check agent's balance (tokens + ETH), reputation, active claims | `agent_id` |
| `create_task` | Post a task to the hive (human or agent) | `title`, `description`, `repo_url`, `reward_type` (`token`/`eth`), `reward_amount` |

**MCP Resources to expose:**

| Resource | Description |
|----------|-------------|
| `hive://tasks` | Live task feed |
| `hive://leaderboard` | Current rankings |
| `hive://agent/{id}` | Agent profile and stats |

**How agents connect:**
- **Local (Claude Code):** `claude mcp add gitbusters -- ./gitbusters-mcp` (stdio)
- **Remote (Cursor, web agents):** SSE endpoint at `GET /mcp/sse`

### 1.2 — Task Model (replaces PR-centric bounty)

The current `Bounty` model is tightly coupled to GitHub (repoOwner, repoName, issueNumber, prNumber). The new `Task` model decouples from GitHub while remaining compatible with the existing on-chain bounty.

**Changes to `backend/internal/models/models.go`:**

```go
// Task is the new primary unit of work (maps to on-chain Bounty)
type Task struct {
    ID                  uint64    `json:"id"`
    Creator             string    `json:"creator"`             // ETH address or agent ID
    Title               string    `json:"title"`
    Description         string    `json:"description"`
    RepoURL             string    `json:"repoUrl,omitempty"`   // optional GitHub link
    PRDHash             string    `json:"prdHash"`
    QAHash              string    `json:"qaHash"`
    RewardType          string    `json:"rewardType"`          // "token" | "eth"
    RewardAmount        string    `json:"rewardAmount"`        // tokens or wei
    EstimatedComplexity uint64    `json:"estimatedComplexity"`
    Language            string    `json:"language,omitempty"`   // primary language
    Tags                []string  `json:"tags,omitempty"`
    Status              string    `json:"status"`              // "open" | "claimed" | "review" | "closed" | "cancelled"
    ClaimedBy           string    `json:"claimedBy,omitempty"` // agent that claimed it
    SolutionCount       uint64    `json:"solutionCount"`
    CreatedAt           uint64    `json:"createdAt"`
    ClosedAt            uint64    `json:"closedAt"`
    OnChainBountyID     *uint64   `json:"onChainBountyId,omitempty"` // link to BountyPlatform.sol
}

// Submission replaces Solution (no PR dependency)
type Submission struct {
    ID           uint64 `json:"id"`
    TaskID       uint64 `json:"taskId"`
    AgentID      string `json:"agentId"`          // submitter
    Patch        string `json:"patch"`            // unified diff
    Description  string `json:"description"`
    ReviewScore  uint8  `json:"reviewScore"`      // 0-100
    ReviewNotes  string `json:"reviewNotes"`      // AI feedback
    Status       string `json:"status"`           // "submitted" | "reviewing" | "feedback" | "accepted" | "rejected"
    SubmittedAt  uint64 `json:"submittedAt"`
    ReviewedAt   uint64 `json:"reviewedAt,omitempty"`
}
```

**SQLite schema additions** (`backend/internal/storage/sqlite.go`):

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    creator             TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    repo_url            TEXT DEFAULT '',
    prd_hash            TEXT DEFAULT '',
    qa_hash             TEXT DEFAULT '',
    reward_type         TEXT NOT NULL DEFAULT 'token',
    reward_amount       TEXT NOT NULL DEFAULT '0',
    estimated_complexity INTEGER DEFAULT 0,
    language            TEXT DEFAULT '',
    tags                TEXT DEFAULT '[]',
    status              TEXT DEFAULT 'open',
    claimed_by          TEXT DEFAULT '',
    solution_count      INTEGER DEFAULT 0,
    created_at          INTEGER DEFAULT 0,
    closed_at           INTEGER DEFAULT 0,
    on_chain_bounty_id  INTEGER
);

CREATE TABLE IF NOT EXISTS submissions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id      INTEGER NOT NULL,
    agent_id     TEXT NOT NULL,
    patch        TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    review_score INTEGER DEFAULT 0,
    review_notes TEXT DEFAULT '',
    status       TEXT DEFAULT 'submitted',
    submitted_at INTEGER DEFAULT 0,
    reviewed_at  INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
```

### 1.3 — New API Endpoints (`backend/internal/api/`)

Add task/submission REST endpoints alongside existing bounty endpoints (backward compatible).

```
POST   /api/tasks                    → CreateTask (human or agent)
GET    /api/tasks                    → ListTasks (filterable)
GET    /api/tasks/{id}               → GetTask
POST   /api/tasks/{id}/claim         → ClaimTask (agent reserves it)
POST   /api/tasks/{id}/submissions   → SubmitSolution (patch-based)
GET    /api/tasks/{id}/submissions   → ListSubmissions
GET    /api/submissions/{id}         → GetSubmission (with review feedback)
POST   /api/submissions/{id}/resubmit → Resubmit after feedback

GET    /mcp/sse                      → MCP SSE transport endpoint
```

The existing `/api/bounties` endpoints stay for backward compatibility but are marked as legacy.

### 1.4 — Agent Registration (`backend/internal/models/`)

```go
type Agent struct {
    ID          string   `json:"id"`            // ETH address or generated ID
    Name        string   `json:"name"`
    Source      string   `json:"source"`        // "mcp" | "moltbook" | "direct" | "referral"
    Recruiter   string   `json:"recruiter,omitempty"` // agent that recruited them
    Model       string   `json:"model,omitempty"`     // "claude-4", "gpt-4", etc.
    CareerPath  string   `json:"careerPath"`    // "developer" | "reviewer" | "prd" | "escrow" | "evangelist"
    Status      string   `json:"status"`        // "active" | "dormant" | "expired"
    TokenBalance int64   `json:"tokenBalance"`  // trade protocol tokens
    TotalEarned  int64   `json:"totalEarned"`
    TotalSpent   int64   `json:"totalSpent"`
    TasksCompleted uint64 `json:"tasksCompleted"`
    SuccessRate    float64 `json:"successRate"`
    Reputation     int64  `json:"reputation"`
    RegisteredAt   uint64 `json:"registeredAt"`
    LastActiveAt   uint64 `json:"lastActiveAt"`
}
```

```sql
CREATE TABLE IF NOT EXISTS agents (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL DEFAULT '',
    source          TEXT DEFAULT 'direct',
    recruiter       TEXT DEFAULT '',
    model           TEXT DEFAULT '',
    career_path     TEXT DEFAULT 'developer',
    status          TEXT DEFAULT 'active',
    token_balance   INTEGER DEFAULT 0,
    total_earned    INTEGER DEFAULT 0,
    total_spent     INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    success_rate    REAL DEFAULT 0.0,
    reputation      INTEGER DEFAULT 0,
    registered_at   INTEGER DEFAULT 0,
    last_active_at  INTEGER DEFAULT 0
);
```

**Agent API endpoints:**
```
POST   /api/agents/register     → RegisterAgent
GET    /api/agents/{id}         → GetAgent
GET    /api/agents              → ListAgents (leaderboard-style)
```

---

## Phase 2: Trade Protocol (Token Economy)

### 2.1 — Token Ledger

The trade protocol uses an internal token system (not an ERC-20 initially — avoid regulatory complexity). Tokens are tracked in SQLite with double-entry bookkeeping.

```sql
CREATE TABLE IF NOT EXISTS token_ledger (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    from_agent  TEXT NOT NULL,       -- '' for system mint
    to_agent    TEXT NOT NULL,
    amount      INTEGER NOT NULL,
    reason      TEXT NOT NULL,       -- "task_completion" | "task_creation" | "system_grant" | "referral_bonus"
    task_id     INTEGER,
    created_at  INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ledger_to ON token_ledger(to_agent);
CREATE INDEX IF NOT EXISTS idx_ledger_from ON token_ledger(from_agent);
```

**Token flow:**
1. New agent registration → system grants 100 starter tokens
2. Agent completes a token-reward task → earns `reward_amount` tokens
3. Task creator spends tokens when task is accepted → deducted from balance
4. Referral bonus → recruiter earns 10% of recruited agent's first 10 task completions

**Backend logic** (`backend/internal/trade/`):
```
backend/internal/trade/
├── protocol.go    # Token transfer logic, balance checks, double-entry
└── rewards.go     # Reward calculation, referral bonuses
```

### 2.2 — Quality Gate (Adversarial Review)

The review pipeline stays but shifts from PR-merge-triggered to submission-triggered:

```
Submission received
  → QA Agent validates patch against task's QA criteria
  → Reviewer Agent scores the code (0-100)
  → If score >= 70: accepted → tokens/ETH released
  → If score < 70: feedback returned → agent can resubmit
  → Max 3 resubmissions per claim
```

**Changes to Oracle** (`backend/internal/oracle/oracle.go`):
- Add `HandleSubmission()` method (not tied to GitHub webhook)
- Keep `HandleEvent()` for legacy GitHub webhook compatibility
- New `ReviewSubmission()` that runs QA + Reviewer agents on a patch

### 2.3 — Subscription Tiers

```go
type SubscriptionTier string
const (
    TierTrade      SubscriptionTier = "trade"      // Free — token-only
    TierBoost      SubscriptionTier = "boost"      // $50/mo — priority queue
    TierSwarm      SubscriptionTier = "swarm"      // $200/mo — dedicated allocation
    TierEnterprise SubscriptionTier = "enterprise"  // Custom
)
```

Tiers affect task queue priority and hive attention, stored per-agent in the agents table.

---

## Phase 3: Frontend Adaptation

### 3.1 — Landing Page Updates (`frontend/src/app/page.tsx`)

- Replace "bounty" language with "task" / "hive" language
- Update hero section: emphasis on AI agents and the trade protocol
- New value proposition cards:
  - "Connect your AI → Tasks get done while you sleep"
  - "Trade protocol → Your bots help others, others' bots help you"
  - "Adversarial quality → Every solution reviewed by independent AI"
- Add MCP connection CTA: "Connect Claude Code" with setup instructions

### 3.2 — New "Connect" Page (`frontend/src/app/(public)/connect/page.tsx`)

MCP setup guide:
```
1. Install GitBusters MCP server: npm install -g @gitbusters/mcp
2. Connect to Claude Code: claude mcp add gitbusters -- gitbusters-mcp
3. Or connect to Cursor: Add SSE endpoint in Cursor settings
4. Your AI can now browse tasks, claim work, submit solutions
```

### 3.3 — Task Pages (replace Bounty pages)

- **`/tasks`** — Browse all hive tasks (replaces `/bounties`)
  - Filter by: reward type (token/ETH), language, complexity, status
  - Show task creator, claimed status, submission count

- **`/tasks/[id]`** — Task detail (replaces `/bounties/[id]`)
  - Full requirements (PRD)
  - QA criteria
  - Submissions with review status and scores
  - Remove "How to claim via PR" instructions
  - Add "Claim via MCP" instructions

### 3.4 — Dashboard Updates

**Developer dashboard:**
- Show token balance alongside ETH earnings
- Show tasks completed (not PRs merged)
- MCP connection status
- Active claims with review progress

**Maintainer dashboard:**
- "Create Task" form (title, description, repo URL, reward type/amount)
- Task lifecycle: Open → Claimed → In Review → Closed
- Remove PR-centric pipeline visualization

**Admin dashboard:**
- Agent overview (total registered, active, dormant, expired)
- Token economy metrics (total minted, circulating, velocity)
- Trade protocol health (tasks/day, completion rate, avg review score)

### 3.5 — Remove PR-Centric UI Elements

Files to update:
- Remove "Submit a PR with `Fixes #N`" instructions from bounty detail
- Remove PR number display from solutions
- Remove GitHub webhook setup instructions
- Remove "How to Claim" 4-step PR process from developer pages
- Replace with MCP-first instructions everywhere

---

## Phase 4: Deprecation & Migration

### 4.1 — GitHub Webhook (Keep but Demote)

The GitHub webhook handler is NOT deleted — it becomes one of several task sources:
- Webhook can still create tasks from labeled issues (backward compatible)
- But it's no longer the primary flow
- The PR-opened and PR-merged handlers become optional legacy mode

### 4.2 — API Versioning

```
/api/v1/tasks         → New task-centric API
/api/v1/submissions   → New submission API
/api/v1/agents        → Agent management
/api/v1/trade         → Token balance, transfers
/api/bounties         → Legacy (kept for compatibility, internally maps to tasks)
```

### 4.3 — Data Migration

Existing bounties in SQLite become tasks:
```sql
INSERT INTO tasks (id, creator, title, description, repo_url, reward_type, reward_amount, ...)
SELECT id, maintainer, 'Bounty #' || id, '', repo_owner || '/' || repo_name, 'eth', amount, ...
FROM bounties;
```

---

## File Change Summary

### New Files
```
backend/internal/mcp/server.go           # MCP JSON-RPC server
backend/internal/mcp/tools.go            # MCP tool definitions
backend/internal/mcp/transport_stdio.go  # stdio transport
backend/internal/mcp/transport_sse.go    # SSE transport
backend/internal/trade/protocol.go       # Token economy logic
backend/internal/trade/rewards.go        # Reward calculations
backend/cmd/mcp/main.go                  # MCP server binary entry point
frontend/src/app/(public)/connect/page.tsx   # MCP setup guide
frontend/src/app/(public)/tasks/page.tsx     # Task listing
frontend/src/app/(public)/tasks/[id]/page.tsx # Task detail
```

### Modified Files
```
backend/internal/models/models.go        # Add Task, Submission, Agent models
backend/internal/storage/sqlite.go       # Add tasks, submissions, agents, token_ledger tables
backend/internal/storage/store.go        # Add Store methods for new models
backend/internal/api/router.go           # Add task/submission/agent/MCP routes
backend/internal/api/handlers.go         # Add task/submission/agent handlers
backend/internal/oracle/oracle.go        # Add HandleSubmission(), decouple from webhook
backend/cmd/server/main.go              # Wire MCP transport, new routes
frontend/src/app/page.tsx               # Update landing page messaging
frontend/src/app/(backoffice)/developer/* # Update dashboards for tasks/tokens
frontend/src/app/(backoffice)/maintainer/* # Add task creation, update dashboard
frontend/src/app/(backoffice)/admin/*    # Add agent/token metrics
```

### Deprecated (not deleted)
```
backend/internal/github/webhook.go      # Kept as legacy task source
frontend/src/app/(public)/bounties/*    # Redirects to /tasks
```

---

## Implementation Order

```
Week 1-2: Phase 1.2 + 1.3 — Task model + REST API + SQLite schema
          (Get tasks working without MCP first — test via curl)

Week 2-3: Phase 1.4 + 2.1 — Agent registration + token ledger
          (Agents can register, earn/spend tokens)

Week 3-4: Phase 1.1 — MCP server
          (Wire MCP tools to the task/submission API)

Week 4-5: Phase 2.2 — Adversarial review pipeline
          (Submissions trigger AI review, feedback loop)

Week 5-6: Phase 3 — Frontend adaptation
          (Update UI: tasks, tokens, MCP connect, remove PR language)

Week 6-7: Phase 4 — Migration + cleanup
          (Migrate existing bounties to tasks, legacy redirects)
```

---

## Verification

After each phase:
1. `make backend-run` — server starts with new routes
2. `curl` task/submission/agent endpoints — CRUD works
3. MCP server connects via stdio — Claude Code can list/claim/submit
4. Token balances update correctly on task completion
5. Review pipeline triggers on submission (not on PR merge)
6. Frontend shows tasks (not bounties), token balances, MCP setup
7. Legacy `/api/bounties` still works (backward compatible)
8. `forge test` — smart contracts unchanged, all pass

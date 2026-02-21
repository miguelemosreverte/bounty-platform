package mcp

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/agents"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/trade"
)

// Server implements the MCP (Model Context Protocol) JSON-RPC interface.
// It exposes tools for AI agents to interact with the hive.
type Server struct {
	store    storage.Store
	agents   *agents.AgentSet
	trade    *trade.Protocol
}

func NewServer(store storage.Store, agentSet *agents.AgentSet, tp *trade.Protocol) *Server {
	return &Server{store: store, agents: agentSet, trade: tp}
}

// ── JSON-RPC types ──

type jsonRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type jsonRPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  any             `json:"result,omitempty"`
	Error   *rpcError       `json:"error,omitempty"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// ── MCP protocol types ──

type toolDef struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	InputSchema map[string]any `json:"inputSchema"`
}

type toolResult struct {
	Content []contentBlock `json:"content"`
	IsError bool           `json:"isError,omitempty"`
}

type contentBlock struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// RunStdio runs the MCP server over stdin/stdout (for claude mcp add).
func (s *Server) RunStdio() {
	reader := bufio.NewReader(os.Stdin)
	writer := os.Stdout

	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				return
			}
			log.Printf("MCP read error: %v", err)
			return
		}

		var req jsonRPCRequest
		if err := json.Unmarshal(line, &req); err != nil {
			continue
		}

		resp := s.handleRequest(&req)
		respBytes, _ := json.Marshal(resp)
		respBytes = append(respBytes, '\n')
		writer.Write(respBytes)
	}
}

func (s *Server) handleRequest(req *jsonRPCRequest) *jsonRPCResponse {
	switch req.Method {
	case "initialize":
		return s.handleInitialize(req)
	case "tools/list":
		return s.handleToolsList(req)
	case "tools/call":
		return s.handleToolsCall(req)
	default:
		// Notification or unsupported — return empty
		if req.ID == nil {
			return nil
		}
		return &jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &rpcError{Code: -32601, Message: "method not found: " + req.Method},
		}
	}
}

func (s *Server) handleInitialize(req *jsonRPCRequest) *jsonRPCResponse {
	return &jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]any{
			"protocolVersion": "2024-11-05",
			"capabilities": map[string]any{
				"tools": map[string]any{},
			},
			"serverInfo": map[string]any{
				"name":    "gitbusters-hive",
				"version": "1.0.0",
			},
		},
	}
}

func (s *Server) handleToolsList(req *jsonRPCRequest) *jsonRPCResponse {
	tools := []toolDef{
		{
			Name:        "list_tasks",
			Description: "Browse available tasks in the GitBusters hive. Returns open tasks that agents can claim and solve for token or ETH rewards.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"status":   map[string]any{"type": "string", "description": "Filter by status: open, claimed, review, closed. Default: open", "default": "open"},
					"language": map[string]any{"type": "string", "description": "Filter by programming language"},
					"limit":    map[string]any{"type": "number", "description": "Max results (default 20)", "default": 20},
				},
			},
		},
		{
			Name:        "get_task",
			Description: "Get full details of a task including requirements, QA criteria, and submission history.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"task_id": map[string]any{"type": "number", "description": "Task ID"},
				},
				"required": []string{"task_id"},
			},
		},
		{
			Name:        "claim_task",
			Description: "Claim a task to work on. The task will be reserved for your agent. You must submit a solution within a reasonable time.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"task_id":  map[string]any{"type": "number", "description": "Task ID to claim"},
					"agent_id": map[string]any{"type": "string", "description": "Your agent ID"},
				},
				"required": []string{"task_id", "agent_id"},
			},
		},
		{
			Name:        "submit_solution",
			Description: "Submit a code patch as a solution to a claimed task. The patch will be reviewed by an independent AI reviewer. If the score is >= 70, the solution is accepted and rewards are released.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"task_id":     map[string]any{"type": "number", "description": "Task ID"},
					"agent_id":    map[string]any{"type": "string", "description": "Your agent ID"},
					"patch":       map[string]any{"type": "string", "description": "Unified diff patch with your solution"},
					"description": map[string]any{"type": "string", "description": "Brief description of your approach"},
				},
				"required": []string{"task_id", "agent_id", "patch"},
			},
		},
		{
			Name:        "get_feedback",
			Description: "Get the review feedback on a submission, including score, summary, and specific improvement suggestions.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"submission_id": map[string]any{"type": "number", "description": "Submission ID"},
				},
				"required": []string{"submission_id"},
			},
		},
		{
			Name:        "my_status",
			Description: "Check your agent's token balance, reputation, completed tasks, and success rate.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"agent_id": map[string]any{"type": "string", "description": "Your agent ID"},
				},
				"required": []string{"agent_id"},
			},
		},
		{
			Name:        "create_task",
			Description: "Post a new task to the hive for other agents to solve. You can offer token or ETH rewards.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"title":         map[string]any{"type": "string", "description": "Task title"},
					"description":   map[string]any{"type": "string", "description": "Detailed description of what needs to be done"},
					"creator":       map[string]any{"type": "string", "description": "Your agent or wallet ID"},
					"repo_url":      map[string]any{"type": "string", "description": "Repository URL (optional)"},
					"reward_type":   map[string]any{"type": "string", "description": "token or eth", "default": "token"},
					"reward_amount": map[string]any{"type": "string", "description": "Amount of tokens or wei"},
					"language":      map[string]any{"type": "string", "description": "Primary programming language"},
					"tags":          map[string]any{"type": "array", "items": map[string]any{"type": "string"}, "description": "Tags for categorization"},
				},
				"required": []string{"title", "description", "creator"},
			},
		},
		{
			Name:        "register_agent",
			Description: "Register a new agent on the GitBusters hive. Receives starter tokens upon registration.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":          map[string]any{"type": "string", "description": "Unique agent ID (e.g., wallet address or username)"},
					"name":        map[string]any{"type": "string", "description": "Display name"},
					"model":       map[string]any{"type": "string", "description": "AI model being used (e.g., claude-4, gpt-4)"},
					"career_path": map[string]any{"type": "string", "description": "developer, reviewer, prd, escrow, or evangelist", "default": "developer"},
				},
				"required": []string{"id", "name"},
			},
		},
	}

	return &jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  map[string]any{"tools": tools},
	}
}

func (s *Server) handleToolsCall(req *jsonRPCRequest) *jsonRPCResponse {
	var call struct {
		Name      string         `json:"name"`
		Arguments map[string]any `json:"arguments"`
	}
	if err := json.Unmarshal(req.Params, &call); err != nil {
		return &jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &rpcError{Code: -32602, Message: "invalid params"},
		}
	}

	result := s.dispatchTool(call.Name, call.Arguments)
	return &jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  result,
	}
}

func (s *Server) dispatchTool(name string, args map[string]any) toolResult {
	switch name {
	case "list_tasks":
		return s.toolListTasks(args)
	case "get_task":
		return s.toolGetTask(args)
	case "claim_task":
		return s.toolClaimTask(args)
	case "submit_solution":
		return s.toolSubmitSolution(args)
	case "get_feedback":
		return s.toolGetFeedback(args)
	case "my_status":
		return s.toolMyStatus(args)
	case "create_task":
		return s.toolCreateTask(args)
	case "register_agent":
		return s.toolRegisterAgent(args)
	default:
		return errorResult("unknown tool: " + name)
	}
}

func errorResult(msg string) toolResult {
	return toolResult{
		Content: []contentBlock{{Type: "text", Text: msg}},
		IsError: true,
	}
}

func jsonResult(data any) toolResult {
	b, _ := json.MarshalIndent(data, "", "  ")
	return toolResult{
		Content: []contentBlock{{Type: "text", Text: string(b)}},
	}
}

func getStr(args map[string]any, key string) string {
	v, ok := args[key]
	if !ok {
		return ""
	}
	s, _ := v.(string)
	return s
}

func getNum(args map[string]any, key string) int {
	v, ok := args[key]
	if !ok {
		return 0
	}
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	}
	return 0
}

// ── Tool implementations ──

func (s *Server) toolListTasks(args map[string]any) toolResult {
	status := getStr(args, "status")
	if status == "" {
		status = "open"
	}
	language := getStr(args, "language")
	limit := getNum(args, "limit")
	if limit == 0 {
		limit = 20
	}

	tasks, err := s.store.ListTasks(status, language, limit)
	if err != nil {
		return errorResult("failed to list tasks: " + err.Error())
	}
	if tasks == nil {
		tasks = []*models.Task{}
	}
	return jsonResult(tasks)
}

func (s *Server) toolGetTask(args map[string]any) toolResult {
	taskID := uint64(getNum(args, "task_id"))
	if taskID == 0 {
		return errorResult("task_id is required")
	}

	task, err := s.store.GetTask(taskID)
	if err != nil {
		return errorResult("failed to get task: " + err.Error())
	}
	if task == nil {
		return errorResult("task not found")
	}

	subs, _ := s.store.ListSubmissions(taskID)
	return jsonResult(map[string]any{
		"task":        task,
		"submissions": subs,
	})
}

func (s *Server) toolClaimTask(args map[string]any) toolResult {
	taskID := uint64(getNum(args, "task_id"))
	agentID := getStr(args, "agent_id")
	if taskID == 0 || agentID == "" {
		return errorResult("task_id and agent_id are required")
	}

	task, err := s.store.GetTask(taskID)
	if err != nil || task == nil {
		return errorResult("task not found")
	}
	if task.Status != "open" {
		return errorResult("task is not open (status: " + task.Status + ")")
	}

	agent, err := s.store.GetAgent(agentID)
	if err != nil || agent == nil {
		return errorResult("agent not found — register first with register_agent")
	}

	task.Status = "claimed"
	task.ClaimedBy = agentID
	if err := s.store.UpdateTask(task); err != nil {
		return errorResult("failed to claim: " + err.Error())
	}

	agent.LastActiveAt = uint64(time.Now().Unix())
	_ = s.store.UpdateAgent(agent)

	return jsonResult(map[string]any{
		"message": fmt.Sprintf("Task #%d claimed by %s", taskID, agentID),
		"task":    task,
	})
}

func (s *Server) toolSubmitSolution(args map[string]any) toolResult {
	taskID := uint64(getNum(args, "task_id"))
	agentID := getStr(args, "agent_id")
	patch := getStr(args, "patch")
	desc := getStr(args, "description")

	if taskID == 0 || agentID == "" || patch == "" {
		return errorResult("task_id, agent_id, and patch are required")
	}

	task, err := s.store.GetTask(taskID)
	if err != nil || task == nil {
		return errorResult("task not found")
	}
	if task.Status != "claimed" && task.Status != "open" {
		return errorResult("task cannot accept submissions (status: " + task.Status + ")")
	}

	// Count attempts
	existing, _ := s.store.ListSubmissions(taskID)
	attempt := uint8(1)
	for _, sub := range existing {
		if sub.AgentID == agentID && sub.Attempt >= attempt {
			attempt = sub.Attempt + 1
		}
	}
	if attempt > 3 {
		return errorResult("max 3 submission attempts reached")
	}

	sub := &models.Submission{
		TaskID:      taskID,
		AgentID:     agentID,
		Patch:       patch,
		Description: desc,
		Status:      "submitted",
		Attempt:     attempt,
		SubmittedAt: uint64(time.Now().Unix()),
	}

	subID, err := s.store.CreateSubmission(sub)
	if err != nil {
		return errorResult("failed to create submission: " + err.Error())
	}
	sub.ID = subID

	task.Status = "review"
	task.SubmissionCount++
	if task.ClaimedBy == "" {
		task.ClaimedBy = agentID
	}
	_ = s.store.UpdateTask(task)

	// Run review synchronously for MCP (agent waits for result)
	s.reviewSubmission(sub, task)

	// Re-fetch to get updated status
	sub, _ = s.store.GetSubmission(subID)
	return jsonResult(sub)
}

func (s *Server) reviewSubmission(sub *models.Submission, task *models.Task) {
	sub.Status = "reviewing"
	_ = s.store.UpdateSubmission(sub)

	prd := &models.PRDOutput{
		Title:       task.Title,
		Description: task.Description,
		Hash:        task.PRDHash,
	}
	qa := &models.QAOutput{Hash: task.QAHash}

	review, err := s.agents.Reviewer.Review(prd, qa, sub.Patch)
	if err != nil {
		sub.Status = "feedback"
		sub.ReviewNotes = fmt.Sprintf("Review error: %v", err)
		sub.ReviewedAt = uint64(time.Now().Unix())
		_ = s.store.UpdateSubmission(sub)
		return
	}

	sub.ReviewScore = review.Score
	sub.ReviewNotes = review.Summary
	if review.Feedback != nil {
		sub.ReviewNotes += "\n\n" + strings.Join(review.Feedback, "\n")
	}
	sub.ReviewedAt = uint64(time.Now().Unix())

	switch review.Recommendation {
	case "accept":
		sub.Status = "accepted"
		_ = s.store.UpdateSubmission(sub)
		task.Status = "closed"
		task.ClosedAt = uint64(time.Now().Unix())
		_ = s.store.UpdateTask(task)
		if task.RewardType == "token" {
			amount, _ := strconv.ParseInt(task.RewardAmount, 10, 64)
			if amount > 0 {
				_ = s.trade.RewardCompletion(task.ID, sub.AgentID, amount)
			}
		}
	case "revise":
		sub.Status = "feedback"
		_ = s.store.UpdateSubmission(sub)
		task.Status = "claimed"
		_ = s.store.UpdateTask(task)
	default:
		sub.Status = "rejected"
		_ = s.store.UpdateSubmission(sub)
		task.Status = "open"
		task.ClaimedBy = ""
		_ = s.store.UpdateTask(task)
		_ = s.trade.RecordFailure(sub.AgentID)
	}
}

func (s *Server) toolGetFeedback(args map[string]any) toolResult {
	subID := uint64(getNum(args, "submission_id"))
	if subID == 0 {
		return errorResult("submission_id is required")
	}

	sub, err := s.store.GetSubmission(subID)
	if err != nil || sub == nil {
		return errorResult("submission not found")
	}
	return jsonResult(sub)
}

func (s *Server) toolMyStatus(args map[string]any) toolResult {
	agentID := getStr(args, "agent_id")
	if agentID == "" {
		return errorResult("agent_id is required")
	}

	agent, err := s.store.GetAgent(agentID)
	if err != nil || agent == nil {
		return errorResult("agent not found — register first with register_agent")
	}

	transfers, _ := s.store.GetTransfers(agentID, 10)
	return jsonResult(map[string]any{
		"agent":            agent,
		"recent_transfers": transfers,
	})
}

func (s *Server) toolCreateTask(args map[string]any) toolResult {
	title := getStr(args, "title")
	desc := getStr(args, "description")
	creator := getStr(args, "creator")

	if title == "" || desc == "" || creator == "" {
		return errorResult("title, description, and creator are required")
	}

	rewardType := getStr(args, "reward_type")
	if rewardType == "" {
		rewardType = "token"
	}
	rewardAmount := getStr(args, "reward_amount")
	if rewardAmount == "" {
		rewardAmount = "0"
	}

	var tags []string
	if t, ok := args["tags"]; ok {
		if arr, ok := t.([]any); ok {
			for _, v := range arr {
				if s, ok := v.(string); ok {
					tags = append(tags, s)
				}
			}
		}
	}

	task := &models.Task{
		Creator:      creator,
		Title:        title,
		Description:  desc,
		RepoURL:      getStr(args, "repo_url"),
		RewardType:   rewardType,
		RewardAmount: rewardAmount,
		Language:     getStr(args, "language"),
		Tags:         tags,
		Status:       "open",
		CreatedAt:    uint64(time.Now().Unix()),
	}

	// Run agents to enrich the task
	prd, err := s.agents.PRD.GeneratePRD(title, desc)
	if err == nil {
		task.PRDHash = prd.Hash
		task.Description = prd.Description

		est, err := s.agents.Estimator.Estimate(prd, task.RepoURL)
		if err == nil {
			task.EstimatedComplexity = est.Complexity
			if rewardAmount == "0" && rewardType == "token" {
				task.RewardAmount = fmt.Sprintf("%d", est.Complexity*10)
			}
		}

		qa, err := s.agents.QA.GenerateCriteria(prd)
		if err == nil {
			task.QAHash = qa.Hash
		}
	}

	id, err := s.store.CreateTask(task)
	if err != nil {
		return errorResult("failed to create task: " + err.Error())
	}
	task.ID = id

	return jsonResult(task)
}

func (s *Server) toolRegisterAgent(args map[string]any) toolResult {
	id := getStr(args, "id")
	name := getStr(args, "name")
	if id == "" || name == "" {
		return errorResult("id and name are required")
	}

	// Check if already exists
	existing, _ := s.store.GetAgent(id)
	if existing != nil {
		return jsonResult(map[string]any{
			"message": "agent already registered",
			"agent":   existing,
		})
	}

	careerPath := getStr(args, "career_path")
	if careerPath == "" {
		careerPath = "developer"
	}

	agent := &models.Agent{
		ID:           id,
		Name:         name,
		Source:       "mcp",
		Model:        getStr(args, "model"),
		CareerPath:   careerPath,
		Status:       "active",
		Tier:         "trade",
		RegisteredAt: uint64(time.Now().Unix()),
		LastActiveAt: uint64(time.Now().Unix()),
	}

	if err := s.store.RegisterAgent(agent); err != nil {
		return errorResult("registration failed: " + err.Error())
	}

	_ = s.trade.GrantStarter(agent.ID)
	agent, _ = s.store.GetAgent(agent.ID)

	return jsonResult(map[string]any{
		"message":        fmt.Sprintf("Welcome to the hive, %s! You've received %d starter tokens.", name, trade.StarterGrant),
		"agent":          agent,
	})
}

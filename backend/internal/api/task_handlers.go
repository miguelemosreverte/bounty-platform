package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/agents"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/storage"
	"github.com/miguelemosreverte/bounty-platform/backend/internal/trade"
)

// TaskHandlers serves the new task/submission/agent API.
type TaskHandlers struct {
	store  storage.Store
	agents *agents.AgentSet
	trade  *trade.Protocol
}

func NewTaskHandlers(store storage.Store, agentSet *agents.AgentSet, tp *trade.Protocol) *TaskHandlers {
	return &TaskHandlers{store: store, agents: agentSet, trade: tp}
}

// ── Task endpoints ──

func (h *TaskHandlers) CreateTask(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Creator     string   `json:"creator"`
		Title       string   `json:"title"`
		Description string   `json:"description"`
		RepoURL     string   `json:"repoUrl"`
		RewardType  string   `json:"rewardType"`
		RewardAmount string  `json:"rewardAmount"`
		Language    string   `json:"language"`
		Tags        []string `json:"tags"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title is required"})
		return
	}
	if req.Creator == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "creator is required"})
		return
	}
	if req.RewardType == "" {
		req.RewardType = "token"
	}
	if req.RewardAmount == "" {
		req.RewardAmount = "0"
	}

	task := &models.Task{
		Creator:     req.Creator,
		Title:       req.Title,
		Description: req.Description,
		RepoURL:     req.RepoURL,
		RewardType:  req.RewardType,
		RewardAmount: req.RewardAmount,
		Language:    req.Language,
		Tags:        req.Tags,
		Status:      "open",
		CreatedAt:   uint64(time.Now().Unix()),
	}

	// Run PRD + Estimator + QA agents on the task
	prd, err := h.agents.PRD.GeneratePRD(req.Title, req.Description)
	if err == nil {
		task.PRDHash = prd.Hash
		task.Description = prd.Description // enrich with structured PRD

		est, err := h.agents.Estimator.Estimate(prd, req.RepoURL)
		if err == nil {
			task.EstimatedComplexity = est.Complexity
			if req.RewardAmount == "0" && req.RewardType == "token" {
				// Auto-set token reward based on complexity
				task.RewardAmount = fmt.Sprintf("%d", est.Complexity*10)
			}
		}

		qa, err := h.agents.QA.GenerateCriteria(prd)
		if err == nil {
			task.QAHash = qa.Hash
		}
	}

	id, err := h.store.CreateTask(task)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	task.ID = id

	writeJSON(w, http.StatusCreated, task)
}

func (h *TaskHandlers) ListTasks(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	language := r.URL.Query().Get("language")
	limitStr := r.URL.Query().Get("limit")
	limit := 0
	if limitStr != "" {
		limit, _ = strconv.Atoi(limitStr)
	}

	tasks, err := h.store.ListTasks(status, language, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if tasks == nil {
		tasks = []*models.Task{}
	}
	writeJSON(w, http.StatusOK, tasks)
}

func (h *TaskHandlers) GetTask(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	task, err := h.store.GetTask(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if task == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
		return
	}
	writeJSON(w, http.StatusOK, task)
}

func (h *TaskHandlers) ClaimTask(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var req struct {
		AgentID string `json:"agentId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AgentID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "agentId is required"})
		return
	}

	task, err := h.store.GetTask(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if task == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
		return
	}
	if task.Status != "open" {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "task is not open"})
		return
	}

	// Verify agent exists
	agent, err := h.store.GetAgent(req.AgentID)
	if err != nil || agent == nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "agent not found"})
		return
	}

	task.Status = "claimed"
	task.ClaimedBy = req.AgentID
	if err := h.store.UpdateTask(task); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Update agent last active
	agent.LastActiveAt = uint64(time.Now().Unix())
	_ = h.store.UpdateAgent(agent)

	writeJSON(w, http.StatusOK, task)
}

// ── Submission endpoints ──

func (h *TaskHandlers) SubmitSolution(w http.ResponseWriter, r *http.Request) {
	taskID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid task id"})
		return
	}

	var req struct {
		AgentID     string `json:"agentId"`
		Patch       string `json:"patch"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.AgentID == "" || req.Patch == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "agentId and patch are required"})
		return
	}

	task, err := h.store.GetTask(taskID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if task == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "task not found"})
		return
	}
	if task.Status != "claimed" && task.Status != "open" {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "task is not claimable"})
		return
	}

	// Count existing submissions by this agent for attempt tracking
	existing, _ := h.store.ListSubmissions(taskID)
	attempt := uint8(1)
	for _, s := range existing {
		if s.AgentID == req.AgentID && s.Attempt >= attempt {
			attempt = s.Attempt + 1
		}
	}
	if attempt > 3 {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "max 3 attempts reached"})
		return
	}

	sub := &models.Submission{
		TaskID:      taskID,
		AgentID:     req.AgentID,
		Patch:       req.Patch,
		Description: req.Description,
		Status:      "submitted",
		Attempt:     attempt,
		SubmittedAt: uint64(time.Now().Unix()),
	}

	subID, err := h.store.CreateSubmission(sub)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	sub.ID = subID

	// Update task
	task.Status = "review"
	task.SubmissionCount++
	if task.ClaimedBy == "" {
		task.ClaimedBy = req.AgentID
	}
	_ = h.store.UpdateTask(task)

	// Run adversarial review asynchronously
	go h.reviewSubmission(sub, task)

	writeJSON(w, http.StatusCreated, sub)
}

func (h *TaskHandlers) reviewSubmission(sub *models.Submission, task *models.Task) {
	sub.Status = "reviewing"
	_ = h.store.UpdateSubmission(sub)

	prd := &models.PRDOutput{
		Title:       task.Title,
		Description: task.Description,
		Hash:        task.PRDHash,
	}
	qa := &models.QAOutput{Hash: task.QAHash}

	review, err := h.agents.Reviewer.Review(prd, qa, sub.Patch)
	if err != nil {
		sub.Status = "feedback"
		sub.ReviewNotes = fmt.Sprintf("Review failed: %v", err)
		sub.ReviewedAt = uint64(time.Now().Unix())
		_ = h.store.UpdateSubmission(sub)
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
		_ = h.store.UpdateSubmission(sub)

		// Close the task
		task.Status = "closed"
		task.ClosedAt = uint64(time.Now().Unix())
		_ = h.store.UpdateTask(task)

		// Token reward
		if task.RewardType == "token" {
			amount, _ := strconv.ParseInt(task.RewardAmount, 10, 64)
			if amount > 0 {
				_ = h.trade.RewardCompletion(task.ID, sub.AgentID, amount)
			}
		}

	case "revise":
		sub.Status = "feedback"
		_ = h.store.UpdateSubmission(sub)
		// Task stays in "review" — agent can resubmit
		task.Status = "claimed"
		_ = h.store.UpdateTask(task)

	default: // "reject"
		sub.Status = "rejected"
		_ = h.store.UpdateSubmission(sub)
		// Reopen task for others
		task.Status = "open"
		task.ClaimedBy = ""
		_ = h.store.UpdateTask(task)
		_ = h.trade.RecordFailure(sub.AgentID)
	}
}

func (h *TaskHandlers) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	taskID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid task id"})
		return
	}

	subs, err := h.store.ListSubmissions(taskID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if subs == nil {
		subs = []*models.Submission{}
	}
	writeJSON(w, http.StatusOK, subs)
}

func (h *TaskHandlers) GetSubmission(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	sub, err := h.store.GetSubmission(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if sub == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "submission not found"})
		return
	}
	writeJSON(w, http.StatusOK, sub)
}

// ── Agent endpoints ──

func (h *TaskHandlers) RegisterAgent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Source     string `json:"source"`
		Recruiter  string `json:"recruiter"`
		Model      string `json:"model"`
		CareerPath string `json:"careerPath"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.ID == "" || req.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id and name are required"})
		return
	}
	if req.Source == "" {
		req.Source = "direct"
	}
	if req.CareerPath == "" {
		req.CareerPath = "developer"
	}

	agent := &models.Agent{
		ID:           req.ID,
		Name:         req.Name,
		Source:       req.Source,
		Recruiter:    req.Recruiter,
		Model:        req.Model,
		CareerPath:   req.CareerPath,
		Status:       "active",
		Tier:         "trade",
		RegisteredAt: uint64(time.Now().Unix()),
		LastActiveAt: uint64(time.Now().Unix()),
	}

	if err := h.store.RegisterAgent(agent); err != nil {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "agent already exists or db error: " + err.Error()})
		return
	}

	// Grant starter tokens
	_ = h.trade.GrantStarter(agent.ID)

	// Re-fetch to get updated balance
	agent, _ = h.store.GetAgent(agent.ID)
	writeJSON(w, http.StatusCreated, agent)
}

func (h *TaskHandlers) GetAgent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	agent, err := h.store.GetAgent(id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if agent == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "agent not found"})
		return
	}
	writeJSON(w, http.StatusOK, agent)
}

func (h *TaskHandlers) ListAgents(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		limit, _ = strconv.Atoi(limitStr)
	}

	agents, err := h.store.ListAgents(limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if agents == nil {
		agents = []*models.Agent{}
	}
	writeJSON(w, http.StatusOK, agents)
}

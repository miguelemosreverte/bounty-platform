package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	_ "modernc.org/sqlite"

	"github.com/miguelemosreverte/bounty-platform/backend/internal/models"
)

type SQLiteStore struct {
	db *sql.DB
}

func NewSQLiteStore(dbPath string) (*SQLiteStore, error) {
	db, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}

	s := &SQLiteStore{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	log.Printf("SQLite store ready: %s", dbPath)
	return s, nil
}

func (s *SQLiteStore) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS bounties (
		id              INTEGER PRIMARY KEY,
		maintainer      TEXT    NOT NULL,
		repo_owner      TEXT    NOT NULL,
		repo_name       TEXT    NOT NULL,
		issue_number    INTEGER NOT NULL,
		prd_hash        TEXT    NOT NULL DEFAULT '',
		qa_hash         TEXT    NOT NULL DEFAULT '',
		amount          TEXT    NOT NULL DEFAULT '0',
		estimated_complexity INTEGER NOT NULL DEFAULT 0,
		status          TEXT    NOT NULL DEFAULT 'open',
		solution_count  INTEGER NOT NULL DEFAULT 0,
		created_at      INTEGER NOT NULL DEFAULT 0,
		closed_at       INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS solutions (
		id            INTEGER PRIMARY KEY,
		bounty_id     INTEGER NOT NULL,
		contributor   TEXT    NOT NULL,
		pr_number     INTEGER NOT NULL,
		commit_hash   TEXT    NOT NULL DEFAULT '',
		score         INTEGER NOT NULL DEFAULT 0,
		status        TEXT    NOT NULL DEFAULT 'submitted',
		submitted_at  INTEGER NOT NULL DEFAULT 0,
		FOREIGN KEY (bounty_id) REFERENCES bounties(id)
	);
	CREATE INDEX IF NOT EXISTS idx_solutions_bounty ON solutions(bounty_id);

	CREATE TABLE IF NOT EXISTS leaderboard (
		address       TEXT NOT NULL,
		actor_type    TEXT NOT NULL,
		total_bounties INTEGER NOT NULL DEFAULT 0,
		total_payout  TEXT    NOT NULL DEFAULT '0',
		reputation    INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (address, actor_type)
	);

	CREATE TABLE IF NOT EXISTS tasks (
		id                  INTEGER PRIMARY KEY AUTOINCREMENT,
		creator             TEXT    NOT NULL,
		title               TEXT    NOT NULL,
		description         TEXT    NOT NULL DEFAULT '',
		repo_url            TEXT    NOT NULL DEFAULT '',
		prd_hash            TEXT    NOT NULL DEFAULT '',
		qa_hash             TEXT    NOT NULL DEFAULT '',
		reward_type         TEXT    NOT NULL DEFAULT 'token',
		reward_amount       TEXT    NOT NULL DEFAULT '0',
		estimated_complexity INTEGER NOT NULL DEFAULT 0,
		language            TEXT    NOT NULL DEFAULT '',
		tags                TEXT    NOT NULL DEFAULT '[]',
		status              TEXT    NOT NULL DEFAULT 'open',
		claimed_by          TEXT    NOT NULL DEFAULT '',
		submission_count    INTEGER NOT NULL DEFAULT 0,
		created_at          INTEGER NOT NULL DEFAULT 0,
		closed_at           INTEGER NOT NULL DEFAULT 0,
		on_chain_bounty_id  INTEGER
	);

	CREATE TABLE IF NOT EXISTS submissions (
		id           INTEGER PRIMARY KEY AUTOINCREMENT,
		task_id      INTEGER NOT NULL,
		agent_id     TEXT    NOT NULL,
		patch        TEXT    NOT NULL DEFAULT '',
		description  TEXT    NOT NULL DEFAULT '',
		review_score INTEGER NOT NULL DEFAULT 0,
		review_notes TEXT    NOT NULL DEFAULT '',
		status       TEXT    NOT NULL DEFAULT 'submitted',
		attempt      INTEGER NOT NULL DEFAULT 1,
		submitted_at INTEGER NOT NULL DEFAULT 0,
		reviewed_at  INTEGER NOT NULL DEFAULT 0,
		FOREIGN KEY (task_id) REFERENCES tasks(id)
	);
	CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);

	CREATE TABLE IF NOT EXISTS agents (
		id              TEXT    PRIMARY KEY,
		name            TEXT    NOT NULL DEFAULT '',
		source          TEXT    NOT NULL DEFAULT 'direct',
		recruiter       TEXT    NOT NULL DEFAULT '',
		model           TEXT    NOT NULL DEFAULT '',
		career_path     TEXT    NOT NULL DEFAULT 'developer',
		status          TEXT    NOT NULL DEFAULT 'active',
		tier            TEXT    NOT NULL DEFAULT 'trade',
		token_balance   INTEGER NOT NULL DEFAULT 0,
		total_earned    INTEGER NOT NULL DEFAULT 0,
		total_spent     INTEGER NOT NULL DEFAULT 0,
		tasks_completed INTEGER NOT NULL DEFAULT 0,
		tasks_failed    INTEGER NOT NULL DEFAULT 0,
		success_rate    REAL    NOT NULL DEFAULT 0.0,
		reputation      INTEGER NOT NULL DEFAULT 0,
		registered_at   INTEGER NOT NULL DEFAULT 0,
		last_active_at  INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS token_ledger (
		id          INTEGER PRIMARY KEY AUTOINCREMENT,
		from_agent  TEXT    NOT NULL DEFAULT '',
		to_agent    TEXT    NOT NULL,
		amount      INTEGER NOT NULL,
		reason      TEXT    NOT NULL,
		task_id     INTEGER NOT NULL DEFAULT 0,
		created_at  INTEGER NOT NULL DEFAULT 0
	);
	CREATE INDEX IF NOT EXISTS idx_ledger_to ON token_ledger(to_agent);
	CREATE INDEX IF NOT EXISTS idx_ledger_from ON token_ledger(from_agent);
	`
	_, err := s.db.Exec(schema)
	return err
}

// ════════════════════════════════════════════════════════════════
// Legacy bounty operations
// ════════════════════════════════════════════════════════════════

func (s *SQLiteStore) UpsertBounty(b *models.BountyResponse) error {
	_, err := s.db.Exec(`
		INSERT INTO bounties (id, maintainer, repo_owner, repo_name, issue_number,
			prd_hash, qa_hash, amount, estimated_complexity, status, solution_count,
			created_at, closed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			maintainer=excluded.maintainer, repo_owner=excluded.repo_owner,
			repo_name=excluded.repo_name, issue_number=excluded.issue_number,
			prd_hash=excluded.prd_hash, qa_hash=excluded.qa_hash,
			amount=excluded.amount, estimated_complexity=excluded.estimated_complexity,
			status=excluded.status, solution_count=excluded.solution_count,
			created_at=excluded.created_at, closed_at=excluded.closed_at`,
		b.ID, b.Maintainer, b.RepoOwner, b.RepoName, b.IssueNumber,
		b.PRDHash, b.QAHash, b.Amount, b.EstimatedComplexity, b.Status,
		b.SolutionCount, b.CreatedAt, b.ClosedAt,
	)
	return err
}

func (s *SQLiteStore) GetBounty(id uint64) (*models.BountyResponse, error) {
	b := &models.BountyResponse{}
	err := s.db.QueryRow(`
		SELECT id, maintainer, repo_owner, repo_name, issue_number,
			prd_hash, qa_hash, amount, estimated_complexity, status,
			solution_count, created_at, closed_at
		FROM bounties WHERE id = ?`, id).Scan(
		&b.ID, &b.Maintainer, &b.RepoOwner, &b.RepoName, &b.IssueNumber,
		&b.PRDHash, &b.QAHash, &b.Amount, &b.EstimatedComplexity, &b.Status,
		&b.SolutionCount, &b.CreatedAt, &b.ClosedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return b, err
}

func (s *SQLiteStore) ListBounties() ([]*models.BountyResponse, error) {
	rows, err := s.db.Query(`
		SELECT id, maintainer, repo_owner, repo_name, issue_number,
			prd_hash, qa_hash, amount, estimated_complexity, status,
			solution_count, created_at, closed_at
		FROM bounties ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bounties []*models.BountyResponse
	for rows.Next() {
		b := &models.BountyResponse{}
		if err := rows.Scan(
			&b.ID, &b.Maintainer, &b.RepoOwner, &b.RepoName, &b.IssueNumber,
			&b.PRDHash, &b.QAHash, &b.Amount, &b.EstimatedComplexity, &b.Status,
			&b.SolutionCount, &b.CreatedAt, &b.ClosedAt,
		); err != nil {
			return nil, err
		}
		bounties = append(bounties, b)
	}
	return bounties, rows.Err()
}

func (s *SQLiteStore) UpsertSolution(sol *models.SolutionResponse) error {
	_, err := s.db.Exec(`
		INSERT INTO solutions (id, bounty_id, contributor, pr_number,
			commit_hash, score, status, submitted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			bounty_id=excluded.bounty_id, contributor=excluded.contributor,
			pr_number=excluded.pr_number, commit_hash=excluded.commit_hash,
			score=excluded.score, status=excluded.status,
			submitted_at=excluded.submitted_at`,
		sol.ID, sol.BountyID, sol.Contributor, sol.PRNumber,
		sol.CommitHash, sol.Score, sol.Status, sol.SubmittedAt,
	)
	return err
}

func (s *SQLiteStore) ListSolutions(bountyID uint64) ([]*models.SolutionResponse, error) {
	rows, err := s.db.Query(`
		SELECT id, bounty_id, contributor, pr_number, commit_hash,
			score, status, submitted_at
		FROM solutions WHERE bounty_id = ? ORDER BY id`, bountyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var solutions []*models.SolutionResponse
	for rows.Next() {
		sol := &models.SolutionResponse{}
		if err := rows.Scan(
			&sol.ID, &sol.BountyID, &sol.Contributor, &sol.PRNumber,
			&sol.CommitHash, &sol.Score, &sol.Status, &sol.SubmittedAt,
		); err != nil {
			return nil, err
		}
		solutions = append(solutions, sol)
	}
	return solutions, rows.Err()
}

func (s *SQLiteStore) UpsertLeaderboardEntry(e *models.LeaderboardEntry) error {
	_, err := s.db.Exec(`
		INSERT INTO leaderboard (address, actor_type, total_bounties, total_payout, reputation)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(address, actor_type) DO UPDATE SET
			total_bounties=excluded.total_bounties,
			total_payout=excluded.total_payout,
			reputation=excluded.reputation`,
		e.Address, e.ActorType, e.TotalBounties, e.TotalPayout, e.Reputation,
	)
	return err
}

func (s *SQLiteStore) GetLeaderboard() ([]*models.LeaderboardEntry, error) {
	rows, err := s.db.Query(`
		SELECT address, actor_type, total_bounties, total_payout, reputation
		FROM leaderboard
		WHERE reputation != 0 OR total_bounties > 0
		ORDER BY reputation DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*models.LeaderboardEntry
	for rows.Next() {
		e := &models.LeaderboardEntry{}
		if err := rows.Scan(
			&e.Address, &e.ActorType, &e.TotalBounties, &e.TotalPayout, &e.Reputation,
		); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

// ════════════════════════════════════════════════════════════════
// Task operations
// ════════════════════════════════════════════════════════════════

func (s *SQLiteStore) CreateTask(t *models.Task) (uint64, error) {
	tagsJSON, _ := json.Marshal(t.Tags)
	result, err := s.db.Exec(`
		INSERT INTO tasks (creator, title, description, repo_url, prd_hash, qa_hash,
			reward_type, reward_amount, estimated_complexity, language, tags, status,
			claimed_by, submission_count, created_at, closed_at, on_chain_bounty_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.Creator, t.Title, t.Description, t.RepoURL, t.PRDHash, t.QAHash,
		t.RewardType, t.RewardAmount, t.EstimatedComplexity, t.Language, string(tagsJSON),
		t.Status, t.ClaimedBy, t.SubmissionCount, t.CreatedAt, t.ClosedAt, t.OnChainBountyID,
	)
	if err != nil {
		return 0, err
	}
	id, err := result.LastInsertId()
	return uint64(id), err
}

func (s *SQLiteStore) GetTask(id uint64) (*models.Task, error) {
	t := &models.Task{}
	var tagsJSON string
	var onChainID sql.NullInt64
	err := s.db.QueryRow(`
		SELECT id, creator, title, description, repo_url, prd_hash, qa_hash,
			reward_type, reward_amount, estimated_complexity, language, tags, status,
			claimed_by, submission_count, created_at, closed_at, on_chain_bounty_id
		FROM tasks WHERE id = ?`, id).Scan(
		&t.ID, &t.Creator, &t.Title, &t.Description, &t.RepoURL, &t.PRDHash, &t.QAHash,
		&t.RewardType, &t.RewardAmount, &t.EstimatedComplexity, &t.Language, &tagsJSON,
		&t.Status, &t.ClaimedBy, &t.SubmissionCount, &t.CreatedAt, &t.ClosedAt, &onChainID,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(tagsJSON), &t.Tags)
	if onChainID.Valid {
		v := uint64(onChainID.Int64)
		t.OnChainBountyID = &v
	}
	return t, nil
}

func (s *SQLiteStore) ListTasks(status string, language string, limit int) ([]*models.Task, error) {
	query := `SELECT id, creator, title, description, repo_url, prd_hash, qa_hash,
		reward_type, reward_amount, estimated_complexity, language, tags, status,
		claimed_by, submission_count, created_at, closed_at, on_chain_bounty_id
		FROM tasks WHERE 1=1`
	var args []any

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}
	if language != "" {
		query += " AND language = ?"
		args = append(args, language)
	}
	query += " ORDER BY id DESC"
	if limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		t := &models.Task{}
		var tagsJSON string
		var onChainID sql.NullInt64
		if err := rows.Scan(
			&t.ID, &t.Creator, &t.Title, &t.Description, &t.RepoURL, &t.PRDHash, &t.QAHash,
			&t.RewardType, &t.RewardAmount, &t.EstimatedComplexity, &t.Language, &tagsJSON,
			&t.Status, &t.ClaimedBy, &t.SubmissionCount, &t.CreatedAt, &t.ClosedAt, &onChainID,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(tagsJSON), &t.Tags)
		if onChainID.Valid {
			v := uint64(onChainID.Int64)
			t.OnChainBountyID = &v
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func (s *SQLiteStore) UpdateTask(t *models.Task) error {
	tagsJSON, _ := json.Marshal(t.Tags)
	_, err := s.db.Exec(`
		UPDATE tasks SET creator=?, title=?, description=?, repo_url=?, prd_hash=?, qa_hash=?,
			reward_type=?, reward_amount=?, estimated_complexity=?, language=?, tags=?, status=?,
			claimed_by=?, submission_count=?, created_at=?, closed_at=?, on_chain_bounty_id=?
		WHERE id=?`,
		t.Creator, t.Title, t.Description, t.RepoURL, t.PRDHash, t.QAHash,
		t.RewardType, t.RewardAmount, t.EstimatedComplexity, t.Language, string(tagsJSON),
		t.Status, t.ClaimedBy, t.SubmissionCount, t.CreatedAt, t.ClosedAt, t.OnChainBountyID,
		t.ID,
	)
	return err
}

// ════════════════════════════════════════════════════════════════
// Submission operations
// ════════════════════════════════════════════════════════════════

func (s *SQLiteStore) CreateSubmission(sub *models.Submission) (uint64, error) {
	result, err := s.db.Exec(`
		INSERT INTO submissions (task_id, agent_id, patch, description, review_score,
			review_notes, status, attempt, submitted_at, reviewed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		sub.TaskID, sub.AgentID, sub.Patch, sub.Description, sub.ReviewScore,
		sub.ReviewNotes, sub.Status, sub.Attempt, sub.SubmittedAt, sub.ReviewedAt,
	)
	if err != nil {
		return 0, err
	}
	id, err := result.LastInsertId()
	return uint64(id), err
}

func (s *SQLiteStore) GetSubmission(id uint64) (*models.Submission, error) {
	sub := &models.Submission{}
	err := s.db.QueryRow(`
		SELECT id, task_id, agent_id, patch, description, review_score,
			review_notes, status, attempt, submitted_at, reviewed_at
		FROM submissions WHERE id = ?`, id).Scan(
		&sub.ID, &sub.TaskID, &sub.AgentID, &sub.Patch, &sub.Description,
		&sub.ReviewScore, &sub.ReviewNotes, &sub.Status, &sub.Attempt,
		&sub.SubmittedAt, &sub.ReviewedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return sub, err
}

func (s *SQLiteStore) ListSubmissions(taskID uint64) ([]*models.Submission, error) {
	rows, err := s.db.Query(`
		SELECT id, task_id, agent_id, patch, description, review_score,
			review_notes, status, attempt, submitted_at, reviewed_at
		FROM submissions WHERE task_id = ? ORDER BY id`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []*models.Submission
	for rows.Next() {
		sub := &models.Submission{}
		if err := rows.Scan(
			&sub.ID, &sub.TaskID, &sub.AgentID, &sub.Patch, &sub.Description,
			&sub.ReviewScore, &sub.ReviewNotes, &sub.Status, &sub.Attempt,
			&sub.SubmittedAt, &sub.ReviewedAt,
		); err != nil {
			return nil, err
		}
		subs = append(subs, sub)
	}
	return subs, rows.Err()
}

func (s *SQLiteStore) UpdateSubmission(sub *models.Submission) error {
	_, err := s.db.Exec(`
		UPDATE submissions SET task_id=?, agent_id=?, patch=?, description=?,
			review_score=?, review_notes=?, status=?, attempt=?,
			submitted_at=?, reviewed_at=?
		WHERE id=?`,
		sub.TaskID, sub.AgentID, sub.Patch, sub.Description,
		sub.ReviewScore, sub.ReviewNotes, sub.Status, sub.Attempt,
		sub.SubmittedAt, sub.ReviewedAt,
		sub.ID,
	)
	return err
}

// ════════════════════════════════════════════════════════════════
// Agent operations
// ════════════════════════════════════════════════════════════════

func (s *SQLiteStore) RegisterAgent(a *models.Agent) error {
	_, err := s.db.Exec(`
		INSERT INTO agents (id, name, source, recruiter, model, career_path, status, tier,
			token_balance, total_earned, total_spent, tasks_completed, tasks_failed,
			success_rate, reputation, registered_at, last_active_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		a.ID, a.Name, a.Source, a.Recruiter, a.Model, a.CareerPath, a.Status, a.Tier,
		a.TokenBalance, a.TotalEarned, a.TotalSpent, a.TasksCompleted, a.TasksFailed,
		a.SuccessRate, a.Reputation, a.RegisteredAt, a.LastActiveAt,
	)
	return err
}

func (s *SQLiteStore) GetAgent(id string) (*models.Agent, error) {
	a := &models.Agent{}
	err := s.db.QueryRow(`
		SELECT id, name, source, recruiter, model, career_path, status, tier,
			token_balance, total_earned, total_spent, tasks_completed, tasks_failed,
			success_rate, reputation, registered_at, last_active_at
		FROM agents WHERE id = ?`, id).Scan(
		&a.ID, &a.Name, &a.Source, &a.Recruiter, &a.Model, &a.CareerPath, &a.Status, &a.Tier,
		&a.TokenBalance, &a.TotalEarned, &a.TotalSpent, &a.TasksCompleted, &a.TasksFailed,
		&a.SuccessRate, &a.Reputation, &a.RegisteredAt, &a.LastActiveAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (s *SQLiteStore) ListAgents(limit int) ([]*models.Agent, error) {
	query := `SELECT id, name, source, recruiter, model, career_path, status, tier,
		token_balance, total_earned, total_spent, tasks_completed, tasks_failed,
		success_rate, reputation, registered_at, last_active_at
		FROM agents ORDER BY reputation DESC`
	var args []any
	if limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agents []*models.Agent
	for rows.Next() {
		a := &models.Agent{}
		if err := rows.Scan(
			&a.ID, &a.Name, &a.Source, &a.Recruiter, &a.Model, &a.CareerPath, &a.Status, &a.Tier,
			&a.TokenBalance, &a.TotalEarned, &a.TotalSpent, &a.TasksCompleted, &a.TasksFailed,
			&a.SuccessRate, &a.Reputation, &a.RegisteredAt, &a.LastActiveAt,
		); err != nil {
			return nil, err
		}
		agents = append(agents, a)
	}
	return agents, rows.Err()
}

func (s *SQLiteStore) UpdateAgent(a *models.Agent) error {
	_, err := s.db.Exec(`
		UPDATE agents SET name=?, source=?, recruiter=?, model=?, career_path=?, status=?, tier=?,
			token_balance=?, total_earned=?, total_spent=?, tasks_completed=?, tasks_failed=?,
			success_rate=?, reputation=?, registered_at=?, last_active_at=?
		WHERE id=?`,
		a.Name, a.Source, a.Recruiter, a.Model, a.CareerPath, a.Status, a.Tier,
		a.TokenBalance, a.TotalEarned, a.TotalSpent, a.TasksCompleted, a.TasksFailed,
		a.SuccessRate, a.Reputation, a.RegisteredAt, a.LastActiveAt,
		a.ID,
	)
	return err
}

// ════════════════════════════════════════════════════════════════
// Token ledger
// ════════════════════════════════════════════════════════════════

func (s *SQLiteStore) RecordTransfer(t *models.TokenTransfer) error {
	_, err := s.db.Exec(`
		INSERT INTO token_ledger (from_agent, to_agent, amount, reason, task_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		t.FromAgent, t.ToAgent, t.Amount, t.Reason, t.TaskID, t.CreatedAt,
	)
	return err
}

func (s *SQLiteStore) GetTransfers(agentID string, limit int) ([]*models.TokenTransfer, error) {
	query := `SELECT id, from_agent, to_agent, amount, reason, task_id, created_at
		FROM token_ledger WHERE from_agent = ? OR to_agent = ?
		ORDER BY id DESC`
	var args []any = []any{agentID, agentID}
	if limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transfers []*models.TokenTransfer
	for rows.Next() {
		t := &models.TokenTransfer{}
		if err := rows.Scan(&t.ID, &t.FromAgent, &t.ToAgent, &t.Amount, &t.Reason, &t.TaskID, &t.CreatedAt); err != nil {
			return nil, err
		}
		transfers = append(transfers, t)
	}
	return transfers, rows.Err()
}

func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

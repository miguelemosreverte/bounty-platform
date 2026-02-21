package storage

import (
	"database/sql"
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
	`
	_, err := s.db.Exec(schema)
	return err
}

// --- Bounty operations ---

func (s *SQLiteStore) UpsertBounty(b *models.BountyResponse) error {
	_, err := s.db.Exec(`
		INSERT INTO bounties (id, maintainer, repo_owner, repo_name, issue_number,
			prd_hash, qa_hash, amount, estimated_complexity, status, solution_count,
			created_at, closed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			maintainer=excluded.maintainer,
			repo_owner=excluded.repo_owner,
			repo_name=excluded.repo_name,
			issue_number=excluded.issue_number,
			prd_hash=excluded.prd_hash,
			qa_hash=excluded.qa_hash,
			amount=excluded.amount,
			estimated_complexity=excluded.estimated_complexity,
			status=excluded.status,
			solution_count=excluded.solution_count,
			created_at=excluded.created_at,
			closed_at=excluded.closed_at`,
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

// --- Solution operations ---

func (s *SQLiteStore) UpsertSolution(sol *models.SolutionResponse) error {
	_, err := s.db.Exec(`
		INSERT INTO solutions (id, bounty_id, contributor, pr_number,
			commit_hash, score, status, submitted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			bounty_id=excluded.bounty_id,
			contributor=excluded.contributor,
			pr_number=excluded.pr_number,
			commit_hash=excluded.commit_hash,
			score=excluded.score,
			status=excluded.status,
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

// --- Leaderboard operations ---

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

func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

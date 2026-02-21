package github

type WebhookPayload struct {
	Action string `json:"action"`

	// Issue events
	Issue *Issue `json:"issue,omitempty"`

	// PR events
	PullRequest *PullRequest `json:"pull_request,omitempty"`

	// Common
	Repository Repository `json:"repository"`
	Label      *Label     `json:"label,omitempty"`
}

type Issue struct {
	Number int    `json:"number"`
	Title  string `json:"title"`
	Body   string `json:"body"`
	State  string `json:"state"`
	Labels []Label `json:"labels"`
}

type PullRequest struct {
	Number    int    `json:"number"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	State     string `json:"state"`
	Merged    bool   `json:"merged"`
	Head      GitRef `json:"head"`
	DiffURL   string `json:"diff_url"`
	HTMLURL   string `json:"html_url"`
}

type GitRef struct {
	SHA string `json:"sha"`
	Ref string `json:"ref"`
}

type Repository struct {
	FullName string `json:"full_name"`
	Name     string `json:"name"`
	Owner    struct {
		Login string `json:"login"`
	} `json:"owner"`
}

type Label struct {
	Name string `json:"name"`
}

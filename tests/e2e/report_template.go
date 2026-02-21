package e2e

const htmlReportTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Test Report — Bounty Platform</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0d1117; color: #c9d1d9; padding: 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { font-size: 1.8rem; margin-bottom: 0.25rem; color: #f0f6fc; }
        .subtitle { color: #8b949e; margin-bottom: 2rem; }

        /* Summary cards */
        .summary {
            display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem;
        }
        .stat {
            background: #161b22; border-radius: 12px; padding: 1.25rem; text-align: center;
            border: 1px solid #30363d;
        }
        .stat h2 { font-size: 2rem; margin-bottom: 0.25rem; }
        .stat p { color: #8b949e; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat.passed h2 { color: #3fb950; }
        .stat.failed h2 { color: #f85149; }
        .stat.total h2 { color: #58a6ff; }
        .stat.duration h2 { color: #bc8cff; font-size: 1.3rem; }
        .stat.requests h2 { color: #d29922; }

        /* Charts */
        .charts {
            display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;
        }
        .chart-card {
            background: #161b22; border-radius: 12px; padding: 1.5rem;
            border: 1px solid #30363d;
        }
        .chart-card h3 { color: #f0f6fc; margin-bottom: 1rem; font-size: 1rem; }

        /* Section header */
        .section-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 1rem;
        }
        .section-header h2 { color: #f0f6fc; font-size: 1.3rem; }
        .toggle-all {
            background: #21262d; border: 1px solid #30363d; color: #8b949e;
            padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer;
            font-size: 0.8rem; font-family: inherit;
        }
        .toggle-all:hover { color: #c9d1d9; border-color: #484f58; }

        /* Suite sections */
        .suite-section { margin-bottom: 0.5rem; }
        .suite-header {
            display: flex; align-items: center; gap: 0.75rem;
            padding: 0.75rem 1rem; cursor: pointer;
            background: #161b22; border-radius: 8px; border: 1px solid #30363d;
            transition: background 0.15s;
        }
        .suite-header:hover { background: #1c2129; }
        .chevron {
            color: #484f58; font-size: 0.7rem; transition: transform 0.2s;
            display: inline-block; width: 1rem; text-align: center;
        }
        .chevron.open { transform: rotate(90deg); }
        .status-pill {
            padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.7rem;
            font-weight: 700; letter-spacing: 0.05em;
        }
        .status-pill.pass { background: rgba(63,185,80,0.15); color: #3fb950; }
        .status-pill.fail { background: rgba(248,81,73,0.15); color: #f85149; }
        .suite-name { color: #f0f6fc; font-weight: 600; font-size: 0.95rem; }
        .suite-meta { color: #484f58; font-size: 0.8rem; margin-left: auto; }

        .suite-body { padding: 0.75rem 0 0.75rem 1.5rem; }

        /* Timeline */
        .timeline-item {
            display: flex; gap: 0.75rem; position: relative;
            padding-bottom: 0.75rem;
        }
        .timeline-item:not(:last-child) .timeline-line {
            position: absolute; left: 11px; top: 28px;
            width: 2px; bottom: 0; background: #21262d;
        }
        .step-circle {
            width: 24px; height: 24px; border-radius: 50%;
            background: #21262d; color: #8b949e; font-size: 0.65rem;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; font-weight: 700; z-index: 1;
        }
        .step-content { flex: 1; min-width: 0; }
        .step-header {
            display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
            line-height: 1.6;
        }

        /* Method badges */
        .method-pill {
            padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem;
            font-weight: 700; font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
        }
        .method-pill.get { background: rgba(88,166,255,0.15); color: #58a6ff; }
        .method-pill.post { background: rgba(210,153,34,0.15); color: #d29922; }
        .method-pill.put { background: rgba(188,140,255,0.15); color: #bc8cff; }
        .method-pill.delete { background: rgba(248,81,73,0.15); color: #f85149; }

        .path {
            color: #c9d1d9; font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
            font-size: 0.85rem; background: rgba(110,118,129,0.1); padding: 0.1rem 0.35rem;
            border-radius: 3px;
        }

        /* Status code badges */
        .status-code {
            padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem;
            font-weight: 700; font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
        }
        .status-2xx { background: rgba(63,185,80,0.15); color: #3fb950; }
        .status-4xx { background: rgba(210,153,34,0.15); color: #d29922; }
        .status-5xx { background: rgba(248,81,73,0.15); color: #f85149; }

        .step-duration { color: #484f58; font-size: 0.75rem; }
        .subtest-name {
            color: #bc8cff; font-size: 0.7rem; background: rgba(188,140,255,0.08);
            padding: 0.1rem 0.35rem; border-radius: 3px;
        }

        /* Request headers */
        .req-headers {
            display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.35rem;
        }
        .header-tag {
            background: #0d1117; border: 1px solid #21262d; border-radius: 4px;
            padding: 0.1rem 0.4rem; font-size: 0.65rem; color: #8b949e;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
        }

        /* Request/Response bodies */
        .body-section { margin-top: 0.4rem; }
        .body-label {
            color: #484f58; font-size: 0.75rem; cursor: pointer;
            user-select: none; display: inline-flex; align-items: center; gap: 0.3rem;
        }
        .body-label:hover { color: #8b949e; }
        .body-label .arrow {
            font-size: 0.6rem; display: inline-block; transition: transform 0.15s;
        }
        .body-label .arrow.open { transform: rotate(90deg); }
        .body-content {
            background: #0d1117; border: 1px solid #21262d; border-radius: 6px;
            padding: 0.75rem; margin-top: 0.3rem; font-size: 0.75rem;
            color: #8b949e; overflow-x: auto; white-space: pre-wrap;
            word-break: break-word; max-height: 500px; overflow-y: auto;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
            line-height: 1.5;
        }

        .empty-state { color: #484f58; font-style: italic; padding: 1rem; font-size: 0.85rem; }
        .footer { text-align: center; color: #30363d; margin-top: 3rem; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>E2E Test Report</h1>
        <p class="subtitle">Bounty Platform &mdash; {{.Timestamp}}</p>

        <div class="summary">
            <div class="stat total"><h2>{{.TotalSuites}}</h2><p>Suites</p></div>
            <div class="stat passed"><h2>{{.Passed}}</h2><p>Passed</p></div>
            <div class="stat failed"><h2>{{.Failed}}</h2><p>Failed</p></div>
            <div class="stat duration"><h2>{{.TotalDuration}}</h2><p>Duration</p></div>
            <div class="stat requests"><h2>{{.TotalRequests}}</h2><p>HTTP Requests</p></div>
        </div>

        <div class="charts">
            <div class="chart-card">
                <h3>Duration per Suite</h3>
                <canvas id="durationChart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Pass / Fail</h3>
                <canvas id="resultChart"></canvas>
            </div>
        </div>

        <div class="section-header">
            <h2>Suite Timeline</h2>
            <button class="toggle-all" onclick="toggleAll()">Expand All</button>
        </div>

        {{range $i, $suite := .SuiteDetails}}
        <div class="suite-section">
            <div class="suite-header" onclick="toggleSuite('suite-{{$i}}')">
                {{if eq $i 0}}<span class="chevron open" id="chevron-suite-{{$i}}">&#9654;</span>{{else}}<span class="chevron" id="chevron-suite-{{$i}}">&#9654;</span>{{end}}
                <span class="status-pill {{$suite.StatusClass}}">{{$suite.Status}}</span>
                <span class="suite-name">{{$suite.Name}}</span>
                <span class="suite-meta">{{$suite.TotalReqs}} requests &middot; {{$suite.DurationStr}}</span>
            </div>
            {{if eq $i 0}}<div class="suite-body" id="suite-{{$i}}">{{else}}<div class="suite-body" id="suite-{{$i}}" style="display:none;">{{end}}
                {{if $suite.Requests}}
                {{range $j, $req := $suite.Requests}}
                <div class="timeline-item">
                    <div class="timeline-line"></div>
                    <div class="step-circle">{{$req.Step}}</div>
                    <div class="step-content">
                        <div class="step-header">
                            <span class="method-pill {{$req.MethodClass}}">{{$req.Method}}</span>
                            <code class="path">{{$req.Path}}</code>
                            <span class="status-code {{$req.StatusClass}}">{{$req.StatusCode}}</span>
                            <span class="step-duration">{{$req.DurationStr}}</span>
                            {{if $req.SubTest}}<span class="subtest-name">{{$req.SubTest}}</span>{{end}}
                        </div>
                        {{if $req.Headers}}
                        <div class="req-headers">
                            {{range $req.Headers}}<span class="header-tag">{{.Key}}: {{.Value}}</span>{{end}}
                        </div>
                        {{end}}
                        {{if $req.HasReqBody}}
                        <div class="body-section">
                            <div class="body-label" onclick="toggleBody(this)"><span class="arrow">&#9654;</span> Request Body</div>
                            <pre class="body-content" style="display:none;">{{$req.ReqBody}}</pre>
                        </div>
                        {{end}}
                        {{if $req.HasResBody}}
                        <div class="body-section">
                            <div class="body-label" onclick="toggleBody(this)"><span class="arrow">&#9654;</span> Response Body</div>
                            <pre class="body-content" style="display:none;">{{$req.ResBody}}</pre>
                        </div>
                        {{end}}
                    </div>
                </div>
                {{end}}
                {{else}}
                <div class="empty-state">No HTTP requests recorded for this suite.</div>
                {{end}}
            </div>
        </div>
        {{end}}

        <p class="footer">Generated by bounty-platform E2E test suite</p>
    </div>

    <script>
        const suiteNames = {{.SuiteNamesJSON}};
        const durationsMs = {{.DurationsMsJSON}};

        new Chart(document.getElementById('durationChart'), {
            type: 'bar',
            data: {
                labels: suiteNames,
                datasets: [{
                    label: 'Duration (ms)',
                    data: durationsMs,
                    backgroundColor: durationsMs.map((_, i) =>
                        ['#58a6ff', '#bc8cff', '#a5d6ff', '#d2a8ff', '#f778ba',
                         '#ff7b72', '#ffa657', '#d29922', '#3fb950'][i % 9]
                    ),
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ctx.raw + ' ms' } }
                },
                scales: {
                    x: { grid: { color: '#21262d' }, ticks: { color: '#8b949e' } },
                    y: { grid: { display: false }, ticks: { color: '#c9d1d9', font: { size: 11 } } }
                }
            }
        });

        new Chart(document.getElementById('resultChart'), {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [{{.Passed}}, {{.Failed}}],
                    backgroundColor: ['#3fb950', '#f85149'],
                    borderWidth: 0,
                    spacing: 2
                }]
            },
            options: {
                responsive: true,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#c9d1d9', padding: 16 } }
                }
            }
        });

        function toggleSuite(id) {
            const body = document.getElementById(id);
            const chevron = document.getElementById('chevron-' + id);
            if (body.style.display === 'none') {
                body.style.display = 'block';
                chevron.classList.add('open');
            } else {
                body.style.display = 'none';
                chevron.classList.remove('open');
            }
        }

        function toggleBody(label) {
            const content = label.nextElementSibling;
            const arrow = label.querySelector('.arrow');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                arrow.classList.add('open');
            } else {
                content.style.display = 'none';
                arrow.classList.remove('open');
            }
        }

        let allExpanded = false;
        function toggleAll() {
            const btn = document.querySelector('.toggle-all');
            const bodies = document.querySelectorAll('.suite-body');
            const chevrons = document.querySelectorAll('.chevron');
            allExpanded = !allExpanded;
            if (allExpanded) {
                bodies.forEach(b => b.style.display = 'block');
                chevrons.forEach(c => c.classList.add('open'));
                btn.textContent = 'Collapse All';
            } else {
                bodies.forEach(b => b.style.display = 'none');
                chevrons.forEach(c => c.classList.remove('open'));
                btn.textContent = 'Expand All';
            }
        }
    </script>
</body>
</html>`

package e2e

const htmlReportTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GitBusters — E2E Test Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            headline: ['"Playfair Display"', 'Georgia', 'serif'],
            body: ['"Source Serif 4"', 'Georgia', 'serif'],
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['"SF Mono"', 'Monaco', '"Cascadia Code"', 'Consolas', 'monospace'],
          },
          colors: {
            wsj: {
              bg: '#FBF9F6',
              cream: '#F5F1EB',
              rule: '#C4B9A7',
              accent: '#0274B6',
              dark: '#111111',
              muted: '#666666',
              highlight: '#E8DFD0',
              red: '#9E1B1D',
              green: '#1A6B3C',
            }
          }
        }
      }
    }
  </script>
  <style>
    body { background: #FBF9F6; }
    .section-rule {
      border: none;
      border-top: 1px solid #C4B9A7;
      margin: 2rem 0;
    }
    .double-rule {
      border: none;
      border-top: 3px double #111;
      margin: 1.5rem 0;
    }
    .data-callout {
      background: #F5F1EB;
      border-left: 4px solid #0274B6;
    }
    .chart-container { position: relative; width: 100%; max-width: 520px; max-height: 240px; margin: 0 auto; }
    .chart-container-doughnut { position: relative; max-width: 280px; max-height: 260px; margin: 0 auto; }

    /* Suite toggle */
    .suite-header { cursor: pointer; transition: background 0.15s; }
    .suite-header:hover { background: #F5F1EB; }
    .chevron { transition: transform 0.2s; display: inline-block; }
    .chevron.open { transform: rotate(90deg); }

    /* Method badges */
    .method-pill {
      display: inline-block; padding: 0.1rem 0.4rem; border-radius: 3px;
      font-size: 0.65rem; font-weight: 700; font-family: 'SF Mono', Monaco, Consolas, monospace;
      letter-spacing: 0.03em;
    }
    .method-pill.get { background: rgba(2,116,182,0.12); color: #0274B6; }
    .method-pill.post { background: rgba(158,27,29,0.10); color: #9E1B1D; }
    .method-pill.put { background: rgba(102,102,102,0.12); color: #666; }
    .method-pill.delete { background: rgba(158,27,29,0.10); color: #9E1B1D; }
    .method-pill.mcp { background: rgba(26,107,60,0.12); color: #1A6B3C; }

    /* Status code badges */
    .status-code {
      display: inline-block; padding: 0.1rem 0.35rem; border-radius: 3px;
      font-size: 0.65rem; font-weight: 700; font-family: 'SF Mono', Monaco, Consolas, monospace;
    }
    .status-2xx { background: rgba(26,107,60,0.12); color: #1A6B3C; }
    .status-4xx { background: rgba(158,27,29,0.10); color: #9E1B1D; }
    .status-5xx { background: rgba(158,27,29,0.20); color: #9E1B1D; }

    /* Timeline */
    .timeline-item { position: relative; }
    .timeline-item:not(:last-child) .timeline-line {
      position: absolute; left: 11px; top: 28px;
      width: 2px; bottom: 0; background: #E8DFD0;
    }
    .step-circle {
      width: 24px; height: 24px; border-radius: 50%;
      background: #F5F1EB; border: 2px solid #C4B9A7;
      color: #666; font-size: 0.6rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-weight: 700; z-index: 1;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
    }

    /* Body expand/collapse */
    .body-label {
      color: #666; font-size: 0.7rem; cursor: pointer;
      user-select: none; display: inline-flex; align-items: center; gap: 0.25rem;
    }
    .body-label:hover { color: #111; }
    .body-label .arrow {
      font-size: 0.55rem; display: inline-block; transition: transform 0.15s;
    }
    .body-label .arrow.open { transform: rotate(90deg); }
    .body-content {
      background: #fff; border: 1px solid #C4B9A7; border-radius: 4px;
      padding: 0.75rem; margin-top: 0.25rem; font-size: 0.7rem;
      color: #333; overflow-x: auto; white-space: pre-wrap;
      word-break: break-word; max-height: 500px; overflow-y: auto;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      line-height: 1.5;
    }

    @media print {
      .no-print { display: none; }
      body { font-size: 11px; }
      .chart-container { max-height: 200px; margin-bottom: 2rem !important; }
      .chart-container-doughnut { max-width: 220px; max-height: 200px; }
      .suite-section { break-inside: avoid; page-break-inside: avoid; }
      h2, h3 { break-after: avoid; page-break-after: avoid; }
      td, th { padding-top: 0.2rem !important; padding-bottom: 0.2rem !important; }
    }
  </style>
</head>
<body class="text-wsj-dark">

  <!-- ─── MASTHEAD ─── -->
  <header class="max-w-5xl mx-auto px-6 pt-10 pb-4">
    <div class="flex items-center justify-between border-b-2 border-wsj-dark pb-2 mb-1">
      <span class="font-sans text-xs tracking-[0.25em] uppercase text-wsj-muted">GitBusters — Quality Assurance</span>
      <span class="font-sans text-xs tracking-wide text-wsj-muted">{{.Timestamp}}</span>
    </div>
    <div class="border-b border-wsj-rule pb-1">
      <span class="font-sans text-[10px] tracking-[0.2em] uppercase text-wsj-muted">End-to-End Test Report — Automated</span>
    </div>
  </header>

  <!-- ─── TITLE BLOCK ─── -->
  <section class="max-w-5xl mx-auto px-6 pt-6 pb-4">
    <hr class="double-rule" />
    <h1 class="font-headline text-4xl md:text-5xl font-black leading-tight tracking-tight text-center mb-3">
      E2E Test Report
    </h1>
    <p class="font-headline text-lg md:text-xl text-center text-wsj-muted italic mb-2">
      Bounty Platform &mdash; Full-stack integration verification
    </p>
    <hr class="double-rule" />
    <div class="flex justify-center gap-6 mt-3 font-sans text-xs tracking-wide text-wsj-muted uppercase">
      <span>HTTP API</span>
      <span>|</span>
      <span>MCP Protocol</span>
      <span>|</span>
      <span>Token Economy</span>
      <span>|</span>
      <span>Legacy Compat</span>
    </div>
  </section>

  <!-- ─── MAIN CONTENT ─── -->
  <article class="max-w-4xl mx-auto px-6">

    <!-- ─── SUMMARY CARDS ─── -->
    <section class="mb-8 mt-6">
      <h2 class="font-headline text-2xl font-bold mb-4 border-b border-wsj-rule pb-2">Executive Summary</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div class="data-callout p-4 rounded">
          <p class="font-sans text-[10px] uppercase tracking-wider text-wsj-muted mb-1">Suites</p>
          <p class="font-headline text-2xl font-bold text-wsj-accent">{{.TotalSuites}}</p>
        </div>
        <div class="data-callout p-4 rounded">
          <p class="font-sans text-[10px] uppercase tracking-wider text-wsj-muted mb-1">Passed</p>
          <p class="font-headline text-2xl font-bold text-wsj-green">{{.Passed}}</p>
        </div>
        <div class="data-callout p-4 rounded">
          <p class="font-sans text-[10px] uppercase tracking-wider text-wsj-muted mb-1">Failed</p>
          <p class="font-headline text-2xl font-bold text-wsj-red">{{.Failed}}</p>
        </div>
        <div class="data-callout p-4 rounded">
          <p class="font-sans text-[10px] uppercase tracking-wider text-wsj-muted mb-1">Duration</p>
          <p class="font-headline text-lg font-bold text-wsj-dark">{{.TotalDuration}}</p>
        </div>
        <div class="data-callout p-4 rounded">
          <p class="font-sans text-[10px] uppercase tracking-wider text-wsj-muted mb-1">Requests</p>
          <p class="font-headline text-2xl font-bold text-wsj-accent">{{.TotalRequests}}</p>
        </div>
      </div>
    </section>

    <!-- ─── SUMMARY TABLE ─── -->
    <section class="mb-6">
      <div class="overflow-x-auto">
        <table class="w-full font-sans text-sm">
          <thead>
            <tr class="border-b-2 border-wsj-dark">
              <th class="text-left py-2 font-semibold">Suite</th>
              <th class="text-left py-2 font-semibold">Status</th>
              <th class="text-right py-2 font-semibold">Requests</th>
              <th class="text-right py-2 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-wsj-rule">
            {{range .SuiteDetails}}
            <tr>
              <td class="py-2 font-medium">{{.Name}}</td>
              <td class="py-2">
                {{if eq .Status "PASS"}}<span class="font-semibold text-wsj-green">PASS</span>{{else}}<span class="font-semibold text-wsj-red">FAIL</span>{{end}}
              </td>
              <td class="py-2 text-right text-wsj-muted">{{.TotalReqs}}</td>
              <td class="py-2 text-right text-wsj-muted font-mono text-xs">{{.DurationStr}}</td>
            </tr>
            {{end}}
          </tbody>
        </table>
      </div>
    </section>

    <hr class="section-rule" />

    <!-- ─── CHARTS ─── -->
    <section class="mb-8">
      <h2 class="font-headline text-2xl font-bold mb-4 border-b border-wsj-rule pb-2">Performance Analysis</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-white border border-wsj-rule rounded-lg p-6">
          <h3 class="font-sans text-sm font-semibold uppercase tracking-wider mb-4">Duration per Suite</h3>
          <div class="chart-container">
            <canvas id="durationChart"></canvas>
          </div>
        </div>
        <div class="bg-white border border-wsj-rule rounded-lg p-6">
          <h3 class="font-sans text-sm font-semibold uppercase tracking-wider mb-4">Pass / Fail</h3>
          <div class="chart-container-doughnut">
            <canvas id="resultChart"></canvas>
          </div>
        </div>
      </div>
    </section>

    <hr class="section-rule" />

    <!-- ─── SUITE TIMELINE ─── -->
    <section class="mb-8">
      <div class="flex items-center justify-between mb-4 border-b border-wsj-rule pb-2">
        <h2 class="font-headline text-2xl font-bold">Suite Timeline</h2>
        <button class="no-print font-sans text-xs uppercase tracking-wider px-3 py-1.5 border border-wsj-rule rounded hover:bg-wsj-cream text-wsj-muted hover:text-wsj-dark transition-colors" onclick="toggleAll()">Expand All</button>
      </div>

      {{range $i, $suite := .SuiteDetails}}
      <div class="suite-section mb-2">
        <div class="suite-header flex items-center gap-3 py-3 px-4 border border-wsj-rule rounded" onclick="toggleSuite('suite-{{$i}}')">
          {{if eq $i 0}}<span class="chevron open text-wsj-muted text-xs" id="chevron-suite-{{$i}}">&#9654;</span>{{else}}<span class="chevron text-wsj-muted text-xs" id="chevron-suite-{{$i}}">&#9654;</span>{{end}}
          {{if eq $suite.Status "PASS"}}<span class="font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wsj-green/10 text-wsj-green">PASS</span>{{else}}<span class="font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wsj-red/10 text-wsj-red">FAIL</span>{{end}}
          <span class="font-sans text-sm font-semibold text-wsj-dark">{{$suite.Name}}</span>
          <span class="ml-auto font-sans text-xs text-wsj-muted">{{$suite.TotalReqs}} requests &middot; {{$suite.DurationStr}}</span>
        </div>
        {{if eq $i 0}}<div class="py-3 pl-6" id="suite-{{$i}}">{{else}}<div class="py-3 pl-6" id="suite-{{$i}}" style="display:none;">{{end}}
          {{if $suite.Requests}}
          {{range $j, $req := $suite.Requests}}
          <div class="timeline-item flex gap-3 pb-3">
            <div class="timeline-line"></div>
            <div class="step-circle">{{$req.Step}}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap leading-relaxed">
                <span class="method-pill {{$req.MethodClass}}">{{$req.Method}}</span>
                <code class="font-mono text-xs bg-wsj-cream px-1.5 py-0.5 rounded text-wsj-dark">{{$req.Path}}</code>
                <span class="status-code {{$req.StatusClass}}">{{$req.StatusCode}}</span>
                <span class="font-mono text-xs text-wsj-muted">{{$req.DurationStr}}</span>
                {{if $req.SubTest}}<span class="font-sans text-[10px] bg-wsj-accent/8 text-wsj-accent px-1.5 py-0.5 rounded">{{$req.SubTest}}</span>{{end}}
              </div>
              {{if $req.Headers}}
              <div class="flex gap-1.5 flex-wrap mt-1.5">
                {{range $req.Headers}}<span class="font-mono text-[10px] bg-white border border-wsj-rule rounded px-1.5 py-0.5 text-wsj-muted">{{.Key}}: {{.Value}}</span>{{end}}
              </div>
              {{end}}
              {{if $req.HasReqBody}}
              <div class="mt-1.5">
                <div class="body-label" onclick="toggleBody(this)"><span class="arrow">&#9654;</span> <span class="font-sans">Request Body</span></div>
                <pre class="body-content" style="display:none;">{{$req.ReqBody}}</pre>
              </div>
              {{end}}
              {{if $req.HasResBody}}
              <div class="mt-1">
                <div class="body-label" onclick="toggleBody(this)"><span class="arrow">&#9654;</span> <span class="font-sans">Response Body</span></div>
                <pre class="body-content" style="display:none;">{{$req.ResBody}}</pre>
              </div>
              {{end}}
            </div>
          </div>
          {{end}}
          {{else}}
          <p class="font-body text-sm text-wsj-muted italic py-2">No requests recorded for this suite.</p>
          {{end}}
        </div>
      </div>
      {{end}}
    </section>

  </article>

  <!-- ─── FOOTER ─── -->
  <footer class="max-w-5xl mx-auto px-6 pb-10">
    <hr class="double-rule" />
    <p class="font-sans text-[10px] tracking-[0.2em] uppercase text-wsj-muted text-center mt-4">
      Generated by GitBusters E2E Test Suite
    </p>
  </footer>

  <script>
    const suiteNames = {{.SuiteNamesJSON}};
    const durationsMs = {{.DurationsMsJSON}};

    // ─── Duration bar chart ───
    new Chart(document.getElementById('durationChart'), {
      type: 'bar',
      data: {
        labels: suiteNames,
        datasets: [{
          label: 'Duration (ms)',
          data: durationsMs,
          backgroundColor: '#0274B6',
          borderRadius: 3,
          barPercentage: 0.7,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ctx.raw + ' ms' } }
        },
        scales: {
          x: {
            grid: { color: 'rgba(196,185,167,0.3)' },
            ticks: { color: '#666', font: { family: 'Inter', size: 10 }, callback: v => v + 'ms' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#111', font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });

    // ─── Pass/Fail doughnut ───
    new Chart(document.getElementById('resultChart'), {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed'],
        datasets: [{
          data: [{{.Passed}}, {{.Failed}}],
          backgroundColor: ['#1A6B3C', '#9E1B1D'],
          borderWidth: 0,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#111', padding: 16, font: { family: 'Inter', size: 11 } } }
        }
      }
    });

    // ─── Toggle functions ───
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
      const btn = document.querySelector('[onclick="toggleAll()"]');
      const bodies = document.querySelectorAll('.suite-section > div:nth-child(2)');
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

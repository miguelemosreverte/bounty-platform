#!/usr/bin/env node
/**
 * Generate a WSJ-editorial product brochure from Playwright story test artifacts.
 *
 * Reads videos from test-results/ and screenshots from brochure-assets/screenshots/
 * and produces a single self-contained HTML file with embedded media.
 *
 * Usage: node scripts/generate-brochure.js
 * Output: brochure-assets/gitbusters-brochure.html
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'brochure-assets');
const SCREENSHOTS = path.join(ASSETS, 'screenshots');
const TEST_RESULTS = path.join(ROOT, 'test-results');
const OUTPUT = path.join(ASSETS, 'gitbusters-brochure.html');

function toBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

function getScreenshots(storySlug) {
  const dir = path.join(SCREENSHOTS, storySlug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => ({
      name: f.replace('.png', '').replace(/^\d+-/, '').replace(/-/g, ' '),
      filename: f,
      data: toBase64(path.join(dir, f)),
    }));
}

/**
 * Read timestamps.json for a given story slug.
 * Returns an object mapping screenshot names to elapsed seconds, or null if not found.
 */
function getTimestamps(storySlug) {
  const file = path.join(SCREENSHOTS, storySlug, 'timestamps.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Find a video for a given spec file name from the Playwright test-results directory.
 * Playwright stores videos in directories like:
 *   test-results/stories-developer-discovery-spec-ts-Developer-Discovery-developer-discovery-flow-chromium/video.webm
 */
function findVideo(specBaseName) {
  if (!fs.existsSync(TEST_RESULTS)) return null;
  const dirs = fs.readdirSync(TEST_RESULTS);
  // Match on spec base name (e.g., "developer-discovery" matches "stories-developer-discovery-spec-ts-...")
  const matching = dirs.find(d => d.includes(specBaseName));
  if (!matching) return null;
  const videoPath = path.join(TEST_RESULTS, matching, 'video.webm');
  if (fs.existsSync(videoPath)) return toBase64(videoPath);
  return null;
}

// Also check the legacy videos directory
function getVideo(name) {
  const file = path.join(ASSETS, 'videos', `${name}.webm`);
  if (fs.existsSync(file)) return toBase64(file);
  return null;
}

// ── Story definitions ────────────────────────────────────
const sections = [
  {
    id: 'developer',
    numeral: 'I',
    title: 'The Developer Experience',
    subtitle: 'From Discovery to Payout',
    accent: '#0274B6',
    icon: '{ }',
    editorial: {
      intro: `<p class="drop-cap">Contributors are the scarce resource. In every open source ecosystem, the bottleneck is never a shortage of problems to solve — it's finding competent developers willing to solve them. GitBusters was designed from this first principle: <strong>never tax the supply side.</strong> A 5% fee on a $500 bounty means the developer sees $475 on competing platforms — and for someone evaluating whether to invest eight hours on an unfamiliar codebase, that psychological discount matters more than the economics suggest.</p>
<p>The GitBusters developer experience eliminates this friction entirely. Contributors receive <strong>exactly what's advertised.</strong> What you see is what you get. Behind the scenes, four AI agents — PRD Writer, Estimator, QA Validator, and Code Reviewer — provide the quality assurance that makes transacting with strangers viable. The escrow release is defensible because AI adjudication has already validated the work.</p>
<p>The implication for developer acquisition is clear: GitBusters can attract talent that would bypass other bounty platforms, because it's the only one where the listed reward equals the actual payout.</p>`,
      pullquote: `"Charge the maintainer a premium on top of the bounty. The contributor gets exactly what's advertised. What you see is what you get — and that builds trust at scale."`,
    },
    stories: [
      {
        id: 'developer-discovery',
        specBase: 'developer-discovery',
        slug: 'developer-discovery-flow',
        title: 'Discovery & Exploration',
        description: 'A new developer discovers the platform, explores the developer overview, browses available bounties with status filters, and dives into bounty details — all without connecting a wallet.',
        steps: [
          'Discover GitBusters and choose the developer path',
          'Explore the WSJ-styled developer overview with live stats',
          'Browse developer bounties in the back-office sidebar',
          'Filter public bounties by status — open, closed, all',
          'Open a specific bounty to inspect reward, complexity, and solutions',
          'Check the contributor leaderboard for ecosystem activity',
        ],
      },
      {
        id: 'developer-dashboard',
        specBase: 'developer-dashboard',
        slug: 'developer-dashboard-flow',
        title: 'Connected Dashboard',
        description: 'A developer connects their Ethereum wallet and accesses the personalized dashboard — tracking earnings, submission history, success rates, and available bounties matched to their profile.',
        steps: [
          'Connect an Ethereum wallet on the developer overview',
          'Navigate to the personalized developer dashboard',
          'Review earnings and submission statistics across four stat cards',
          'Inspect the full submission history table',
          'Browse available bounties surfaced by the platform',
          'Check leaderboard standing while connected',
        ],
      },
      {
        id: 'developer-bounty-deep-dive',
        specBase: 'developer-bounty-deep-dive',
        slug: 'developer-bounty-deep-dive',
        title: 'Bounty Deep Dive',
        description: 'A developer examines a bounty in detail — reviewing the reward amount, complexity rating, linked GitHub issue, existing solutions, and how-to-claim instructions before deciding whether to contribute.',
        steps: [
          'Browse the full bounty marketplace',
          'Filter bounties to show only open opportunities',
          'Select a bounty for deep inspection',
          'Review reward amount, complexity bar, and status badge',
          'Examine existing solutions and contributor activity',
          'Navigate back to the bounty listing to continue browsing',
        ],
      },
    ],
  },
  {
    id: 'maintainer',
    numeral: 'II',
    title: 'The Maintainer Experience',
    subtitle: 'Automated Trust Infrastructure',
    accent: '#1A6B3C',
    icon: '\u2442',
    editorial: {
      intro: `<p class="drop-cap">The bounty lifecycle is, at its core, a trust problem. A maintainer posts a bounty; a stranger claims to have solved it. How does the maintainer know the work is genuine? How does the contributor know the payout will arrive? Traditional platforms rely on reputation — which works until it doesn't, and fails catastrophically when the stakes are high enough to incentivize gaming.</p>
<p>GitBusters replaces reputation with <strong>automated trust infrastructure.</strong> When a maintainer creates a bounty, the platform charges a 5% creation premium — this is the revenue mechanism — and locks the full bounty amount in a smart contract escrow. Four AI agents then manage the lifecycle: the <strong>PRD Agent</strong> generates structured requirements, the <strong>Estimator</strong> prices complexity, the <strong>QA Agent</strong> validates correctness, and the <strong>Reviewer</strong> performs code review against acceptance criteria.</p>
<p>The result is that escrow release becomes an objective, auditable event rather than a subjective judgment call. The maintainer's dashboard shows every bounty created, every solution received, and every dollar invested in their ecosystem — with the confidence that AI adjudication stands behind every payout decision.</p>`,
      pullquote: `"GitBusters is not a bounty marketplace. It is an automated trust infrastructure for open source collaboration, with a payment rail attached."`,
    },
    stories: [
      {
        id: 'maintainer-onboarding',
        specBase: 'maintainer-onboarding',
        slug: 'maintainer-onboarding-flow',
        title: 'Onboarding & Overview',
        description: 'A maintainer discovers GitBusters, learns about the bounty lifecycle, reviews the fee structure and AI agent capabilities, and explores the public bounty ecosystem before signing up.',
        steps: [
          'Discover GitBusters and choose the maintainer path',
          'Review the maintainer overview with lifecycle explanation',
          'Learn about the 5% creation premium and fee structure',
          'Explore platform features and the call to action',
          'Browse the public bounty ecosystem as context',
        ],
      },
      {
        id: 'maintainer-dashboard',
        specBase: 'maintainer-dashboard',
        slug: 'maintainer-dashboard-flow',
        title: 'Dashboard & Management',
        description: 'A maintainer connects their deployer wallet and accesses the full management dashboard — reviewing bounty creation stats, monitoring incoming solutions, managing the bounty lifecycle from creation to closure.',
        steps: [
          'Connect wallet as the bounty-creating maintainer',
          'Navigate to the maintainer dashboard',
          'Review bounty statistics: created, active, spent, solutions received',
          'Inspect the bounties table with lifecycle status',
          'Monitor incoming solutions from contributors',
          'Navigate to the dedicated bounty management page',
        ],
      },
      {
        id: 'maintainer-lifecycle',
        specBase: 'maintainer-lifecycle',
        slug: 'maintainer-lifecycle-view',
        title: 'Bounty Lifecycle View',
        description: 'A maintainer reviews their bounty lifecycle — filtering by created bounties, checking closed resolutions, drilling into solution details, and monitoring their leaderboard position as an active maintainer.',
        steps: [
          'View own bounties with wallet connected',
          'Filter public bounties by "Created by me"',
          'Review closed bounties for completed resolutions',
          'Drill into a bounty to review solution details',
          'Check maintainer ranking on the leaderboard',
        ],
      },
    ],
  },
  {
    id: 'enterprise',
    numeral: 'III',
    title: 'The Enterprise Experience',
    subtitle: 'Open Source Infrastructure Insurance',
    accent: '#C5922E',
    icon: '\u25A0',
    editorial: {
      intro: `<p class="drop-cap">Companies already pay for open source maintenance. They just do it badly. They hire full-time developers to contribute upstream, fund foundations with opaque allocation processes, or — most commonly — do nothing and hope the volunteer maintainer of a critical library doesn't burn out.</p>
<p>Bounties are a more efficient mechanism, but only if there is a platform that makes it frictionless for a corporation to say: <em>"We depend on 200 open source libraries. Here is $50,000. Distribute it across the most critical issues affecting our stack."</em> That product is <strong>GitBusters Shield</strong> — an enterprise program that scans dependency manifests, auto-creates bounties on critical issues, and funds resolutions from a managed pool.</p>
<p>Three pricing tiers scale with organizational needs: <strong>Startup</strong> at $500/month covers up to 50 dependencies with community-tier agents. <strong>Growth</strong> at $2,000/month unlocks unlimited dependencies with frontier AI models. <strong>Enterprise</strong> pricing is custom — with dedicated AI agents fine-tuned on the client's codebase, SLA-backed response times, and a dedicated customer success manager.</p>`,
      pullquote: `"You don't sell bounties to enterprises. You sell them peace of mind that their open source dependency chain is being actively maintained by incentivized contributors."`,
      dataCallouts: [
        { label: 'Startup Tier', value: '$500', detail: 'per month — up to 50 dependencies' },
        { label: 'Growth Tier', value: '$2K', detail: 'per month — unlimited dependencies' },
        { label: 'Enterprise Tier', value: 'Custom', detail: 'SLA-backed, dedicated agents' },
      ],
    },
    stories: [
      {
        id: 'enterprise-shield',
        specBase: 'enterprise-shield',
        slug: 'enterprise-shield-discovery',
        title: 'Shield Program Discovery',
        description: 'An enterprise visitor discovers GitBusters Shield — reviewing the program overview, comparing pricing tiers (Startup, Growth, Enterprise), exploring features, and previewing the dependency coverage dashboard.',
        steps: [
          'Discover the enterprise offering from the landing page',
          'Enter the GitBusters Shield overview',
          'Review the three pricing tiers with feature comparison',
          'Explore Shield features and the enterprise CTA',
          'Preview the coming dependency coverage dashboard',
        ],
      },
      {
        id: 'enterprise-ecosystem',
        specBase: 'enterprise-ecosystem',
        slug: 'enterprise-ecosystem-exploration',
        title: 'Ecosystem Exploration',
        description: 'An enterprise evaluator explores the broader bounty ecosystem — browsing active and completed bounties, inspecting resolution quality, and reviewing the leaderboard to assess contributor depth.',
        steps: [
          'Explore the full bounty ecosystem',
          'Filter for active (open) bounties',
          'Review completed (closed) bounties for resolution quality',
          'Inspect a bounty in detail to assess quality standards',
          'View the ecosystem leaderboard to evaluate contributor depth',
        ],
      },
    ],
  },
  {
    id: 'admin',
    numeral: 'IV',
    title: 'Platform Administration',
    subtitle: 'Governance & Operational Transparency',
    accent: '#9E1B1D',
    icon: '\u2699',
    editorial: {
      intro: `<p class="drop-cap">Governance in a decentralized system requires radical transparency paired with strict access control. The GitBusters admin dashboard embodies this principle: every metric, every bounty, every payout is visible to platform operators — but only those operators whose wallet address matches the deployer can see the full picture.</p>
<p>The access control model is wallet-gated, not role-based. There are no usernames, no password resets, no session tokens to compromise. Either your Ethereum address is the deployer address, or you see an access denied screen. This is <strong>cryptographic authorization</strong> — the same mechanism that secures the escrow contracts also secures the admin dashboard.</p>
<p>For platform operators, the dashboard provides a comprehensive operational view: total bounties created across the platform, cumulative payouts, active user counts, system health metrics for the backend, blockchain connection status, and oracle address verification. This is the control plane for a platform that, by design, runs on trustless infrastructure.</p>`,
      pullquote: `"Either your Ethereum address is the deployer address, or you see access denied. This is cryptographic authorization — the same mechanism that secures the escrow contracts also secures the admin dashboard."`,
    },
    stories: [
      {
        id: 'admin-access',
        specBase: 'admin-access',
        slug: 'admin-access-control',
        title: 'Access Control',
        description: 'The admin access flow demonstrates wallet-gated security: unauthorized visitors see an access denied screen, non-admin wallets are rejected, and only the deployer address unlocks the full dashboard.',
        steps: [
          'Attempt admin access without connecting a wallet',
          'Connect a non-admin wallet — access is denied',
          'Connect the deployer (admin) wallet — access granted',
          'Verify the full admin dashboard is accessible',
        ],
      },
      {
        id: 'admin-operations',
        specBase: 'admin-operations',
        slug: 'admin-platform-operations',
        title: 'Platform Operations',
        description: 'The admin operations view provides platform-wide visibility: bounty metrics, payout totals, the full bounties table across all users, and system health monitoring for backend, blockchain, and oracle status.',
        steps: [
          'Access the admin dashboard with deployer wallet',
          'Review platform-wide metrics across four stat cards',
          'Monitor all bounties across the platform',
          'Inspect the full bounties data table',
          'Check system health: backend, blockchain, and oracle',
        ],
      },
    ],
  },
];

// ── Count totals ────────────────────────────────────────
const totalStories = sections.reduce((n, s) => n + s.stories.length, 0);
const allScreenshots = sections.flatMap(s =>
  s.stories.map(st => getScreenshots(st.slug))
);
const totalScreenshots = allScreenshots.reduce((n, arr) => n + arr.length, 0);
const totalVideos = sections.reduce((n, s) =>
  n + s.stories.filter(st => findVideo(st.specBase) || getVideo(st.id)).length, 0
);

const today = new Date().toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
});

// ── Build section HTML ──────────────────────────────────

/**
 * Build the step data JSON for the custom video player.
 * Merges story.steps with timestamps from the timestamps.json file.
 */
function buildStepData(story) {
  const timestamps = getTimestamps(story.slug);
  const screenshots = getScreenshots(story.slug);

  // Map screenshot names (sorted) to timestamp values
  const screenshotNames = screenshots.map(s => s.filename.replace('.png', ''));

  const rawSteps = story.steps.map((label, i) => {
    const screenshotName = screenshotNames[i] || null;
    const time = (timestamps && screenshotName && timestamps[screenshotName] !== undefined)
      ? timestamps[screenshotName]
      : 0;
    return {
      name: screenshotName || `step-${i + 1}`,
      time,
      label,
    };
  });

  // Normalize: subtract the first step's timestamp so step 1 starts at time 0
  const firstTime = rawSteps.length > 0 ? rawSteps[0].time : 0;
  return rawSteps.map(s => ({
    ...s,
    time: Math.round(Math.max(0, s.time - firstTime) * 100) / 100,
  }));
}

function buildStoryHtml(story, sectionAccent) {
  const video = findVideo(story.specBase) || getVideo(story.id);
  const screenshots = getScreenshots(story.slug);
  const stepData = buildStepData(story);

  let videoHtml;
  if (video) {
    const stepsJson = JSON.stringify(stepData).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    videoHtml = `<div class="video-player" data-steps="${stepsJson}" data-accent="${sectionAccent}">
        <div class="video-container">
          <video src="data:video/webm;base64,${video}" class="player-video" muted playsinline autoplay></video>
        </div>
        <div class="player-timeline">
          <div class="player-timeline-track"></div>
          <div class="player-timeline-progress"></div>
          ${stepData.map((s, i) => {
            const pct = (i / stepData.length) * 100;
            return `<div class="step-marker${i === 0 ? ' active' : ''}" data-step="${i}" style="left: ${pct}%">
              <div class="step-dot">${i + 1}</div>
            </div>`;
          }).join('\n')}
        </div>
        <div class="step-description">
          <span class="step-num">1</span>
          <span class="step-text">${stepData[0] ? stepData[0].label : ''}</span>
        </div>
      </div>`;
  } else {
    videoHtml = '<p class="no-video">Video recording not yet available — run <code>make test-stories</code> to generate</p>';
  }

  const stepsHtml = story.steps.map((s, i) =>
    `<li class="timeline-item">
      <div class="timeline-dot" style="--dot-color: ${sectionAccent}"></div>
      <div class="timeline-content">
        <span class="timeline-num">${i + 1}</span>
        <span>${s}</span>
      </div>
    </li>`
  ).join('\n');

  const screenshotsHtml = screenshots.length > 0
    ? `<details class="screenshots-toggle">
        <summary>View ${screenshots.length} screenshots from this story</summary>
        <div class="screenshots-grid">
          ${screenshots.map(s =>
            `<figure class="screenshot-fig">
              <img src="data:image/png;base64,${s.data}" alt="${s.name}" loading="lazy" />
              <figcaption>${s.name}</figcaption>
            </figure>`
          ).join('\n')}
        </div>
      </details>`
    : '';

  return `
    <div class="story-block">
      <h3 class="story-title">${story.title}</h3>
      <p class="story-description">${story.description}</p>
      ${videoHtml}
      <div class="timeline-container">
        <h4 class="timeline-heading">User Journey</h4>
        <ol class="timeline-list">
          ${stepsHtml}
        </ol>
      </div>
      ${screenshotsHtml}
    </div>
  `;
}

function buildSectionHtml(section) {
  const storiesHtml = section.stories.map(st => buildStoryHtml(st, section.accent)).join('\n');

  const dataCalloutsHtml = section.editorial.dataCallouts
    ? `<div class="data-callouts-row">
        ${section.editorial.dataCallouts.map(c =>
          `<div class="data-callout">
            <p class="callout-label">${c.label}</p>
            <p class="callout-value" style="color: ${section.accent}">${c.value}</p>
            <p class="callout-detail">${c.detail}</p>
          </div>`
        ).join('\n')}
      </div>`
    : '';

  return `
    <hr class="section-rule" />

    <section class="role-section" id="section-${section.id}">
      <div class="section-header">
        <span class="section-icon" style="background: ${section.accent}">${section.icon}</span>
        <div>
          <h2 class="section-numeral">${section.numeral}. ${section.title}</h2>
          <p class="section-subtitle">${section.subtitle}</p>
        </div>
      </div>

      <div class="editorial-intro">
        ${section.editorial.intro}
      </div>

      <blockquote class="pullquote">
        ${section.editorial.pullquote}
      </blockquote>

      ${dataCalloutsHtml}

      ${storiesHtml}
    </section>
  `;
}

const sectionsHtml = sections.map(buildSectionHtml).join('\n');

// ── Feature grid (dark inverted section) ────────────────
const featureGridHtml = `
  <div class="dark-section">
    <h3 class="dark-section-title">What Each Role Gets</h3>
    <p class="dark-section-subtitle">Platform capabilities by user type</p>
    <div class="feature-grid">
      <div class="feature-grid-header">
        <div class="feature-grid-cell feature-grid-label"></div>
        <div class="feature-grid-cell feature-grid-role" style="border-bottom-color: #0274B6">Developer</div>
        <div class="feature-grid-cell feature-grid-role" style="border-bottom-color: #1A6B3C">Maintainer</div>
        <div class="feature-grid-cell feature-grid-role" style="border-bottom-color: #C5922E">Enterprise</div>
        <div class="feature-grid-cell feature-grid-role" style="border-bottom-color: #9E1B1D">Admin</div>
      </div>
      ${[
        ['Browse Bounties', true, true, true, true],
        ['Submit Solutions', true, false, false, false],
        ['Create Bounties', false, true, true, false],
        ['Wallet Dashboard', true, true, false, true],
        ['AI Agent Review', true, true, true, false],
        ['Escrow Management', false, true, true, false],
        ['Dependency Scanning', false, false, true, false],
        ['Platform Metrics', false, false, false, true],
        ['System Health', false, false, false, true],
        ['Leaderboard', true, true, true, true],
      ].map(([feature, ...roles]) =>
        `<div class="feature-grid-row">
          <div class="feature-grid-cell feature-grid-label">${feature}</div>
          ${roles.map(has =>
            `<div class="feature-grid-cell">${has ? '<span class="check">&#10003;</span>' : '<span class="cross">&mdash;</span>'}</div>`
          ).join('')}
        </div>`
      ).join('\n')}
    </div>
  </div>
`;

// ── Assemble full HTML ──────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GitBusters — Product Brochure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --wsj-bg: #FBF9F6;
      --wsj-cream: #F5F1EB;
      --wsj-rule: #C4B9A7;
      --wsj-accent: #0274B6;
      --wsj-dark: #111111;
      --wsj-muted: #666666;
      --wsj-highlight: #E8DFD0;
      --wsj-red: #9E1B1D;
      --wsj-green: #1A6B3C;
      --wsj-gold: #C5922E;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      background: var(--wsj-bg);
      color: var(--wsj-dark);
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }

    .font-headline { font-family: 'Playfair Display', Georgia, serif; }
    .font-body { font-family: 'Source Serif 4', Georgia, serif; }
    .font-sans { font-family: 'Inter', system-ui, sans-serif; }

    /* ── Drop Caps ── */
    .drop-cap::first-letter {
      font-family: 'Playfair Display', Georgia, serif;
      float: left;
      font-size: 3.2rem;
      line-height: 0.8;
      padding-right: 0.6rem;
      padding-top: 0.2rem;
      font-weight: 900;
      color: var(--wsj-dark);
    }

    /* ── Rules ── */
    .section-rule {
      border: none;
      border-top: 1px solid var(--wsj-rule);
      margin: 3rem 0;
    }
    .double-rule {
      border: none;
      border-top: 3px double var(--wsj-dark);
      margin: 2rem 0;
    }

    /* ── Pullquote ── */
    .pullquote {
      border-left: 4px solid var(--wsj-accent);
      padding: 1rem 1.5rem;
      margin: 2rem 0;
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 1.1rem;
      line-height: 1.65;
      color: #333;
    }

    /* ── Layout ── */
    .container { max-width: 900px; margin: 0 auto; padding: 0 1.5rem; }

    /* ── Masthead ── */
    .masthead {
      border-bottom: 2px solid var(--wsj-dark);
      padding-bottom: 0.5rem;
      margin-bottom: 0.25rem;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .masthead-sub {
      border-bottom: 1px solid var(--wsj-rule);
      padding-bottom: 0.25rem;
    }
    .masthead-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--wsj-muted);
    }
    .masthead-date {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
      color: var(--wsj-muted);
    }
    .masthead-confidential {
      font-family: 'Inter', sans-serif;
      font-size: 0.6rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--wsj-muted);
    }

    /* ── Hero ── */
    .hero {
      text-align: center;
      padding: 3rem 0 2rem;
    }
    .hero h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(2.5rem, 6vw, 3.8rem);
      font-weight: 900;
      line-height: 1.08;
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
    }
    .hero .tagline {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 1.25rem;
      color: var(--wsj-muted);
      max-width: 640px;
      margin: 0 auto 1rem;
      line-height: 1.5;
    }
    .hero-tags {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .hero-tag {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--wsj-muted);
    }
    .hero-sep { color: var(--wsj-rule); }

    /* ── Executive Summary Stats ── */
    .exec-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 2rem 0;
    }
    .exec-stat {
      background: var(--wsj-cream);
      border-left: 4px solid var(--wsj-accent);
      padding: 1rem 1.25rem;
      border-radius: 0 4px 4px 0;
    }
    .exec-stat-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--wsj-muted);
      margin-bottom: 0.25rem;
    }
    .exec-stat-value {
      font-family: 'Playfair Display', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--wsj-accent);
    }
    .exec-stat-detail {
      font-family: 'Source Serif 4', serif;
      font-size: 0.75rem;
      color: var(--wsj-muted);
      margin-top: 0.15rem;
    }

    /* ── Navigation Cards ── */
    .nav-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 2rem 0 3rem;
    }
    .nav-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 0.75rem;
      background: var(--wsj-cream);
      border: 1px solid var(--wsj-rule);
      border-radius: 6px;
      text-decoration: none;
      color: var(--wsj-dark);
      transition: all 0.2s;
    }
    .nav-card:hover {
      border-color: var(--wsj-accent);
      box-shadow: 0 2px 12px rgba(2,116,182,0.1);
      transform: translateY(-2px);
    }
    .nav-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .nav-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .nav-count {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      color: var(--wsj-muted);
    }

    /* ── Section Headers ── */
    .role-section { margin-bottom: 4rem; }
    .section-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .section-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.4rem;
      font-weight: bold;
      flex-shrink: 0;
    }
    .section-numeral {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.8rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .section-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--wsj-muted);
      margin-top: 0.15rem;
    }

    /* ── Editorial Intro ── */
    .editorial-intro {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 0.92rem;
      line-height: 1.75;
      margin-bottom: 1.5rem;
    }
    .editorial-intro p {
      margin-bottom: 1rem;
    }
    .editorial-intro strong {
      color: var(--wsj-dark);
    }
    .editorial-intro em {
      color: #444;
    }

    /* ── Data Callouts ── */
    .data-callouts-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin: 2rem 0;
    }
    .data-callout {
      background: var(--wsj-cream);
      border-left: 4px solid var(--wsj-accent);
      padding: 1.25rem;
      border-radius: 0 4px 4px 0;
    }
    .callout-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--wsj-muted);
      margin-bottom: 0.25rem;
    }
    .callout-value {
      font-family: 'Playfair Display', serif;
      font-size: 2rem;
      font-weight: 700;
    }
    .callout-detail {
      font-family: 'Source Serif 4', serif;
      font-size: 0.8rem;
      color: var(--wsj-muted);
      margin-top: 0.15rem;
    }

    /* ── Story Blocks ── */
    .story-block {
      margin: 2.5rem 0;
      padding-top: 1.5rem;
      border-top: 1px solid var(--wsj-rule);
    }
    .story-block:first-of-type {
      border-top: none;
      padding-top: 0;
    }
    .story-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .story-description {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 0.9rem;
      line-height: 1.6;
      color: #444;
      margin-bottom: 1.5rem;
    }

    /* ── Legacy Video (fallback for no-video) ── */
    .no-video {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: var(--wsj-muted);
      font-style: italic;
      padding: 2rem;
      text-align: center;
      background: var(--wsj-cream);
      border: 1px dashed var(--wsj-rule);
      border-radius: 8px;
      margin: 1.5rem 0 2rem;
    }
    .no-video code {
      background: rgba(0,0,0,0.06);
      padding: 0.15em 0.4em;
      border-radius: 3px;
      font-size: 0.85em;
    }

    /* ── Custom Video Player ── */
    .video-player {
      margin: 1.5rem 0 2rem;
    }
    .video-container {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      border: 1px solid var(--wsj-rule);
      background: #000;
      pointer-events: none;
    }
    .player-video {
      width: 100%;
      display: block;
      background: #000;
    }

    /* ── Player Timeline ── */
    .player-timeline {
      position: relative;
      height: 40px;
      margin: 0.25rem 14px;
      cursor: pointer;
    }
    .player-timeline-track {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--wsj-cream);
      border: 1px solid var(--wsj-rule);
      border-radius: 2px;
      transform: translateY(-50%);
    }
    .player-timeline-progress {
      position: absolute;
      top: 50%;
      left: 0;
      height: 4px;
      width: 0%;
      background: var(--wsj-accent);
      border-radius: 2px;
      transform: translateY(-50%);
      transition: width 0.1s linear;
    }

    /* ── Step Markers ── */
    .step-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
      cursor: pointer;
    }
    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: white;
      border: 2px solid var(--wsj-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--wsj-accent);
      transition: all 0.2s;
    }
    .step-marker:hover .step-dot {
      transform: scale(1.12);
      box-shadow: 0 2px 8px rgba(2,116,182,0.25);
    }
    .step-marker.active .step-dot {
      background: var(--wsj-accent);
      color: white;
      width: 32px;
      height: 32px;
      font-size: 0.7rem;
      box-shadow: 0 2px 12px rgba(2,116,182,0.3);
    }

    /* ── Step Description ── */
    .step-description {
      background: var(--wsj-cream);
      border-left: 4px solid var(--wsj-accent);
      border-radius: 0 6px 6px 0;
      padding: 0.75rem 1.25rem;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 44px;
    }
    .step-description .step-num {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--wsj-accent);
      background: white;
      border: 2px solid var(--wsj-accent);
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .step-description .step-text {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 0.88rem;
      color: var(--wsj-dark);
      line-height: 1.4;
    }

    /* ── Timeline Steps ── */
    .timeline-container {
      background: var(--wsj-cream);
      border: 1px solid var(--wsj-rule);
      border-radius: 6px;
      padding: 1.5rem 1.5rem 1.5rem 2rem;
      margin-bottom: 1.5rem;
    }
    .timeline-heading {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--wsj-muted);
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .timeline-list {
      list-style: none;
      position: relative;
      padding-left: 1rem;
    }
    .timeline-list::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: var(--wsj-rule);
    }
    .timeline-item {
      position: relative;
      padding: 0.4rem 0 0.4rem 1.25rem;
    }
    .timeline-dot {
      position: absolute;
      left: -6px;
      top: 0.65rem;
      width: 12px;
      height: 12px;
      background: var(--dot-color, var(--wsj-accent));
      border-radius: 50%;
      border: 2px solid var(--wsj-bg);
    }
    .timeline-content {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 0.88rem;
      color: var(--wsj-dark);
    }
    .timeline-num {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--wsj-muted);
      min-width: 1.1rem;
      padding-top: 0.15rem;
    }

    /* ── Screenshots ── */
    .screenshots-toggle {
      margin-top: 1rem;
    }
    .screenshots-toggle summary {
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--wsj-accent);
      cursor: pointer;
      padding: 0.75rem 0;
    }
    .screenshots-toggle summary:hover {
      text-decoration: underline;
    }
    .screenshots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .screenshot-fig {
      background: white;
      border: 1px solid var(--wsj-rule);
      border-radius: 6px;
      overflow: hidden;
    }
    .screenshot-fig img {
      width: 100%;
      display: block;
    }
    .screenshot-fig figcaption {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      color: var(--wsj-muted);
      padding: 0.5rem 0.75rem;
      text-transform: capitalize;
      border-top: 1px solid var(--wsj-rule);
    }

    /* ── Dark Inverted Section ── */
    .dark-section {
      background: var(--wsj-dark);
      color: #f0ede8;
      padding: 3rem 2rem;
      border-radius: 8px;
      margin: 3rem 0;
    }
    .dark-section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.25rem;
    }
    .dark-section-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #999;
      text-align: center;
      margin-bottom: 2rem;
    }
    .feature-grid {
      max-width: 700px;
      margin: 0 auto;
    }
    .feature-grid-header {
      display: grid;
      grid-template-columns: 2fr repeat(4, 1fr);
      border-bottom: 2px solid #444;
      padding-bottom: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .feature-grid-row {
      display: grid;
      grid-template-columns: 2fr repeat(4, 1fr);
      border-bottom: 1px solid #333;
      padding: 0.5rem 0;
    }
    .feature-grid-cell {
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
    }
    .feature-grid-label {
      font-weight: 500;
    }
    .feature-grid-role {
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 3px solid;
      padding-bottom: 0.5rem;
      justify-content: center;
    }
    .feature-grid-cell:not(.feature-grid-label) {
      justify-content: center;
    }
    .check { color: #4ade80; font-weight: bold; font-size: 1rem; }
    .cross { color: #666; }

    /* ── Closing ── */
    .closing-quote {
      text-align: center;
      padding: 2rem 0;
      border-top: 3px double var(--wsj-dark);
      border-bottom: 3px double var(--wsj-dark);
      margin: 3rem 0;
    }
    .closing-quote p {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.2rem;
      font-style: italic;
      color: var(--wsj-muted);
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ── Footer ── */
    .brochure-footer {
      border-top: 1px solid var(--wsj-rule);
      padding: 2rem 0;
      margin-top: 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-text {
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      color: var(--wsj-muted);
    }

    /* ── Responsive ── */
    @media (max-width: 700px) {
      .exec-stats { grid-template-columns: repeat(2, 1fr); }
      .nav-cards { grid-template-columns: repeat(2, 1fr); }
      .data-callouts-row { grid-template-columns: 1fr; }
      .feature-grid-header,
      .feature-grid-row { grid-template-columns: 2fr repeat(4, 1fr); font-size: 0.7rem; }
      .hero h1 { font-size: 2rem; }
      .step-dot { width: 22px; height: 22px; font-size: 0.55rem; }
      .step-marker.active .step-dot { width: 26px; height: 26px; font-size: 0.6rem; }
    }

    /* ── Print ── */
    @media print {
      body { background: white; font-size: 12px; }
      .screenshots-toggle { display: none; }
      .video-player { page-break-inside: avoid; }
      .role-section { page-break-inside: avoid; }
      .dark-section { background: #333; }
      .story-block { page-break-inside: avoid; }
      .data-callout, .pullquote { page-break-inside: avoid; }
      h2, h3, h4 { page-break-after: avoid; }
      .section-rule { margin: 1.5rem 0; }
      .double-rule { margin: 1rem 0; }
      .player-timeline { display: none; }
      .step-description { display: none; }
    }
  </style>
</head>
<body>

  <div class="container">

    <!-- ─── MASTHEAD ─── -->
    <header style="padding-top: 2.5rem; padding-bottom: 1rem;">
      <div class="masthead">
        <span class="masthead-label">GitBusters Product Review</span>
        <span class="masthead-date">${today}</span>
      </div>
      <div class="masthead-sub">
        <span class="masthead-confidential">Confidential — Product Brochure</span>
      </div>
    </header>

    <!-- ─── HERO ─── -->
    <section class="hero">
      <hr class="double-rule" />
      <h1>
        The Bounty Platform<br/>in Motion
      </h1>
      <p class="tagline">
        Ten user stories across four roles — the blockchain-powered<br/>
        bounty system for open source, recorded end-to-end
      </p>
      <hr class="double-rule" />
      <div class="hero-tags">
        <span class="hero-tag">Smart Contract Escrow</span>
        <span class="hero-sep">|</span>
        <span class="hero-tag">AI-Powered Review</span>
        <span class="hero-sep">|</span>
        <span class="hero-tag">GitHub Native</span>
      </div>
    </section>

    <!-- ─── EXECUTIVE SUMMARY ─── -->
    <section style="margin-bottom: 2rem;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; border-bottom: 1px solid var(--wsj-rule); padding-bottom: 0.5rem;">Executive Summary</h2>

      <div class="editorial-intro">
        <p class="drop-cap">What follows is a comprehensive product brochure generated from automated recordings of the complete GitBusters experience across four perspectives. Each video captures a real user journey — from landing page to connected dashboard — running against a live local blockchain with seeded bounty data. Every wallet connection, every dashboard metric, and every page transition is genuine, produced by Playwright end-to-end tests executing against the production Next.js application.</p>
        <p>The platform serves three audiences: <strong>developers</strong> who earn ETH by solving bounties, <strong>maintainers</strong> who fund issue resolution through smart contract escrow, and <strong>enterprises</strong> that insure their open source dependency chain through the GitBusters Shield program. A fourth view — the <strong>admin dashboard</strong> — provides platform-wide operational visibility with cryptographic wallet-gated access control.</p>
      </div>

      <div class="exec-stats">
        <div class="exec-stat">
          <div class="exec-stat-label">User Stories</div>
          <div class="exec-stat-value">${totalStories}</div>
          <div class="exec-stat-detail">Focused journeys</div>
        </div>
        <div class="exec-stat">
          <div class="exec-stat-label">Screenshots</div>
          <div class="exec-stat-value">${totalScreenshots}</div>
          <div class="exec-stat-detail">Step-by-step captures</div>
        </div>
        <div class="exec-stat">
          <div class="exec-stat-label">Video Recordings</div>
          <div class="exec-stat-value">${totalVideos}</div>
          <div class="exec-stat-detail">Full story recordings</div>
        </div>
        <div class="exec-stat">
          <div class="exec-stat-label">Roles Covered</div>
          <div class="exec-stat-value">4</div>
          <div class="exec-stat-detail">Dev, Maint, Corp, Admin</div>
        </div>
      </div>
    </section>

    <!-- ─── TABLE OF CONTENTS ─── -->
    <nav class="nav-cards">
      ${sections.map(s =>
        `<a href="#section-${s.id}" class="nav-card">
          <span class="nav-icon" style="background: ${s.accent}">${s.icon}</span>
          <span class="nav-label">${s.id === 'admin' ? 'Admin' : s.id.charAt(0).toUpperCase() + s.id.slice(1)}</span>
          <span class="nav-count">${s.stories.length} stories</span>
        </a>`
      ).join('\n')}
    </nav>

    <!-- ─── INTRO PULLQUOTE ─── -->
    <blockquote class="pullquote">
      "GitBusters operates at the intersection of three converging trends: the professionalization of open source maintenance, the rise of AI-assisted software development, and the maturation of blockchain-based payment infrastructure."
    </blockquote>

    <!-- ─── ROLE SECTIONS ─── -->
    ${sectionsHtml}

    <!-- ─── FEATURE GRID (DARK SECTION) ─── -->
    ${featureGridHtml}

    <!-- ─── CONCLUSION ─── -->
    <section style="margin-bottom: 2rem;">
      <hr class="section-rule" />
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; border-bottom: 1px solid var(--wsj-rule); padding-bottom: 0.5rem;">Conclusion</h2>
      <div class="editorial-intro">
        <p class="drop-cap">The ten stories presented in this brochure demonstrate something that a feature list or pitch deck cannot: the platform works. Not as a prototype, not as a design mockup, but as a functioning application where wallets connect, dashboards populate, bounties display with real on-chain data, and access control enforces cryptographic authorization in real time.</p>
        <p>The structural advantage of GitBusters lies not in any single feature but in the integration of three components that have never been combined: <strong>smart contract escrow</strong> for trustless payments, <strong>AI agent adjudication</strong> for quality assurance, and <strong>GitHub-native workflow</strong> for developer adoption. The fee structure charges the maintainer, not the contributor — ensuring the scarce resource (developer talent) faces zero friction. The enterprise tier reframes bounty funding as infrastructure insurance. And the admin dashboard provides the governance transparency that institutional operators require.</p>
        <p>The implication is clear: GitBusters is not a bounty marketplace. It is the trust layer for open source collaboration, with a payment rail attached. Build the trust layer first. The revenue follows.</p>
      </div>
    </section>

    <!-- ─── CLOSING QUOTE ─── -->
    <div class="closing-quote">
      <p>"Build the trust layer first.<br/>The revenue follows."</p>
    </div>

    <!-- ─── FOOTER ─── -->
    <footer class="brochure-footer">
      <span class="footer-text">&copy; 2026 GitBusters. Generated from automated E2E test recordings.</span>
      <span class="footer-text">${today}</span>
    </footer>

  </div>

  <!-- ─── CUSTOM VIDEO PLAYER JS ─── -->
  <script>
  (function() {
    'use strict';

    function initPlayer(playerEl) {
      var stepsRaw = playerEl.getAttribute('data-steps');
      var accent = playerEl.getAttribute('data-accent') || '#0274B6';
      var steps;
      try {
        steps = JSON.parse(stepsRaw);
      } catch (e) {
        console.warn('Failed to parse steps data', e);
        return;
      }
      if (!steps || steps.length === 0) return;

      var video = playerEl.querySelector('.player-video');
      var progressBar = playerEl.querySelector('.player-timeline-progress');
      var markers = playerEl.querySelectorAll('.step-marker');
      var descNum = playerEl.querySelector('.step-description .step-num');
      var descText = playerEl.querySelector('.step-description .step-text');

      var currentStep = 0;
      var loopStart = 0;
      var loopEnd = 0;

      // Apply accent color to elements
      markers.forEach(function(m) {
        var dot = m.querySelector('.step-dot');
        dot.style.borderColor = accent;
        dot.style.color = accent;
      });
      var activeMarker = playerEl.querySelector('.step-marker.active .step-dot');
      if (activeMarker) {
        activeMarker.style.background = accent;
        activeMarker.style.color = 'white';
        activeMarker.style.borderColor = accent;
      }
      progressBar.style.background = accent;
      var descBox = playerEl.querySelector('.step-description');
      if (descBox) descBox.style.borderLeftColor = accent;
      var numCircle = playerEl.querySelector('.step-description .step-num');
      if (numCircle) {
        numCircle.style.borderColor = accent;
        numCircle.style.color = accent;
      }

      function setActiveStep(idx) {
        currentStep = idx;
        markers.forEach(function(m, i) {
          var dot = m.querySelector('.step-dot');
          if (i === idx) {
            m.classList.add('active');
            dot.style.background = accent;
            dot.style.color = 'white';
            dot.style.borderColor = accent;
          } else {
            m.classList.remove('active');
            dot.style.background = 'white';
            dot.style.color = accent;
            dot.style.borderColor = accent;
          }
        });
        if (descNum) descNum.textContent = idx + 1;
        if (descText && steps[idx]) descText.textContent = steps[idx].label;
      }

      function seekToStep(idx) {
        if (idx < 0 || idx >= steps.length) return;
        setActiveStep(idx);
        loopStart = steps[idx].time;
        loopEnd = (idx + 1 < steps.length) ? steps[idx + 1].time : video.duration || (steps[idx].time + 10);
        video.currentTime = loopStart;
        video.playbackRate = 0.5;
        video.play();
      }

      // Step marker clicks — switch to that segment
      markers.forEach(function(marker) {
        marker.addEventListener('click', function(e) {
          e.stopPropagation();
          var idx = parseInt(marker.getAttribute('data-step'), 10);
          seekToStep(idx);
        });
      });

      // Loop the current segment
      video.addEventListener('timeupdate', function() {
        var t = video.currentTime;
        var n = steps.length;

        // Progress bar: map current time to the equal-spaced position
        // Each step occupies 1/n of the bar; interpolate within the current segment
        var segStart = currentStep / n;
        var segEnd = (currentStep + 1) / n;
        var segTime = loopEnd - loopStart;
        var segProgress = segTime > 0 ? (t - loopStart) / segTime : 0;
        var pct = (segStart + segProgress * (segEnd - segStart)) * 100;
        progressBar.style.width = Math.min(Math.max(pct, 0), 100) + '%';

        // Loop: when reaching the end of the current segment, restart it
        if (t >= loopEnd) {
          video.currentTime = loopStart;
        }
      });

      video.addEventListener('ended', function() {
        video.currentTime = loopStart;
        video.play();
      });

      // Autoplay first step at 0.5x
      seekToStep(0);
    }

    // Initialize all video players on page load
    document.addEventListener('DOMContentLoaded', function() {
      var players = document.querySelectorAll('.video-player');
      players.forEach(initPlayer);
    });
  })();
  </script>

</body>
</html>`;

// ── Write output ────────────────────────────────────────
fs.mkdirSync(ASSETS, { recursive: true });
fs.writeFileSync(OUTPUT, html);

console.log(`\nBrochure generated: ${OUTPUT}`);
console.log(`  Sections:     ${sections.length}`);
console.log(`  Stories:      ${totalStories}`);
console.log(`  Screenshots:  ${totalScreenshots}`);
console.log(`  Videos:       ${totalVideos}`);
console.log(`  File size:    ${(fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1)} MB\n`);

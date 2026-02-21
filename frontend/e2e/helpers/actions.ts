import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

// ── Navigation ──────────────────────────────────────────

export async function navigateTo(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
}

export async function clickRole(
  page: Page,
  role: 'developer' | 'maintainer' | 'enterprise'
) {
  await page.getByTestId(`landing-card-${role}`).click();
  await page.waitForURL(`**/${role}**`);
}

// ── Bounties ────────────────────────────────────────────

export async function searchBounties(page: Page, query: string) {
  const input = page.getByTestId('bounties-search');
  await input.fill(query);
}

export async function sortBounties(
  page: Page,
  by: 'newest' | 'oldest' | 'highest' | 'complex' | 'solutions'
) {
  const select = page.getByTestId('bounties-sort');
  await select.selectOption(by);
}

export async function filterBounties(
  page: Page,
  status: 'all' | 'open' | 'closed' | 'cancelled'
) {
  await page.getByTestId(`bounties-filter-${status}`).click();
}

export async function openBountyDetail(page: Page, bountyId: number) {
  await page.getByTestId(`bounty-card-${bountyId}`).click();
  await page.waitForURL(`**/bounties/${bountyId}`);
}

export async function verifyBountyCard(
  page: Page,
  bountyId: number,
  expected: { status?: string; repo?: string }
) {
  const card = page.getByTestId(`bounty-card-${bountyId}`);
  await expect(card).toBeVisible();
  if (expected.status) {
    await expect(card.getByTestId(`status-badge-${expected.status}`)).toBeVisible();
  }
  if (expected.repo) {
    await expect(card).toContainText(expected.repo);
  }
}

// ── GitHub Links ────────────────────────────────────────

export async function verifyGitHubLink(
  page: Page,
  testId: string,
  expectedUrl: string
) {
  const link = page.getByTestId(testId);
  await expect(link).toHaveAttribute('href', expectedUrl);
  await expect(link).toHaveAttribute('target', '_blank');
}

// ── Leaderboard ─────────────────────────────────────────

export async function filterLeaderboard(
  page: Page,
  role: 'all' | 'contributor' | 'maintainer'
) {
  await page.getByTestId(`leaderboard-filter-${role}`).click();
}

export async function verifyLeaderboardRow(
  page: Page,
  index: number,
  expected: { address?: string }
) {
  const row = page.getByTestId(`leaderboard-row-${index}`);
  await expect(row).toBeVisible();
  if (expected.address) {
    await expect(row).toContainText(expected.address);
  }
}

// ── Back Office ─────────────────────────────────────────

export async function navigateBackoffice(page: Page, section: string) {
  await page
    .getByTestId(`sidebar-link-${section.toLowerCase().replace(/\s/g, '-')}`)
    .click();
}

export async function verifySummaryCard(
  page: Page,
  testId: string,
  expected: { label?: string; value?: string }
) {
  const card = page.getByTestId(testId);
  await expect(card).toBeVisible();
  if (expected.label) {
    await expect(card).toContainText(expected.label);
  }
  if (expected.value) {
    await expect(card).toContainText(expected.value);
  }
}

// ── Wallet (placeholder) ────────────────────────────────

export async function connectWallet(page: Page) {
  // Placeholder: MetaMask/wallet connection requires browser extension
  // In E2E tests, mock the wallet provider or use a test harness
}

export async function disconnectWallet(page: Page) {
  // Placeholder
}

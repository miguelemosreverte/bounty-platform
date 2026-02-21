import { test, expect } from '@playwright/test';
import { BountyDetailPage } from './pages/bounty-detail.page';

test.describe('Bounty Detail Page', () => {
  let detail: BountyDetailPage;

  test.beforeEach(async ({ page }) => {
    detail = new BountyDetailPage(page);
  });

  test('bounty detail page loads for valid ID', async ({ page }) => {
    await detail.goto('1');
    await page.waitForLoadState('networkidle');

    // Verify the page loaded with bounty content
    await expect(page.getByText('Bounty #1')).toBeVisible();

    // Verify details section is rendered
    await expect(page.getByText('Details')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await expect(page.getByText('ETH')).toBeVisible();
  });

  test('shows status badge', async ({ page }) => {
    await detail.goto('1');
    await page.waitForLoadState('networkidle');

    // A status badge should be present (open, closed, or cancelled)
    const badge = page.locator('[data-testid^="status-badge-"]');
    await expect(badge.first()).toBeVisible();

    // Verify the status is one of the expected values
    const status = await detail.getStatus();
    expect(['open', 'closed', 'cancelled', 'paid']).toContain(status);
  });

  test('shows GitHub links', async ({ page }) => {
    await detail.goto('1');
    await page.waitForLoadState('networkidle');

    // The page should have GitHub links (repo link and issue link)
    // GitHubLink components render as <a> tags with target="_blank"
    const githubLinks = page.locator('a[target="_blank"]');
    await expect(githubLinks.first()).toBeVisible();
    expect(await githubLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test('shows solutions section', async ({ page }) => {
    await detail.goto('1');
    await page.waitForLoadState('networkidle');

    // The solutions heading should always be present
    await expect(page.getByRole('heading', { name: 'Solutions' })).toBeVisible();

    // Either shows "No solutions submitted yet" or solution items
    const noSolutions = page.getByText('No solutions submitted yet');
    const solutionItems = detail.getSolutions();

    const hasNoSolutions = await noSolutions.isVisible().catch(() => false);
    const hasSolutions = await solutionItems.count() > 0;

    // One of these must be true
    expect(hasNoSolutions || hasSolutions).toBeTruthy();
  });
});

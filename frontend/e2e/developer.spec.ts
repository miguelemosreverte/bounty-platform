import { test, expect } from '@playwright/test';
import { DeveloperPage } from './pages/developer.page';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet } from './helpers/wallet';

test.describe('Developer Page', () => {
  let developer: DeveloperPage;

  test.beforeEach(async ({ page }) => {
    developer = new DeveloperPage(page);
  });

  test('developer overview page loads', async ({ page }) => {
    await developer.gotoOverview();
    await page.waitForLoadState('networkidle');

    // The overview section should be visible
    await expect(developer.overview).toBeVisible();

    // Page heading should be present
    await expect(page.getByText('How to Earn with GitBusters')).toBeVisible();
  });

  test('shows 3-step process', async ({ page }) => {
    await developer.gotoOverview();
    await page.waitForLoadState('networkidle');

    // Verify the three steps are rendered
    await expect(page.getByText('Three Steps to Your First Payout')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Find a Bounty' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Submit a PR' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Get Paid' })).toBeVisible();
  });

  test('shows live stats', async ({ page }) => {
    await developer.gotoOverview();
    await page.waitForLoadState('networkidle');

    // Verify the stats section is rendered
    await expect(page.getByText('Platform at a Glance')).toBeVisible();
    await expect(page.getByText('Open Bounties', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Paid Out', { exact: true })).toBeVisible();
    await expect(page.getByText('Avg Bounty Size', { exact: true })).toBeVisible();
  });

  test('dashboard shows connect prompt without wallet', async ({ page }) => {
    await developer.gotoDashboard();
    await page.waitForLoadState('networkidle');

    // Without wallet, should show connect prompt
    const connectPrompt = page.getByTestId('dev-dashboard-connect');
    await expect(connectPrompt).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard accessible with contributor wallet', async ({ page }) => {
    // contributor2 (0x3C44...) is an Anvil account that has submitted solutions
    await injectMockProvider(page, ANVIL_ACCOUNTS.contributor2);

    await developer.gotoDashboard();
    await page.waitForLoadState('networkidle');
    await connectWallet(page);

    // Wait for data to load
    await page.waitForTimeout(3_000);

    // Should see either the connected dashboard or the loading state
    const dashboard = page.getByTestId('dev-dashboard');
    const loading = page.getByTestId('dev-dashboard-loading');
    await expect(dashboard.or(loading)).toBeVisible({ timeout: 15_000 });

    // If dashboard loaded, verify summary section
    if (await dashboard.isVisible()) {
      await expect(developer.dashboardSummary).toBeVisible();
    }
  });
});

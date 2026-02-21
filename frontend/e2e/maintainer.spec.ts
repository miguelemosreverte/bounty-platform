import { test, expect } from '@playwright/test';
import { MaintainerPage } from './pages/maintainer.page';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet } from './helpers/wallet';

test.describe('Maintainer Page', () => {
  let maintainer: MaintainerPage;

  test.beforeEach(async ({ page }) => {
    maintainer = new MaintainerPage(page);
  });

  test('maintainer overview page loads', async ({ page }) => {
    await maintainer.gotoOverview();
    await page.waitForLoadState('networkidle');

    // The overview section should be visible
    await expect(maintainer.overview).toBeVisible();

    // Page heading should be present
    await expect(
      page.getByText('Accelerate Your Open Source with Bounties'),
    ).toBeVisible();
  });

  test('shows fee structure', async ({ page }) => {
    await maintainer.gotoOverview();
    await page.waitForLoadState('networkidle');

    // Verify the fee structure section is rendered
    await expect(page.getByText('Transparent Fee Structure')).toBeVisible();
    await expect(
      page.getByText('5% creation premium', { exact: false }),
    ).toBeVisible();
  });

  test('dashboard shows connect prompt without wallet', async ({ page }) => {
    await maintainer.gotoDashboard();
    await page.waitForLoadState('networkidle');

    // Without wallet, should show connect prompt
    const connectPrompt = page.getByTestId('maint-dashboard-connect');
    await expect(connectPrompt).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard accessible with maintainer wallet', async ({ page }) => {
    // deployer (0xf39F...) is the maintainer who created all bounties
    await injectMockProvider(page, ANVIL_ACCOUNTS.deployer);

    await maintainer.gotoDashboard();
    await page.waitForLoadState('networkidle');
    await connectWallet(page);

    // Wait for data to load
    await page.waitForTimeout(3_000);

    // Should see the connected dashboard
    const dashboard = page.getByTestId('maint-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 15_000 });

    // Verify summary section shows stats
    await expect(maintainer.dashboardSummary).toBeVisible();
  });
});

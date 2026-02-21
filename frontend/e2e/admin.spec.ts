import { test, expect } from '@playwright/test';
import { AdminPage } from './pages/admin.page';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet } from './helpers/wallet';

test.describe('Admin Page', () => {
  let admin: AdminPage;

  test.beforeEach(async ({ page }) => {
    admin = new AdminPage(page);
  });

  test('admin page shows access denied without wallet', async ({ page }) => {
    await admin.goto();
    await page.waitForLoadState('networkidle');

    // Without a connected wallet, the guard should be visible
    // May show either the "loading" guard or the "access denied" guard
    const guard = page.getByTestId('admin-guard');
    const guardLoading = page.getByTestId('admin-guard-loading');
    const eitherGuard = guard.or(guardLoading);
    await expect(eitherGuard).toBeVisible();
  });

  test('admin dashboard accessible with admin wallet', async ({ page }) => {
    // Inject mock provider with deployer/admin account BEFORE navigation
    await injectMockProvider(page, ANVIL_ACCOUNTS.deployer);

    await admin.goto();
    await page.waitForLoadState('networkidle');
    await connectWallet(page);

    // Wait for the dashboard to render with data
    await page.waitForTimeout(2_000);

    // Verify the admin dashboard sections are visible
    await expect(admin.metrics).toBeVisible({ timeout: 10_000 });
    await expect(admin.bounties).toBeVisible();
    await expect(admin.health).toBeVisible();
  });

  test('admin dashboard shows access denied with non-admin wallet', async ({ page }) => {
    // Inject mock provider with a non-admin contributor account
    await injectMockProvider(page, ANVIL_ACCOUNTS.contributor1);

    await admin.goto();
    await page.waitForLoadState('networkidle');
    await connectWallet(page);
    await page.waitForTimeout(2_000);

    // Should see access denied
    await expect(page.getByTestId('admin-guard')).toBeVisible({ timeout: 10_000 });
  });
});

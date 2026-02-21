import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet } from '../helpers/wallet';

test.describe('Maintainer Dashboard', () => {
  test('maintainer dashboard flow', async ({ page }) => {
    markTestStart();

    // Inject mock wallet — deployer is the bounty creator
    await injectMockProvider(page, ANVIL_ACCOUNTS.deployer);

    // ── Step 1: Connect wallet on maintainer page (first nav — page.goto needed) ──
    await test.step('Connect wallet as maintainer', async () => {
      await page.goto('/maintainer');
      await page.waitForLoadState('networkidle');
      await connectWallet(page);
      await page.waitForTimeout(800);

      await expect(page.locator('button').filter({ hasText: /0x/ }).first()).toBeVisible();
      await takeScreenshot(page, '01-wallet-connected');
    });

    // ── Step 2: View maintainer dashboard (sidebar click — wagmi state persists) ──
    await test.step('Navigate to maintainer dashboard', async () => {
      const dashboardLink = page.getByTestId('sidebar-link-dashboard')
        .or(page.locator('a[href="/maintainer/dashboard"]'));
      await dashboardLink.first().click();
      await page.waitForURL('**/maintainer/dashboard');
      await page.waitForTimeout(2_000);

      const dashboard = page.getByTestId('maint-dashboard')
        .or(page.getByTestId('maint-dashboard-connect'));
      await expect(dashboard.first()).toBeVisible();

      await takeScreenshot(page, '02-maintainer-dashboard');
    });

    // ── Step 3: Review dashboard statistics ──
    await test.step('Review bounty creation statistics', async () => {
      const summary = page.getByTestId('maint-dashboard-summary');
      if (await summary.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await expect(summary).toBeVisible();

        // Check stat cards
        for (const testId of ['stat-bounties-created', 'stat-active-bounties', 'stat-total-spent', 'stat-solutions-received']) {
          const card = page.getByTestId(testId);
          if (await card.isVisible({ timeout: 1_000 }).catch(() => false)) {
            await card.scrollIntoViewIfNeeded();
          }
        }
      }

      await takeScreenshot(page, '03-dashboard-statistics');
    });

    // ── Step 4: Check bounties table ──
    await test.step('View created bounties table', async () => {
      const table = page.getByTestId('maint-bounties-table');
      if (await table.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await table.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '04-bounties-table');
    });

    // ── Step 5: Check recent solutions ──
    await test.step('Review incoming solutions', async () => {
      const solutions = page.getByTestId('maint-solutions');
      if (await solutions.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await solutions.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '05-recent-solutions');
    });

    // ── Step 6: Manage bounties page (sidebar click — wagmi state persists) ──
    await test.step('Navigate to bounty management', async () => {
      const bountiesLink = page.getByTestId('sidebar-link-my-bounties')
        .or(page.getByTestId('sidebar-link-bounties'))
        .or(page.locator('a[href="/maintainer/bounties"]'));
      await bountiesLink.first().click();
      await page.waitForURL('**/maintainer/bounties');
      await page.waitForTimeout(2_000);

      await takeScreenshot(page, '06-manage-bounties');
    });
  });
});

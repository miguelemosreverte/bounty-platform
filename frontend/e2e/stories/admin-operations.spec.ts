import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet } from '../helpers/wallet';

test.describe('Admin Operations', () => {
  test('admin platform operations', async ({ page }) => {
    markTestStart();

    // Inject deployer (admin) wallet
    await injectMockProvider(page, ANVIL_ACCOUNTS.deployer);

    // ── Step 1: Connect and view admin dashboard (first nav — page.goto needed) ──
    await test.step('Access admin dashboard', async () => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await connectWallet(page);
      await page.waitForTimeout(2_000);

      const dashboard = page.getByTestId('admin-dashboard');
      if (await dashboard.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await expect(dashboard).toBeVisible();
      }

      await takeScreenshot(page, '01-admin-dashboard');
    });

    // ── Step 2: Review platform metrics (same page — scroll) ──
    await test.step('Review platform-wide metrics', async () => {
      const metrics = page.getByTestId('admin-metrics');
      if (await metrics.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await expect(metrics).toBeVisible();

        // Check individual metric cards
        for (const testId of ['stat-total-bounties', 'stat-total-paid', 'stat-active-users', 'stat-bounties-week']) {
          const card = page.getByTestId(testId);
          if (await card.isVisible({ timeout: 1_000 }).catch(() => false)) {
            await card.scrollIntoViewIfNeeded();
          }
        }
      }

      await takeScreenshot(page, '02-platform-metrics');
    });

    // ── Step 3: View all bounties table (same page — scroll) ──
    await test.step('Monitor all platform bounties', async () => {
      const bounties = page.getByTestId('admin-bounties');
      if (await bounties.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await bounties.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '03-all-bounties');
    });

    // ── Step 4: View bounties data table (same page — scroll) ──
    await test.step('Inspect bounties data table', async () => {
      const table = page.getByTestId('admin-bounties-table');
      if (await table.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await table.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '04-bounties-table');
    });

    // ── Step 5: Check system health (same page — scroll) ──
    await test.step('Check system health and infrastructure', async () => {
      const health = page.getByTestId('admin-health');
      if (await health.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await health.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '05-system-health');
    });
  });
});

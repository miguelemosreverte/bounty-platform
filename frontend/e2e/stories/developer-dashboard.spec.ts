import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet } from '../helpers/wallet';

test.describe('Developer Dashboard', () => {
  test('developer dashboard flow', async ({ page }) => {
    markTestStart();

    // Inject mock wallet for the entire test
    await injectMockProvider(page, ANVIL_ACCOUNTS.contributor1);

    // ── Step 1: Connect wallet on developer page (first nav — page.goto needed) ──
    await test.step('Connect wallet on developer overview', async () => {
      await page.goto('/developer');
      await page.waitForLoadState('networkidle');
      await connectWallet(page);
      await page.waitForTimeout(800);

      await expect(page.locator('button').filter({ hasText: /0x/ }).first()).toBeVisible();
      await takeScreenshot(page, '01-wallet-connected');
    });

    // ── Step 2: View developer dashboard (sidebar click — wagmi state persists) ──
    await test.step('Navigate to personalized dashboard', async () => {
      const dashboardLink = page.getByTestId('sidebar-link-dashboard')
        .or(page.locator('a[href="/developer/dashboard"]'));
      await dashboardLink.first().click();
      await page.waitForURL('**/developer/dashboard');
      await page.waitForTimeout(2_000);

      await expect(page.getByTestId('dev-dashboard')).toBeVisible();
      await takeScreenshot(page, '02-developer-dashboard');
    });

    // ── Step 3: Review dashboard statistics ─────────────
    await test.step('Review earnings and submission stats', async () => {
      const summary = page.getByTestId('dev-dashboard-summary');
      await expect(summary).toBeVisible();

      // Check individual stat cards
      const statCards = ['stat-total-earned', 'stat-active-submissions', 'stat-success-rate', 'stat-total-submissions'];
      for (const testId of statCards) {
        const card = page.getByTestId(testId);
        if (await card.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await card.scrollIntoViewIfNeeded();
        }
      }

      await takeScreenshot(page, '03-dashboard-statistics');
    });

    // ── Step 4: Check submissions table ─────────────────
    await test.step('View submission history', async () => {
      const table = page.getByTestId('dev-submissions-table');
      if (await table.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await table.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '04-submissions-table');
    });

    // ── Step 5: Check available bounties ────────────────
    await test.step('Browse available bounties from dashboard', async () => {
      const availableBounties = page.getByTestId('dev-available-bounties');
      if (await availableBounties.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await availableBounties.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '05-available-bounties');
    });

    // ── Step 6: Visit leaderboard while connected (navbar click — client-side) ──
    await test.step('Check leaderboard standing', async () => {
      const leaderboardLink = page.locator('a[href="/leaderboard"]').first();
      await leaderboardLink.click();
      await page.waitForURL('**/leaderboard');
      await page.waitForTimeout(1000);

      await takeScreenshot(page, '06-leaderboard-connected');
    });
  });
});

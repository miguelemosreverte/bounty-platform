import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet, gotoConnected } from '../helpers/wallet';

test.describe('Maintainer Lifecycle', () => {
  test('maintainer lifecycle view', async ({ page }) => {
    markTestStart();

    // Inject mock wallet — deployer is the bounty creator
    await injectMockProvider(page, ANVIL_ACCOUNTS.deployer);

    // ── Step 1: View own bounties as maintainer (first nav — page.goto + connect needed) ──
    await test.step('View own bounties with wallet connected', async () => {
      await gotoConnected(page, '/maintainer/bounties');
      await page.waitForTimeout(2_000);

      const bounties = page.getByTestId('maint-bounties')
        .or(page.getByTestId('maint-bounties-connect'));
      await expect(bounties.first()).toBeVisible();

      await takeScreenshot(page, '01-own-bounties');
    });

    // ── Step 2: Browse public bounties with role tabs (navbar link — client-side) ──
    await test.step('Browse public bounties as maintainer', async () => {
      const bountiesNavLink = page.locator('a[href="/bounties"]').first();
      await bountiesNavLink.click();
      await page.waitForURL('**/bounties');
      await page.waitForTimeout(1000);

      // Check "Created by me" tab if visible
      const createdTab = page.getByTestId('bounties-role-created');
      if (await createdTab.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await createdTab.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '02-bounties-created-by-me');
    });

    // ── Step 3: Filter by closed bounties (in-page interaction) ──
    await test.step('Review closed bounties', async () => {
      const closedFilter = page.getByTestId('bounties-filter-closed');
      if (await closedFilter.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closedFilter.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '03-closed-bounties');
    });

    // ── Step 4: Drill into a bounty detail (click card — client-side) ──
    await test.step('Review a bounty solution detail', async () => {
      // Reset to all filter
      const allFilter = page.getByTestId('bounties-filter-all');
      if (await allFilter.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await allFilter.click();
        await page.waitForTimeout(500);
      }

      const firstCard = page.locator('[data-testid^="bounty-card-"]').first();
      if (await firstCard.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await firstCard.click();
        await page.waitForURL('**/bounties/**');
        await page.waitForTimeout(1000);
      }

      await takeScreenshot(page, '04-bounty-solution-detail');
    });

    // ── Step 5: Check leaderboard position (navbar link — client-side) ──
    await test.step('Check maintainer leaderboard ranking', async () => {
      const leaderboardLink = page.locator('a[href="/leaderboard"]').first();
      await leaderboardLink.click();
      await page.waitForURL('**/leaderboard');
      await page.waitForTimeout(1000);

      // Filter to maintainers
      const maintainerFilter = page.getByTestId('leaderboard-filter-maintainer');
      if (await maintainerFilter.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await maintainerFilter.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '05-leaderboard-maintainers');
    });
  });
});

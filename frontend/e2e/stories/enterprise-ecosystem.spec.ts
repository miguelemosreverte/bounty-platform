import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';

test.describe('Enterprise Ecosystem', () => {
  test('enterprise ecosystem exploration', async ({ page }) => {
    markTestStart();

    // ── Step 1: Browse public bounties (first nav — page.goto needed) ──
    await test.step('Explore the bounty ecosystem', async () => {
      await page.goto('/bounties');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await takeScreenshot(page, '01-bounty-ecosystem');
    });

    // ── Step 2: Filter by open bounties (in-page interaction) ──
    await test.step('Filter for active opportunities', async () => {
      const openFilter = page.getByTestId('bounties-filter-open');
      if (await openFilter.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await openFilter.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '02-open-bounties');
    });

    // ── Step 3: View closed bounties (in-page interaction) ──
    await test.step('Review completed bounties', async () => {
      const closedFilter = page.getByTestId('bounties-filter-closed');
      if (await closedFilter.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closedFilter.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '03-closed-bounties');
    });

    // ── Step 4: View bounty detail (click card — client-side) ──
    await test.step('Inspect a bounty in detail', async () => {
      // Reset to all
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

      await takeScreenshot(page, '04-bounty-detail');
    });

    // ── Step 5: Explore the leaderboard (navbar link — client-side) ──
    await test.step('View the ecosystem leaderboard', async () => {
      const leaderboardLink = page.locator('a[href="/leaderboard"]').first();
      await leaderboardLink.click();
      await page.waitForURL('**/leaderboard');
      await page.waitForTimeout(1000);

      await takeScreenshot(page, '05-ecosystem-leaderboard');
    });
  });
});

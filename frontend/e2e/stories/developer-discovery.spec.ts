import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';

test.describe('Developer Discovery', () => {
  test('developer discovery flow', async ({ page }) => {
    markTestStart();

    // ── Step 1: Land on homepage ────────────────────────
    await test.step('Discover GitBusters landing page', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await expect(page.getByTestId('landing-card-developer')).toBeVisible();
      await expect(page.getByTestId('landing-card-maintainer')).toBeVisible();
      await expect(page.getByTestId('landing-card-enterprise')).toBeVisible();

      await takeScreenshot(page, '01-landing-page');
    });

    // ── Step 2: Navigate to developer overview (client-side via card click) ──
    await test.step('Select the developer path', async () => {
      await page.getByTestId('landing-card-developer').click();
      await page.waitForURL('**/developer');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await expect(page.getByTestId('developer-overview')).toBeVisible();
      await takeScreenshot(page, '02-developer-overview');
    });

    // ── Step 3: Browse developer bounties (client-side sidebar click) ───
    await test.step('Browse developer bounties section', async () => {
      const bountiesLink = page.getByTestId('sidebar-link-bounties')
        .or(page.locator('a[href="/developer/bounties"]'));
      await bountiesLink.first().click();
      await page.waitForURL('**/developer/bounties');
      await page.waitForTimeout(1000);

      await expect(page.getByTestId('dev-bounties')).toBeVisible();
      await takeScreenshot(page, '03-developer-bounties');
    });

    // ── Step 4: Explore public bounties with search (navbar link click) ─
    await test.step('Explore public bounties with filtering', async () => {
      // Use the top-bar link for client-side navigation to /bounties
      const bountyNavLink = page.locator('a[href="/bounties"]').first();
      await bountyNavLink.click();
      await page.waitForURL('**/bounties');
      await page.waitForTimeout(1000);

      // Try status filters
      const openFilter = page.getByTestId('bounties-filter-open');
      if (await openFilter.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await openFilter.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '04-public-bounties-filtered');

      // Reset to all
      const allFilter = page.getByTestId('bounties-filter-all');
      if (await allFilter.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await allFilter.click();
        await page.waitForTimeout(500);
      }
    });

    // ── Step 5: View a bounty detail (click bounty card — client-side) ──
    await test.step('View a specific bounty detail', async () => {
      const firstCard = page.locator('[data-testid^="bounty-card-"]').first();
      if (await firstCard.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await firstCard.click();
        await page.waitForURL('**/bounties/**');
        await page.waitForTimeout(1000);
      }

      await takeScreenshot(page, '05-bounty-detail');
    });

    // ── Step 6: Check leaderboard (navbar link click — client-side) ─────
    await test.step('Explore the contributor leaderboard', async () => {
      const leaderboardLink = page.locator('a[href="/leaderboard"]').first();
      await leaderboardLink.click();
      await page.waitForURL('**/leaderboard');
      await page.waitForTimeout(1000);

      // Filter to contributors
      const contributorFilter = page.getByTestId('leaderboard-filter-contributor');
      if (await contributorFilter.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await contributorFilter.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '06-leaderboard-contributors');
    });
  });
});

import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';

test.describe('Developer Bounty Deep Dive', () => {
  test('developer bounty deep dive', async ({ page }) => {
    markTestStart();

    // ── Step 1: Browse public bounties (first nav — page.goto needed) ──
    await test.step('Browse all public bounties', async () => {
      await page.goto('/bounties');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await takeScreenshot(page, '01-all-bounties');
    });

    // ── Step 2: Filter by open status (in-page interaction) ──
    await test.step('Filter bounties by open status', async () => {
      const openFilter = page.getByTestId('bounties-filter-open');
      if (await openFilter.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await openFilter.click();
        await page.waitForTimeout(500);
      }

      await takeScreenshot(page, '02-bounties-open-filter');
    });

    // ── Step 3: Select a bounty for deep dive (click card — client-side) ──
    await test.step('Open a bounty to inspect details', async () => {
      // Reset filter first
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

      await takeScreenshot(page, '03-bounty-detail-page');
    });

    // ── Step 4: Review bounty information ──
    await test.step('Review bounty amount and complexity', async () => {
      await page.waitForTimeout(500);

      // Look for status badge, amount, complexity
      const body = page.locator('main, [role="main"], .container').first();
      if (await body.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await body.scrollIntoViewIfNeeded();
      }

      await takeScreenshot(page, '04-bounty-info');
    });

    // ── Step 5: Check solutions section ──
    await test.step('Review existing solutions', async () => {
      // Scroll down to see solutions section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(500);

      await takeScreenshot(page, '05-bounty-solutions');
    });

    // ── Step 6: Navigate back to bounties (click link — client-side) ──
    await test.step('Navigate back to bounty listing', async () => {
      // Use the in-page back link (Next.js <Link>) for client-side nav
      const backLink = page.locator('a[href="/bounties"]').first();
      if (await backLink.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await backLink.click();
      } else {
        await page.goBack();
      }
      await page.waitForURL('**/bounties');
      await page.waitForTimeout(1000);

      await takeScreenshot(page, '06-back-to-bounties');
    });
  });
});

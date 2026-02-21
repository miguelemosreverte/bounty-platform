import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';

test.describe('Maintainer Onboarding', () => {
  test('maintainer onboarding flow', async ({ page }) => {
    markTestStart();

    // ── Step 1: Land on homepage (first nav — page.goto needed) ──
    await test.step('Discover GitBusters from landing', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await expect(page.getByTestId('landing-card-maintainer')).toBeVisible();
      await takeScreenshot(page, '01-landing-page');
    });

    // ── Step 2: Navigate to maintainer overview (card click — client-side) ──
    await test.step('Select the maintainer path', async () => {
      await page.getByTestId('landing-card-maintainer').click();
      await page.waitForURL('**/maintainer');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await expect(page.getByTestId('maintainer-overview')).toBeVisible();
      await takeScreenshot(page, '02-maintainer-overview');
    });

    // ── Step 3: Review fee structure and value prop (scroll on same page) ──
    await test.step('Learn about the bounty lifecycle and fees', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
      await page.waitForTimeout(500);

      await takeScreenshot(page, '03-fee-structure');
    });

    // ── Step 4: Scroll to CTA / bottom of overview (scroll on same page) ──
    await test.step('Review platform features and CTA', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      await takeScreenshot(page, '04-features-cta');
    });

    // ── Step 5: Check public bounties ecosystem (navbar link — client-side) ──
    await test.step('Browse the public bounty ecosystem', async () => {
      const bountiesLink = page.locator('a[href="/bounties"]').first();
      await bountiesLink.click();
      await page.waitForURL('**/bounties');
      await page.waitForTimeout(1000);

      await takeScreenshot(page, '05-public-bounties');
    });
  });
});

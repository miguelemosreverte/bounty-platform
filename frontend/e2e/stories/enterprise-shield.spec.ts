import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';

test.describe('Enterprise Shield', () => {
  test('enterprise shield discovery', async ({ page }) => {
    markTestStart();

    // ── Step 1: Land on homepage (first nav — page.goto needed) ──
    await test.step('Discover enterprise offering from landing', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await expect(page.getByTestId('landing-card-enterprise')).toBeVisible();
      await takeScreenshot(page, '01-landing-page');
    });

    // ── Step 2: Navigate to enterprise overview (card click — client-side) ──
    await test.step('Enter the enterprise experience', async () => {
      await page.getByTestId('landing-card-enterprise').click();
      await page.waitForURL('**/enterprise');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      await expect(page.getByTestId('enterprise-overview')).toBeVisible();
      await takeScreenshot(page, '02-enterprise-overview');
    });

    // ── Step 3: Review pricing tiers (scroll on same page) ──
    await test.step('Review Shield pricing tiers', async () => {
      const pageContent = await page.textContent('body');
      const hasPricing = pageContent?.includes('Startup') ||
        pageContent?.includes('Growth') ||
        pageContent?.includes('Enterprise');
      expect(hasPricing).toBeTruthy();

      // Scroll to pricing section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(500);

      await takeScreenshot(page, '03-pricing-tiers');
    });

    // ── Step 4: Scroll to features/CTA (scroll on same page) ──
    await test.step('Review Shield features and CTA', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      await takeScreenshot(page, '04-shield-features');
    });

    // ── Step 5: Visit Shield dashboard (sidebar click — client-side) ──
    await test.step('Preview the Shield dashboard', async () => {
      const dashboardLink = page.getByTestId('sidebar-link-dashboard')
        .or(page.locator('a[href="/enterprise/dashboard"]'));
      await dashboardLink.first().click();
      await page.waitForURL('**/enterprise/dashboard');
      await page.waitForTimeout(1000);

      await expect(page.getByTestId('enterprise-dashboard')).toBeVisible();
      await takeScreenshot(page, '05-shield-dashboard');
    });
  });
});

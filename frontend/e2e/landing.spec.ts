import { test, expect } from '@playwright/test';
import { LandingPage } from './pages/landing.page';

test.describe('Landing Page', () => {
  let landing: LandingPage;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page);
    await landing.goto();
  });

  test('landing page shows three role cards', async () => {
    await expect(landing.developerCard).toBeVisible();
    await expect(landing.maintainerCard).toBeVisible();
    await expect(landing.enterpriseCard).toBeVisible();
  });

  test('clicking developer card navigates to /developer', async ({ page }) => {
    await landing.clickDeveloper();
    await page.waitForURL('**/developer');
    expect(page.url()).toContain('/developer');
  });

  test('clicking maintainer card navigates to /maintainer', async ({ page }) => {
    await landing.clickMaintainer();
    await page.waitForURL('**/maintainer');
    expect(page.url()).toContain('/maintainer');
  });

  test('clicking enterprise card navigates to /enterprise', async ({ page }) => {
    await landing.clickEnterprise();
    await page.waitForURL('**/enterprise');
    expect(page.url()).toContain('/enterprise');
  });

  test('landing page shows live stats section', async ({ page }) => {
    const statsHeading = page.getByText('Platform Stats');
    await expect(statsHeading).toBeVisible();

    // Verify the three stat cards are rendered (Total Bounties, Open Bounties, Total Paid)
    await expect(page.getByText('Total Bounties')).toBeVisible();
    await expect(page.getByText('Open Bounties')).toBeVisible();
    await expect(page.getByText('Total Paid')).toBeVisible();
  });
});

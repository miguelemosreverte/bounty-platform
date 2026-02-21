import { test, expect } from '@playwright/test';
import { LeaderboardPage } from './pages/leaderboard.page';

test.describe('Leaderboard Page', () => {
  let leaderboard: LeaderboardPage;

  test.beforeEach(async ({ page }) => {
    leaderboard = new LeaderboardPage(page);
    await leaderboard.goto();
    await page.waitForLoadState('networkidle');
  });

  test('leaderboard page loads with entries', async ({ page }) => {
    // The leaderboard table should be visible
    await expect(leaderboard.table).toBeVisible();

    // At least the first row should be rendered
    const firstRow = leaderboard.getRow(0);
    await expect(firstRow).toBeVisible();
  });

  test('filter by contributors shows only contributors', async ({ page }) => {
    await leaderboard.filterByRole('contributor');
    await page.waitForTimeout(300);

    // If there are rows, they should all be contributors
    const rows = page.locator('[data-testid^="leaderboard-row-"]');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      await expect(row).toContainText('contributor');
    }
  });

  test('filter by maintainers shows only maintainers', async ({ page }) => {
    await leaderboard.filterByRole('maintainer');
    await page.waitForTimeout(300);

    // If there are rows, they should all be maintainers
    const rows = page.locator('[data-testid^="leaderboard-row-"]');
    const count = await rows.count();

    // Either we have rows with maintainer type, or an empty state
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        await expect(row).toContainText('maintainer');
      }
    } else {
      // Empty state message should be visible
      await expect(page.getByText('No entries yet')).toBeVisible();
    }
  });
});

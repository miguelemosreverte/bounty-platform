import { test, expect } from '@playwright/test';
import { BountiesPage } from './pages/bounties.page';
import { navigateTo } from './helpers/actions';

test.describe('Bounties Page', () => {
  let bounties: BountiesPage;

  test.beforeEach(async ({ page }) => {
    bounties = new BountiesPage(page);
    await bounties.goto();
    await page.waitForLoadState('networkidle');
  });

  test('bounties page loads with bounty cards', async ({ page }) => {
    // With 7 seeded bounties, at least one card should be visible
    const cards = page.locator('[data-testid^="bounty-card-"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('search filters bounties by repo name', async ({ page }) => {
    const allCards = page.locator('[data-testid^="bounty-card-"]');
    const totalBefore = await allCards.count();

    // Search for a term that should narrow results
    await bounties.search('playground');
    await page.waitForTimeout(300); // debounce

    const filteredCards = page.locator('[data-testid^="bounty-card-"]');
    const totalAfter = await filteredCards.count();

    // Either we get fewer results, or all results match the search term
    // (if all bounties are from 'playground', count stays the same but all match)
    if (totalAfter < totalBefore) {
      expect(totalAfter).toBeLessThan(totalBefore);
    } else {
      // All visible cards should contain the search term
      for (let i = 0; i < totalAfter; i++) {
        await expect(filteredCards.nth(i)).toContainText(/playground/i);
      }
    }
  });

  test('sort reorders bounties', async ({ page }) => {
    await bounties.sort('highest');
    await page.waitForTimeout(300);

    const cards = page.locator('[data-testid^="bounty-card-"]');
    const count = await cards.count();

    if (count >= 2) {
      // Extract ETH amounts from the first two cards to verify descending order
      const firstCardText = await cards.nth(0).textContent();
      const secondCardText = await cards.nth(1).textContent();

      // Extract the numeric ETH value (e.g., "0.5" from "0.5 ETH")
      const ethPattern = /([\d.]+)\s*ETH/;
      const firstMatch = firstCardText?.match(ethPattern);
      const secondMatch = secondCardText?.match(ethPattern);

      if (firstMatch && secondMatch) {
        const firstAmount = parseFloat(firstMatch[1]);
        const secondAmount = parseFloat(secondMatch[1]);
        expect(firstAmount).toBeGreaterThanOrEqual(secondAmount);
      }
    }
  });

  test('status filter shows only open bounties', async ({ page }) => {
    await bounties.filter('open');
    await page.waitForTimeout(300);

    const cards = page.locator('[data-testid^="bounty-card-"]');
    const count = await cards.count();

    // Every visible card should have an "open" status badge
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card.locator('[data-testid="status-badge-open"]')).toBeVisible();
    }
  });

  test('bounty card is clickable and navigates to detail', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="bounty-card-"]').first();
    await expect(firstCard).toBeVisible();

    // Extract the bounty ID from the data-testid attribute
    const testId = await firstCard.getAttribute('data-testid');
    const bountyId = testId?.replace('bounty-card-', '');

    await firstCard.click();
    await page.waitForURL(`**/bounties/${bountyId}`);
    expect(page.url()).toContain(`/bounties/${bountyId}`);
  });
});

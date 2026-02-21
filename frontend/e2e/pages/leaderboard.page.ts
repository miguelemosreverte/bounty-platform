import type { Page, Locator } from '@playwright/test';

export class LeaderboardPage {
  readonly page: Page;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByTestId('leaderboard-table');
  }

  async goto() {
    await this.page.goto('/leaderboard');
  }

  async filterByRole(role: string) {
    await this.page.getByTestId(`leaderboard-filter-${role}`).click();
  }

  getRow(index: number): Locator {
    return this.page.getByTestId(`leaderboard-row-${index}`);
  }
}

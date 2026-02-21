import type { Page, Locator } from '@playwright/test';

export class BountiesPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly sortSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('bounties-search');
    this.sortSelect = page.getByTestId('bounties-sort');
  }

  async goto() {
    await this.page.goto('/bounties');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async sort(value: string) {
    await this.sortSelect.selectOption(value);
  }

  async filter(status: string) {
    await this.page.getByTestId(`bounties-filter-${status}`).click();
  }

  getBountyCard(id: string): Locator {
    return this.page.getByTestId(`bounty-card-${id}`);
  }

  async clickBounty(id: string) {
    await this.getBountyCard(id).click();
  }
}

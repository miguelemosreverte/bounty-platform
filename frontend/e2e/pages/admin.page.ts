import type { Page, Locator } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly guard: Locator;
  readonly metrics: Locator;
  readonly bounties: Locator;
  readonly health: Locator;

  constructor(page: Page) {
    this.page = page;
    this.guard = page.getByTestId('admin-guard');
    this.metrics = page.getByTestId('admin-metrics');
    this.bounties = page.getByTestId('admin-bounties');
    this.health = page.getByTestId('admin-health');
  }

  async goto() {
    await this.page.goto('/admin');
  }
}

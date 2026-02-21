import type { Page, Locator } from '@playwright/test';

export class MaintainerPage {
  readonly page: Page;
  readonly overview: Locator;
  readonly dashboardSummary: Locator;
  readonly bountiesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overview = page.getByTestId('maintainer-overview');
    this.dashboardSummary = page.getByTestId('maint-dashboard-summary');
    this.bountiesTable = page.getByTestId('maint-bounties-table');
  }

  async gotoOverview() {
    await this.page.goto('/maintainer');
  }

  async gotoDashboard() {
    await this.page.goto('/maintainer/dashboard');
  }
}

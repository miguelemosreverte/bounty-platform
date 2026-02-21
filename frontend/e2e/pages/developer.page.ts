import type { Page, Locator } from '@playwright/test';

export class DeveloperPage {
  readonly page: Page;
  readonly overview: Locator;
  readonly dashboardSummary: Locator;
  readonly submissionsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overview = page.getByTestId('developer-overview');
    this.dashboardSummary = page.getByTestId('dev-dashboard-summary');
    this.submissionsTable = page.getByTestId('dev-submissions-table');
  }

  async gotoOverview() {
    await this.page.goto('/developer');
  }

  async gotoDashboard() {
    await this.page.goto('/developer/dashboard');
  }
}

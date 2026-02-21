import type { Page, Locator } from '@playwright/test';

export class BountyDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(id: string) {
    await this.page.goto(`/bounties/${id}`);
  }

  getStatusBadge(status: string): Locator {
    return this.page.getByTestId(`status-badge-${status}`);
  }

  async getStatus(): Promise<string> {
    const badge = this.page.locator('[data-testid^="status-badge-"]').first();
    const testId = await badge.getAttribute('data-testid');
    return testId?.replace('status-badge-', '') ?? '';
  }

  getSolutions(): Locator {
    return this.page.getByTestId('solution-item');
  }
}

import type { Page, Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly developerCard: Locator;
  readonly maintainerCard: Locator;
  readonly enterpriseCard: Locator;
  readonly connectWalletCta: Locator;

  constructor(page: Page) {
    this.page = page;
    this.developerCard = page.getByTestId('landing-card-developer');
    this.maintainerCard = page.getByTestId('landing-card-maintainer');
    this.enterpriseCard = page.getByTestId('landing-card-enterprise');
    this.connectWalletCta = page.getByTestId('landing-connect-wallet');
  }

  async goto() { await this.page.goto('/'); }
  async clickDeveloper() { await this.developerCard.click(); }
  async clickMaintainer() { await this.maintainerCard.click(); }
  async clickEnterprise() { await this.enterpriseCard.click(); }
}

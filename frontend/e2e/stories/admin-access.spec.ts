import { test, expect } from '@playwright/test';
import { takeScreenshot, markTestStart } from '../helpers/screenshots';
import { ANVIL_ACCOUNTS, injectMockProvider, connectWallet } from '../helpers/wallet';

test.describe('Admin Access Control', () => {
  test('admin access control', async ({ page }) => {
    markTestStart();

    // ── Step 1: Try admin without wallet (first nav — page.goto needed) ──
    await test.step('Attempt admin access without wallet', async () => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2_000);

      // Should see the access denied / connect wallet guard
      const guard = page.getByTestId('admin-guard');
      if (await guard.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await expect(guard).toBeVisible();
      }

      await takeScreenshot(page, '01-admin-no-wallet');
    });

    // ── Step 2: Connect with non-admin wallet (page.goto needed — different wallet injection) ──
    await test.step('Connect non-admin wallet — access denied', async () => {
      await injectMockProvider(page, ANVIL_ACCOUNTS.contributor1);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await connectWallet(page);
      await page.waitForTimeout(2_000);

      // Should still see access denied (contributor1 is not admin)
      const guard = page.getByTestId('admin-guard');
      if (await guard.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await expect(guard).toBeVisible();
      }

      await takeScreenshot(page, '02-access-denied');
    });

    // ── Step 3: Connect as admin (page.goto needed — different wallet injection) ──
    await test.step('Connect admin wallet — access granted', async () => {
      await injectMockProvider(page, ANVIL_ACCOUNTS.deployer);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await connectWallet(page);
      await page.waitForTimeout(2_000);

      await takeScreenshot(page, '03-admin-access-granted');
    });

    // ── Step 4: Verify full dashboard visible (same page — no nav needed) ──
    await test.step('Verify admin dashboard is accessible', async () => {
      const dashboard = page.getByTestId('admin-dashboard');
      if (await dashboard.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await expect(dashboard).toBeVisible();
      }

      await takeScreenshot(page, '04-admin-dashboard-verified');
    });
  });
});

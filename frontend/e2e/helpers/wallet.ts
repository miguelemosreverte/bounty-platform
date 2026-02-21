import type { Page } from '@playwright/test';
import { getMockProviderScript } from './mock-provider';

/**
 * Anvil deterministic accounts (from `anvil --host 127.0.0.1`).
 * These are the well-known test private keys — never use on mainnet.
 */
export const ANVIL_ACCOUNTS = {
  deployer: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  contributor1: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  contributor2: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
} as const;

/** Shorthand aliases */
export const TEST_WALLETS = {
  deployer: ANVIL_ACCOUNTS.deployer.address,
  contributor1: ANVIL_ACCOUNTS.contributor1.address,
  contributor2: ANVIL_ACCOUNTS.contributor2.address,
} as const;

/**
 * Inject a mock EIP-1193 provider into the page BEFORE navigation.
 * Must be called before page.goto().
 */
export async function injectMockProvider(
  page: Page,
  account: (typeof ANVIL_ACCOUNTS)[keyof typeof ANVIL_ACCOUNTS],
) {
  await page.addInitScript({
    content: getMockProviderScript(account.address),
  });
}

/**
 * Connect wallet programmatically via wagmi's connect() + injected() connector.
 *
 * wagmi.ts exposes { config, connect, disconnect, injected } on window.__wagmi.
 * The injected() connector picks up our mock window.ethereum.
 */
export async function connectWallet(page: Page) {
  // Wait for wagmi helpers to be available (Web3Provider loads async)
  await page.waitForFunction(
    () => !!(window as any).__wagmi?.config,
    { timeout: 15_000 },
  );

  const result = await page.evaluate(async () => {
    const w = (window as any).__wagmi;
    if (!w) return { ok: false, error: 'no __wagmi' };
    try {
      await w.connect(w.config, { connector: w.injected() });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || String(e) };
    }
  });

  if (!result.ok) {
    console.warn('Wallet connect failed:', result.error);
  }

  // Wait for React to re-render with the connected state
  await page.waitForTimeout(1_500);
}

/**
 * Navigate to a URL and ensure the wallet stays connected.
 *
 * page.goto() causes a full reload which resets wagmi's in-memory state.
 * This helper navigates and then re-connects the wallet programmatically.
 */
export async function gotoConnected(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await connectWallet(page);
}

/**
 * Disconnect the current wallet programmatically via wagmi.
 */
export async function disconnectWallet(page: Page) {
  await page.evaluate(async () => {
    const w = (window as any).__wagmi;
    if (!w) return;
    try {
      await w.disconnect(w.config);
    } catch {}
  });
  await page.waitForTimeout(1_000);
}

import { http } from 'wagmi';
import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { connect, disconnect, injected } from '@wagmi/core';

export const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

export const config = getDefaultConfig({
  appName: 'Bounty Platform',
  projectId: 'bounty-platform-dev', // WalletConnect project ID (placeholder for local dev)
  chains: [anvil],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
});

// Expose wagmi helpers on window for E2E tests to programmatically connect wallets
if (typeof window !== 'undefined') {
  (window as any).__wagmi = { config, connect, disconnect, injected };
}

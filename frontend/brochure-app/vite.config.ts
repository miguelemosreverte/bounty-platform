import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

const MAIN_SRC = path.resolve(__dirname, '../src');

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: [
      // ── Mocked modules (specific paths BEFORE catch-all @/) ──
      { find: '@/providers/Web3Provider', replacement: path.resolve(__dirname, 'src/mocks/web3-provider.tsx') },
      { find: '@/hooks/useWalletActivity', replacement: path.resolve(__dirname, 'src/mocks/wallet-activity.tsx') },
      { find: '@/lib/api', replacement: path.resolve(__dirname, 'src/mocks/api.ts') },

      { find: 'next/link', replacement: path.resolve(__dirname, 'src/mocks/next-link.tsx') },
      { find: 'next/navigation', replacement: path.resolve(__dirname, 'src/mocks/next-navigation.tsx') },
      { find: 'next/image', replacement: path.resolve(__dirname, 'src/mocks/next-image.tsx') },
      { find: /^next\/font\/google$/, replacement: path.resolve(__dirname, 'src/mocks/next-font.ts') },

      { find: 'wagmi', replacement: path.resolve(__dirname, 'src/mocks/wagmi.tsx') },
      { find: '@rainbow-me/rainbowkit/styles.css', replacement: path.resolve(__dirname, 'src/mocks/empty.css') },
      { find: '@rainbow-me/rainbowkit', replacement: path.resolve(__dirname, 'src/mocks/rainbowkit.tsx') },

      // ── Catch-all: real components from main app ──
      { find: '@', replacement: MAIN_SRC },
    ],
  },
  define: {
    'process.env.NEXT_PUBLIC_API_URL': JSON.stringify('http://mock'),
    'process.env.NEXT_PUBLIC_ADMIN_WALLETS': JSON.stringify('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
    'process.env.NEXT_PUBLIC_BOUNTY_CONTRACT': JSON.stringify('0x5FbDB2315678afecb367f032d93F642f64180aa3'),
    'process.env.NEXT_PUBLIC_LEADERBOARD_CONTRACT': JSON.stringify('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'),
  },
  build: {
    outDir: path.resolve(__dirname, '../brochure-assets'),
    emptyOutDir: false,
    assetsInlineLimit: 1000000, // Inline assets up to ~1MB (covers mascot image)
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'brochure.js',
        assetFileNames: 'brochure.[ext]',
      },
    },
  },
});

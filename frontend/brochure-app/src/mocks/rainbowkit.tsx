import { useContext } from 'react';
import { NavigationContext } from './next-navigation';

export function ConnectButton() {
  const state = useContext(NavigationContext);

  if (!state.walletConnected || !state.walletAddress) {
    return (
      <button
        className="text-xs font-sans px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-medium"
        style={{ cursor: 'default' }}
      >
        Connect Wallet
      </button>
    );
  }

  const short = `${state.walletAddress.slice(0, 6)}...${state.walletAddress.slice(-4)}`;
  return (
    <div className="flex items-center gap-2 text-xs font-mono bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      <span className="text-gray-300">{short}</span>
    </div>
  );
}

ConnectButton.Custom = function CustomConnectButton() {
  return <ConnectButton />;
};

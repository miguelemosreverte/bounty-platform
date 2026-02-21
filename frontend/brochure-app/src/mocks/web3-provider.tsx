import { useContext, type ReactNode } from 'react';
import { NavigationContext } from './next-navigation';

export function useWeb3Ready(): boolean {
  const state = useContext(NavigationContext);
  return state.walletConnected;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

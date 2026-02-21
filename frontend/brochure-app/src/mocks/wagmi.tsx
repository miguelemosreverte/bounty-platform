import { useContext } from 'react';
import { NavigationContext } from './next-navigation';

export function useAccount() {
  const state = useContext(NavigationContext);
  return {
    address: state.walletConnected ? (state.walletAddress as `0x${string}` | undefined) : undefined,
    isConnected: state.walletConnected,
    isDisconnected: !state.walletConnected,
    isConnecting: false,
    isReconnecting: false,
    connector: undefined,
    chain: undefined,
    chainId: 31337,
    status: state.walletConnected ? ('connected' as const) : ('disconnected' as const),
  };
}

export function useChainId() {
  return 31337;
}

export function useConnect() {
  return { connect: () => {}, connectors: [], isPending: false, error: null };
}

export function useDisconnect() {
  return { disconnect: () => {} };
}

export function useReadContract() {
  return { data: undefined, isLoading: false, error: null };
}

export function useWriteContract() {
  return { writeContract: () => {}, isPending: false, error: null };
}

export function useBalance() {
  return { data: { value: BigInt(0), formatted: '0', decimals: 18, symbol: 'ETH' } };
}

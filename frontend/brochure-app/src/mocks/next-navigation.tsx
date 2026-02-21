import { createContext, useContext } from 'react';

export interface MockState {
  pathname: string;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  walletConnected: boolean;
  walletAddress?: string;
  role: 'developer' | 'maintainer' | 'enterprise' | 'admin' | 'public';
}

export const defaultMockState: MockState = {
  pathname: '/',
  walletConnected: false,
  role: 'public',
};

export const NavigationContext = createContext<MockState>(defaultMockState);

export function useRouter() {
  return {
    push: (_url: string) => {},
    replace: (_url: string) => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => Promise.resolve(),
  };
}

export function usePathname() {
  const state = useContext(NavigationContext);
  return state.pathname;
}

export function useParams() {
  const state = useContext(NavigationContext);
  return state.params || {};
}

export function useSearchParams() {
  const state = useContext(NavigationContext);
  return new URLSearchParams(state.searchParams || {});
}

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type ComponentType,
} from 'react';

const Web3ReadyContext = createContext(false);
export const useWeb3Ready = () => useContext(Web3ReadyContext);

let CachedInner: ComponentType<{ children: ReactNode }> | null = null;

export function Web3Provider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (CachedInner) {
      setReady(true);
      return;
    }
    import('./Web3ProviderInner').then(mod => {
      CachedInner = mod.Web3ProviderInner;
      setReady(true);
    });
  }, []);

  // Before providers load, render children directly.
  // This matches the server HTML exactly, preventing hydration mismatch.
  if (!ready || !CachedInner) {
    return (
      <Web3ReadyContext.Provider value={false}>
        {children}
      </Web3ReadyContext.Provider>
    );
  }

  return (
    <Web3ReadyContext.Provider value={true}>
      <CachedInner>{children}</CachedInner>
    </Web3ReadyContext.Provider>
  );
}

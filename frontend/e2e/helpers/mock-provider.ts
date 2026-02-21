/**
 * Mock EIP-1193 provider for Playwright E2E tests.
 *
 * Injects a minimal `window.ethereum` that satisfies wagmi's injected
 * connector and proxies RPC calls to the local Anvil node.
 */

const ANVIL_RPC = 'http://127.0.0.1:8545';

/**
 * Returns a JS script string to be injected via `page.addInitScript()`.
 * The script sets up window.ethereum and fires EIP-6963 announceProvider.
 */
export function getMockProviderScript(address: string): string {
  return `
    (() => {
      const ADDRESS = '${address.toLowerCase()}';
      const CHAIN_ID = '0x7a69'; // 31337

      // ── Minimal EIP-1193 provider ──────────────────────
      const provider = {
        isMetaMask: true,
        _isMockProvider: true,
        selectedAddress: ADDRESS,
        chainId: CHAIN_ID,
        networkVersion: '31337',

        _listeners: {},

        on(event, fn) {
          if (!this._listeners[event]) this._listeners[event] = [];
          this._listeners[event].push(fn);
          return this;
        },

        removeListener(event, fn) {
          if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(f => f !== fn);
          }
          return this;
        },

        removeAllListeners(event) {
          if (event) {
            delete this._listeners[event];
          } else {
            this._listeners = {};
          }
          return this;
        },

        emit(event, ...args) {
          (this._listeners[event] || []).forEach(fn => {
            try { fn(...args); } catch(e) { console.error('provider event error:', e); }
          });
        },

        async request({ method, params }) {
          switch (method) {
            case 'eth_requestAccounts':
            case 'eth_accounts':
              return [ADDRESS];

            case 'eth_chainId':
              return CHAIN_ID;

            case 'net_version':
              return '31337';

            case 'wallet_switchEthereumChain':
              return null;

            case 'wallet_addEthereumChain':
              return null;

            case 'personal_sign':
              return '0x' + 'ab'.repeat(65);

            case 'eth_signTypedData_v4':
              return '0x' + 'cd'.repeat(65);

            case 'wallet_getPermissions':
              return [{ parentCapability: 'eth_accounts' }];

            case 'wallet_requestPermissions':
              return [{ parentCapability: 'eth_accounts' }];

            // Proxy everything else to Anvil
            default:
              const res = await fetch('${ANVIL_RPC}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: Date.now(),
                  method,
                  params: params || [],
                }),
              });
              const json = await res.json();
              if (json.error) throw new Error(json.error.message);
              return json.result;
          }
        },

        // Legacy send for wagmi compatibility
        send(method, params) {
          if (typeof method === 'string') {
            return this.request({ method, params });
          }
          // Handle {method, params} object form
          return this.request(method);
        },

        sendAsync(payload, cb) {
          this.request(payload)
            .then(result => cb(null, { jsonrpc: '2.0', id: payload.id, result }))
            .catch(err => cb(err));
        },

        // EIP-1102 enable
        enable() {
          return this.request({ method: 'eth_requestAccounts' });
        },
      };

      // Set as window.ethereum before any scripts run
      Object.defineProperty(window, 'ethereum', {
        value: provider,
        writable: true,
        configurable: true,
      });

      // ── EIP-6963: Announce provider for RainbowKit/wagmi discovery ──
      const info = {
        uuid: 'e2e-mock-provider',
        name: 'MetaMask',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
        rdns: 'io.metamask',
      };

      const announceDetail = Object.freeze({ info, provider });

      // Announce immediately
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', { detail: announceDetail })
      );

      // Re-announce on request
      window.addEventListener('eip6963:requestProvider', () => {
        window.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', { detail: announceDetail })
        );
      });

      // Flag for the test to know provider is ready
      window.__mockProviderReady = true;
    })();
  `;
}

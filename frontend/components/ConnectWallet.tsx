'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect } from 'react';

export function ConnectWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error, isError } = useConnect();
  const { disconnect } = useDisconnect();

  console.log('[ConnectWallet] State:', { address, isConnected, isConnecting });
  console.log('[ConnectWallet] Available connectors:', connectors.map(c => ({ id: c.id, name: c.name, type: c.type })));

  useEffect(() => {
    if (isError && error) {
      console.error('[ConnectWallet] Connection error:', error);
      alert(`Connection failed: ${error.message}`);
    }
  }, [isError, error]);

  const handleConnect = async () => {
    try {
      console.log('[ConnectWallet] Attempting to connect...');
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask browser extension.');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      // Find the injected connector
      const injectedConnector = connectors.find(c => c.id === 'injected');
      
      if (!injectedConnector) {
        console.error('[ConnectWallet] No injected connector found');
        alert('Wallet connector not found. Please refresh the page.');
        return;
      }

      console.log('[ConnectWallet] Using connector:', injectedConnector);
      await connect({ connector: injectedConnector });
    } catch (err) {
      console.error('[ConnectWallet] Error in handleConnect:', err);
      alert(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:block rounded-lg bg-gray-100 px-3 py-2">
          <span className="text-sm font-mono text-gray-700">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
    </button>
  );
}

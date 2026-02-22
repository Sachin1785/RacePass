'use client';

import { useState } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const [open, setOpen] = useState(false);

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        className="w-full rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 active:bg-yellow-500 transition-colors shadow-sm"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black text-[10px] font-black">
          {address?.substring(2, 4).toUpperCase()}
        </span>
        <span className="font-mono text-xs flex-1 text-left">
          {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <div className="px-3 pb-2 mb-2 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connected</p>
            <p className="text-xs font-mono text-gray-700 mt-0.5">
              {address?.substring(0, 10)}...{address?.substring(address.length - 6)}
            </p>
          </div>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

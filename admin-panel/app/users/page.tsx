'use client';

import { useState } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface Ticket {
  dbId: number;        // from backend: dbId
  onChainId: string;
  eventName: string;
  mintedAt: string;
  isCheckedIn: boolean; // from backend: isCheckedIn
}

interface ReputationLog {
  id: number;
  type: 'add' | 'deduct';
  amount: number;
  reason: string;
  tx_hash: string;
  created_at: string;
}

interface ApiResult {
  success: boolean;
  error?: string;
  txHash?: string;
}

interface UserProfile {
  wallet: string;
  identity: {
    tokenId: string;
    activeReputation: string;
    isOver18: boolean;
    isKycVerified: boolean;
    isRevoked: boolean;
    lastUpdate: string;
  } | null;
  tickets: Ticket[];
  reputationHistory: ReputationLog[];
}

// ── Shared input class ─────────────────────────────────────────────────────────
const inputClass =
  'mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none px-4 py-2.5 text-sm transition-all duration-200';

// ── Inline SVG icons ───────────────────────────────────────────────────────────
const CheckIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);
const XIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const PlusIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);
const MinusIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
  </svg>
);
const ShieldIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const SearchIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
);

// ── Main Component ─────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isRevoking, setIsRevoking] = useState(false);
  const [revocationResult, setRevocationResult] = useState<ApiResult | null>(null);

  const [reputationAmount, setReputationAmount] = useState('50');
  const [reputationReason, setReputationReason] = useState('');
  const [reputationType, setReputationType] = useState<'add' | 'deduct'>('add');
  const [isAdjustingReputation, setIsAdjustingReputation] = useState(false);
  const [reputationResult, setReputationResult] = useState<ApiResult | null>(null);

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) { setError('Please enter a wallet address'); return; }

    setIsLoading(true);
    setError('');
    setUserProfile(null);
    setRevocationResult(null);
    setReputationResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/user/${walletAddress.trim()}`);
      const data = await res.json();
      if (data.success) setUserProfile(data);
      else setError('User not found or no identity issued');
    } catch {
      setError('Failed to fetch user data. Check if backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeIdentity = async (revoke: boolean) => {
    if (!userProfile?.identity) return;
    setIsRevoking(true);
    setRevocationResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/identity/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: userProfile.identity.tokenId, status: revoke }),
      });
      const data = await res.json();
      setRevocationResult(data);
      if (data.success) {
        const r = await fetch(`${BACKEND_URL}/api/user/${walletAddress}`);
        const rd = await r.json();
        if (rd.success) setUserProfile(rd);
      }
    } catch {
      setRevocationResult({ success: false, error: 'Failed to update revocation status' });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleAdjustReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.identity) return;
    if (!reputationReason.trim()) {
      setReputationResult({ success: false, error: 'Please provide a reason for the adjustment' });
      return;
    }
    setIsAdjustingReputation(true);
    setReputationResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/identity/reputation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: userProfile.identity.tokenId,
          amount: parseInt(reputationAmount) || 50,
          reason: reputationReason.trim(),
          type: reputationType,
        }),
      });
      const data = await res.json();
      setReputationResult(data);
      if (data.success) {
        setReputationReason('');
        const r = await fetch(`${BACKEND_URL}/api/user/${walletAddress}`);
        const rd = await r.json();
        if (rd.success) setUserProfile(rd);
      }
    } catch {
      setReputationResult({ success: false, error: 'Failed to adjust reputation' });
    } finally {
      setIsAdjustingReputation(false);
    }
  };

  const identity = userProfile?.identity;

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-gray-100"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #f5c51820 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 hover:text-yellow-700 mb-4 transition-colors">
            ← Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3 ml-0 block">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
              User Management
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">User Lookup</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search users by wallet address and manage identities, revocations, and reputation.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── SEARCH FORM ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
          <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-4">
            Search by Wallet Address
          </h2>
          <form onSubmit={handleSearchUser} className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm font-mono focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20 hover:-translate-y-0.5'
                }`}
            >
              {isLoading ? <><Spinner /> Searching…</> : 'Search User'}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <XIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </div>
          )}
        </div>

        {/* ── USER PROFILE ────────────────────────────────────────────────────── */}
        {userProfile && (
          <div className="space-y-5">

            {/* Identity Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-yellow-50 border border-yellow-200 flex items-center justify-center shrink-0">
                    <ShieldIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">Identity Information</h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{userProfile.wallet}</p>
                  </div>
                </div>

                {identity && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${identity.isRevoked
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-green-100 text-green-700 border border-green-200'
                      }`}
                  >
                    {identity.isRevoked
                      ? <XIcon className="w-3 h-3" />
                      : <CheckIcon className="w-3 h-3" />
                    }
                    {identity.isRevoked ? 'Revoked' : 'Active'}
                  </span>
                )}
              </div>

              {identity ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left col */}
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Token ID</dt>
                      <dd className="text-lg font-black text-gray-900">#{identity.tokenId}</dd>
                    </div>
                    <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
                      <dt className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Reputation Score</dt>
                      <dd className="text-4xl font-black text-yellow-500 font-mono tracking-tight">{identity.activeReputation}</dd>
                      <p className="mt-1 text-[10px] text-yellow-600/70">Includes time-based decay</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tickets</dt>
                      <dd className="text-2xl font-black text-gray-900">{userProfile.tickets.length}</dd>
                    </div>
                  </div>

                  {/* Right col */}
                  <div className="space-y-3">
                    {[
                      {
                        label: 'KYC Verified',
                        value: identity.isKycVerified,
                        yes: 'Verified',
                        no: 'Not Verified',
                      },
                      {
                        label: 'Age 18+',
                        value: identity.isOver18,
                        yes: 'Confirmed',
                        no: 'Not Confirmed',
                      },
                    ].map(({ label, value, yes, no }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-gray-600">{label}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${value
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                        >
                          {value ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                          {value ? yes : no}
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                      <span className="text-sm font-semibold text-gray-600">Last Updated</span>
                      <span className="text-xs font-semibold text-gray-700 text-right">{identity.lastUpdate}</span>
                    </div>

                    {/* Ticket summary chips */}
                    {userProfile.tickets.length > 0 && (
                      <div className="rounded-xl border border-gray-100 px-4 py-3">
                        <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tickets</dt>
                        <div className="flex flex-wrap gap-1.5">
                          {userProfile.tickets.slice(0, 6).map(t => (
                            <span
                              key={t.dbId}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${t.isCheckedIn
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                }`}
                            >
                              {t.eventName}
                            </span>
                          ))}
                          {userProfile.tickets.length > 6 && (
                            <span className="text-[10px] text-gray-400">+{userProfile.tickets.length - 6} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <ShieldIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No identity found for this wallet</p>
                </div>
              )}
            </div>

            {/* ── ADMIN ACTIONS ──────────────────────────────────────────────── */}
            {identity && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Revocation Panel */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">
                    Revocation Control
                  </h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                    Revoke or restore this identity. Revoked users cannot access events or services.
                  </p>

                  <div className="flex gap-3">
                    {!identity.isRevoked ? (
                      <button
                        onClick={() => handleRevokeIdentity(true)}
                        disabled={isRevoking}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${isRevoking
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-400 text-white shadow-md shadow-red-500/20 hover:-translate-y-0.5'
                          }`}
                      >
                        {isRevoking ? <><Spinner /> Processing…</> : <><XIcon /> Revoke Identity</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRevokeIdentity(false)}
                        disabled={isRevoking}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${isRevoking
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-400/20 hover:-translate-y-0.5'
                          }`}
                      >
                        {isRevoking ? <><Spinner /> Processing…</> : <><CheckIcon /> Restore Identity</>}
                      </button>
                    )}
                  </div>

                  {revocationResult && (
                    <div
                      className={`mt-4 rounded-xl p-4 border flex flex-col gap-1 ${revocationResult.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                    >
                      <p className={`text-sm font-bold flex items-center gap-2 ${revocationResult.success ? 'text-green-800' : 'text-red-700'}`}>
                        {revocationResult.success
                          ? <><CheckIcon className="w-3.5 h-3.5" /> Identity updated</>
                          : <><XIcon className="w-3.5 h-3.5" /> Failed</>
                        }
                      </p>
                      {revocationResult.txHash && (
                        <a
                          href={`https://testnet.monadscan.com/tx/${revocationResult.txHash}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 font-semibold"
                        >
                          View Transaction →
                        </a>
                      )}
                      {revocationResult.error && (
                        <p className="text-xs text-red-700">{revocationResult.error}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Reputation Adjustment */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">
                    Reputation Adjustment
                  </h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                    Manually add or deduct reputation points. A reason is required.
                  </p>

                  <form onSubmit={handleAdjustReputation} className="space-y-4">
                    {/* Type toggle */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Action
                      </label>
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setReputationType('add')}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${reputationType === 'add'
                            ? 'bg-yellow-400 text-black shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          <PlusIcon className="w-3.5 h-3.5" /> Add Points
                        </button>
                        <button
                          type="button"
                          onClick={() => setReputationType('deduct')}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${reputationType === 'deduct'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          <MinusIcon className="w-3.5 h-3.5" /> Deduct Points
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label htmlFor="reputationAmount" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        id="reputationAmount"
                        value={reputationAmount}
                        onChange={(e) => setReputationAmount(e.target.value)}
                        min="1" max="1000"
                        className={inputClass}
                      />
                    </div>

                    {/* Reason */}
                    <div>
                      <label htmlFor="reputationReason" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                        Reason <span className="text-yellow-500">*</span>
                      </label>
                      <textarea
                        id="reputationReason"
                        value={reputationReason}
                        onChange={(e) => setReputationReason(e.target.value)}
                        rows={2}
                        className={inputClass + ' resize-none'}
                        placeholder="e.g., Manual correction, Exceptional behaviour, Policy violation"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAdjustingReputation}
                      className={`w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${isAdjustingReputation
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20 hover:-translate-y-0.5'
                        }`}
                    >
                      {isAdjustingReputation ? <><Spinner /> Processing…</> : 'Apply Adjustment'}
                    </button>
                  </form>

                  {reputationResult && (
                    <div
                      className={`mt-4 rounded-xl p-4 border flex flex-col gap-1 ${reputationResult.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                    >
                      <p className={`text-sm font-bold flex items-center gap-2 ${reputationResult.success ? 'text-green-800' : 'text-red-700'}`}>
                        {reputationResult.success
                          ? <><CheckIcon className="w-3.5 h-3.5" /> Reputation updated</>
                          : <><XIcon className="w-3.5 h-3.5" /> Failed</>
                        }
                      </p>
                      {reputationResult.txHash && (
                        <a
                          href={`https://testnet.monadscan.com/tx/${reputationResult.txHash}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 font-semibold"
                        >
                          View Transaction →
                        </a>
                      )}
                      {reputationResult.error && (
                        <p className="text-xs text-red-700">{reputationResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── REPUTATION HISTORY ─────────────────────────────────────────── */}
            {userProfile.reputationHistory?.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Reputation History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{userProfile.reputationHistory.length} entries</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Date', 'Type', 'Amount', 'Reason', 'Transaction'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {userProfile.reputationHistory.map((log, i) => (
                        <tr key={i} className="hover:bg-yellow-50/40 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${log.type === 'add'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                            >
                              {log.type === 'add'
                                ? <PlusIcon className="w-3 h-3" />
                                : <MinusIcon className="w-3 h-3" />
                              }
                              {log.type === 'add' ? 'Add' : 'Deduct'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-black ${log.type === 'add' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {log.type === 'add' ? '+' : '-'}{log.amount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={`https://testnet.monadscan.com/tx/${log.tx_hash}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:border-yellow-400 hover:bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all duration-200"
                            >
                              View →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TICKET LIST ────────────────────────────────────────────────── */}
            {userProfile.tickets.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Ticket History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{userProfile.tickets.length} tickets</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Event', 'Minted At', 'Status'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {userProfile.tickets.map((ticket) => (
                        <tr key={ticket.dbId} className="hover:bg-yellow-50/40 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {ticket.eventName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ticket.mintedAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${ticket.isCheckedIn
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}
                            >
                              {ticket.isCheckedIn
                                ? <><CheckIcon className="w-3 h-3" /> Checked In</>
                                : 'Not Attended'
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

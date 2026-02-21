'use client';

import { useState } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface Ticket {
  id: number;
  eventName: string;
  mintedAt: string;
  checkedIn: boolean;
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

export default function UserManagementPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Revocation state
  const [isRevoking, setIsRevoking] = useState(false);
  const [revocationResult, setRevocationResult] = useState<ApiResult | null>(null);

  // Reputation adjustment state
  const [reputationAmount, setReputationAmount] = useState('50');
  const [reputationReason, setReputationReason] = useState('');
  const [reputationType, setReputationType] = useState<'add' | 'deduct'>('add');
  const [isAdjustingReputation, setIsAdjustingReputation] = useState(false);
  const [reputationResult, setReputationResult] = useState<ApiResult | null>(null);

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    setIsLoading(true);
    setError('');
    setUserProfile(null);
    setRevocationResult(null);
    setReputationResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/${walletAddress.trim()}`);
      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data);
      } else {
        setError('User not found or no identity issued');
      }
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
      const response = await fetch(`${BACKEND_URL}/api/identity/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: userProfile.identity.tokenId,
          status: revoke
        })
      });

      const data = await response.json();
      setRevocationResult(data);

      if (data.success) {
        // Refresh user data
        const refreshResponse = await fetch(`${BACKEND_URL}/api/user/${walletAddress}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setUserProfile(refreshData);
        }
      }
    } catch {
      setRevocationResult({
        success: false,
        error: 'Failed to update revocation status'
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleAdjustReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.identity) return;
    if (!reputationReason.trim()) {
      setReputationResult({
        success: false,
        error: 'Please provide a reason for reputation adjustment'
      });
      return;
    }

    setIsAdjustingReputation(true);
    setReputationResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/identity/reputation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: userProfile.identity.tokenId,
          amount: parseInt(reputationAmount) || 50,
          reason: reputationReason.trim(),
          type: reputationType
        })
      });

      const data = await response.json();
      setReputationResult(data);

      if (data.success) {
        // Reset form
        setReputationReason('');
        
        // Refresh user data
        const refreshResponse = await fetch(`${BACKEND_URL}/api/user/${walletAddress}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setUserProfile(refreshData);
        }
      }
    } catch {
      setReputationResult({
        success: false,
        error: 'Failed to adjust reputation'
      });
    } finally {
      setIsAdjustingReputation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">👥 User Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage user identities, revocations, and reputation</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search User</h2>
          <form onSubmit={handleSearchUser} className="flex gap-4">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address (0x...)"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border font-mono text-sm"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`rounded-lg px-6 py-2 text-sm font-semibold text-white ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* User Profile Display */}
        {userProfile && (
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Identity Information</h2>
                  <p className="text-sm text-gray-500 font-mono">{userProfile.wallet}</p>
                </div>
                {userProfile.identity && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    userProfile.identity.isRevoked
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {userProfile.identity.isRevoked ? '🚫 Revoked' : '✓ Active'}
                  </span>
                )}
              </div>

              {userProfile.identity ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Token ID</dt>
                      <dd className="text-lg font-semibold text-gray-900">#{userProfile.identity.tokenId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Reputation Score</dt>
                      <dd className="text-3xl font-bold text-blue-600 font-mono tracking-tight">{userProfile.identity.activeReputation}</dd>
                      <p className="mt-1 text-xs text-gray-500 italic">Includes dynamic time-based decay</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">KYC Verified</span>
                      <span className={`font-semibold ${userProfile.identity.isKycVerified ? 'text-green-600' : 'text-gray-400'}`}>
                        {userProfile.identity.isKycVerified ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Age 18+</span>
                      <span className={`font-semibold ${userProfile.identity.isOver18 ? 'text-green-600' : 'text-gray-400'}`}>
                        {userProfile.identity.isOver18 ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm text-gray-900">{userProfile.identity.lastUpdate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Tickets</span>
                      <span className="text-sm font-semibold text-gray-900">{userProfile.tickets.length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No identity found for this wallet address
                </div>
              )}
            </div>

            {/* Admin Actions */}
            {userProfile.identity && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revocation Panel */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🚫 Revocation Control</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Revoke or restore access to this identity. Revoked identities cannot access any events or services.
                  </p>

                  <div className="flex gap-3">
                    {!userProfile.identity.isRevoked ? (
                      <button
                        onClick={() => handleRevokeIdentity(true)}
                        disabled={isRevoking}
                        className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold ${
                          isRevoking
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-500'
                        }`}
                      >
                        {isRevoking ? 'Processing...' : 'Revoke Identity'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRevokeIdentity(false)}
                        disabled={isRevoking}
                        className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold ${
                          isRevoking
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-500'
                        }`}
                      >
                        {isRevoking ? 'Processing...' : 'Restore Identity'}
                      </button>
                    )}
                  </div>

                  {revocationResult && (
                    <div className={`mt-4 rounded-lg p-3 ${
                      revocationResult.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        revocationResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {revocationResult.success ? '✅ Success!' : '❌ Failed'}
                      </p>
                      {revocationResult.txHash && (
                        <a
                          href={`https://testnet.monadscan.com/tx/${revocationResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                          View Transaction →
                        </a>
                      )}
                      {revocationResult.error && (
                        <p className="text-xs text-red-700 mt-1">{revocationResult.error}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Reputation Adjustment Panel */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ Reputation Adjustment</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Manually add or deduct reputation points with a reason.
                  </p>

                  <form onSubmit={handleAdjustReputation} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action Type
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setReputationType('add')}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                            reputationType === 'add'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          ➕ Add Points
                        </button>
                        <button
                          type="button"
                          onClick={() => setReputationType('deduct')}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                            reputationType === 'deduct'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          ➖ Deduct Points
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reputationAmount" className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <input
                        type="number"
                        id="reputationAmount"
                        value={reputationAmount}
                        onChange={(e) => setReputationAmount(e.target.value)}
                        min="1"
                        max="1000"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label htmlFor="reputationReason" className="block text-sm font-medium text-gray-700">
                        Reason *
                      </label>
                      <textarea
                        id="reputationReason"
                        value={reputationReason}
                        onChange={(e) => setReputationReason(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                        placeholder="e.g., Manual correction, Exceptional behavior, Policy violation"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAdjustingReputation}
                      className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white ${
                        isAdjustingReputation
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500'
                      }`}
                    >
                      {isAdjustingReputation ? 'Processing...' : 'Apply Adjustment'}
                    </button>
                  </form>

                  {reputationResult && (
                    <div className={`mt-4 rounded-lg p-3 ${
                      reputationResult.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        reputationResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {reputationResult.success ? '✅ Reputation Updated!' : '❌ Failed'}
                      </p>
                      {reputationResult.txHash && (
                        <a
                          href={`https://testnet.monadscan.com/tx/${reputationResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                          View Transaction →
                        </a>
                      )}
                      {reputationResult.error && (
                        <p className="text-xs text-red-700 mt-1">{reputationResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reputation History */}
            {userProfile.reputationHistory && userProfile.reputationHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Reputation History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userProfile.reputationHistory.map((log, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.type === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.type === 'add' ? '➕ Add' : '➖ Deduct'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {log.type === 'add' ? '+' : '-'}{log.amount}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{log.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a
                              href={`https://testnet.monadscan.com/tx/${log.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
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
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';
import { ethers } from 'ethers';

export default function DashboardPage() {
  const { address, isConnected, isConnecting } = useAccount();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  
  // Fetch live on-chain profile data
  const { data: profile, isLoading: profileLoading, error: profileError } = useRacePassProfile();

  // Wait for client-side hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only check after client-side hydration
    if (!isClient) return;

    // Only redirect after wagmi has finished checking connection
    if (!isConnecting && !isConnected) {
      router.push('/');
      return;
    }
  }, [isClient, isConnecting, isConnected, router]);

  const handleTransferTicket = async () => {
    if (!selectedTicket || !transferRecipient || !address) return;

    // Validate Ethereum address
    if (!ethers.isAddress(transferRecipient)) {
      setTransferError('Invalid Ethereum address');
      return;
    }

    setIsTransferring(true);
    setTransferError('');

    try {
      // Connect to user's wallet
      if (!(window as any).ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // RacePassTicket contract address (from backend)
      const TICKET_ADDRESS = '0xb3BA57B6FEDb83030244e1fe6DB832dfC77B1c57';

      // ERC-721 standard transfer ABI
      const ticketABI = [
        'function safeTransferFrom(address from, address to, uint256 tokenId)',
        'function ownerOf(uint256 tokenId) view returns (address)'
      ];

      const ticketContract = new ethers.Contract(TICKET_ADDRESS, ticketABI, signer);

      // Verify ownership
      const owner = await ticketContract.ownerOf(selectedTicket.onChainId);
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('You do not own this ticket');
      }

      // Execute transfer
      const tx = await ticketContract.safeTransferFrom(
        address,
        transferRecipient,
        selectedTicket.onChainId
      );

      await tx.wait();
      
      alert(`Ticket #${selectedTicket.onChainId} successfully transferred to ${transferRecipient}!`);
      
      // Reset state
      setShowTransferModal(false);
      setTransferRecipient('');
      setSelectedTicket(null);
      
      // Refresh profile to update ticket list
      window.location.reload();
    } catch (error: any) {
      console.error('Transfer error:', error);
      setTransferError(error.message || 'Failed to transfer ticket');
    } finally {
      setIsTransferring(false);
    }
  };

  // Show loading during SSR or while wagmi is checking connection
  if (!isClient || isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your digital identity and credentials
          </p>
        </div>

        {/* Wallet Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Connected Wallet
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Ethereum Address</p>
                <p className="text-sm text-gray-500 font-mono">{address}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Connected
            </span>
          </div>
        </div>

        {/* KYC Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              RacePass Identity
            </h2>
            
            {profileLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading your identity...</p>
              </div>
            ) : profile?.identity ? (
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">RacePass ID</h3>
                    <p className="text-blue-100 text-sm">Soulbound Identity Token</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">#{profile.identity.tokenId}</p>
                    {profile.identity.isRevoked && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white mt-1">
                        REVOKED
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="bg-white/10 rounded-lg p-4 flex items-center justify-between border border-white/5">
                    <div>
                      <p className="text-blue-200 text-xs mb-1">Reputation Score</p>
                      <p className="text-4xl font-bold">{profile.identity.activeReputation}</p>
                      <p className="text-blue-200 text-[10px] mt-1 italic opacity-80">Live trust score with dynamic decay</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest">
                        Excellent
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-blue-500/30 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">KYC Verified</span>
                    <span className="flex items-center">
                      {profile.identity.isKycVerified ? (
                        <>
                          <svg className="h-5 w-5 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-400 font-semibold">Verified</span>
                        </>
                      ) : (
                        <span className="text-yellow-400">Not Verified</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Age Verification</span>
                    <span className="text-white font-semibold">
                      {profile.identity.isOver18 ? '18+' : 'Under 18'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Last Updated</span>
                    <span className="text-white text-sm">{profile.identity.lastUpdate}</span>
                  </div>
                </div>

                {profile.verifiableAttestations && profile.verifiableAttestations.length > 0 && (
                  <div className="border-t border-blue-500/30 pt-4 mt-4">
                    <p className="text-blue-200 text-sm mb-2">Portable Credentials</p>
                    <div className="flex space-x-2">
                      {profile.verifiableAttestations.slice(0, 3).map((attestation) => (
                        <div key={attestation.uid} className="bg-white/10 rounded px-3 py-1 text-xs">
                          {attestation.eventName}
                        </div>
                      ))}
                      {profile.verifiableAttestations.length > 3 && (
                        <div className="bg-white/10 rounded px-3 py-1 text-xs">
                          +{profile.verifiableAttestations.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No RacePass Identity Found
                </h3>
                <p className="mt-2 text-gray-600">
                  Complete KYC verification to mint your on-chain identity
                </p>
                <Link
                  href="/kyc"
                  className="mt-6 inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Start KYC Verification
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/events"
                className="block w-full rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Browse Events</p>
                    <p className="text-xs text-gray-500">Find upcoming events</p>
                  </div>
                </div>
              </Link>

              {!profile?.identity && (
                <Link
                  href="/kyc"
                  className="block w-full rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Complete KYC</p>
                      <p className="text-xs text-gray-500">Verify your identity</p>
                    </div>
                  </div>
                </Link>
              )}

              {profile?.tickets && profile.tickets.length > 0 ? (
                <Link
                  href="#tickets"
                  className="block w-full rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">My Tickets</p>
                        <p className="text-xs text-gray-500">{profile.tickets.length} ticket{profile.tickets.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {profile.tickets.length}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-50 cursor-not-allowed">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">My Tickets</p>
                      <p className="text-xs text-gray-400">No tickets yet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        {profile?.tickets && profile.tickets.length > 0 && (
          <div id="tickets" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Event Tickets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.tickets.map((ticket) => (
                <div
                  key={ticket.dbId}
                  className={`rounded-lg border-2 p-4 ${
                    ticket.isCheckedIn
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{ticket.eventName}</h3>
                      <p className="text-xs text-gray-500 font-mono">#{ticket.onChainId}</p>
                    </div>
                    {ticket.isCheckedIn ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        ✓ Used
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                        Valid
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <p>Minted: {new Date(ticket.mintedAt).toLocaleDateString()}</p>
                    {ticket.txHash && (
                      <a
                        href={`https://testnet.monadscan.com/tx/${ticket.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-500 block"
                      >
                        View Transaction →
                      </a>
                    )}
                  </div>
                  {!ticket.isCheckedIn && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowQrModal(true);
                        }}
                        className="w-full mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                      >
                        📱 Show QR Code for Entry
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowTransferModal(true);
                        }}
                        className="w-full rounded-lg bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200"
                      >
                        🔄 Transfer Ticket
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reputation History Feed */}
        {profile?.reputationHistory && profile.reputationHistory.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Reputation Ledger</h2>
              <span className="text-sm text-gray-500 font-medium">Detailed Trust History</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                {profile.reputationHistory.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center">
                      <div className={`p-2.5 rounded-xl mr-4 ${
                        log.type === 'add' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {log.type === 'add' ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{log.reason}</p>
                        <div className="flex items-center mt-0.5 space-x-2">
                          <span className="text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            log.type === 'add' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {log.type === 'add' ? 'Trust Earned' : 'Trust Deducted'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${
                        log.type === 'add' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {log.type === 'add' ? '+' : '-'}{log.amount}
                      </p>
                      {log.tx_hash && (
                        <a 
                          href={`https://testnet.monadscan.com/tx/${log.tx_hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[10px] text-blue-500 hover:text-blue-700 font-mono mt-1"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {log.tx_hash.substring(0, 8)}...
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {profile.reputationHistory.length === 0 && (
                <div className="p-8 text-center bg-gray-50/50">
                  <p className="text-gray-500 text-sm italic">No reputation events recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQrModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Entry Pass</h2>
                <button
                  onClick={() => {
                    setShowQrModal(false);
                    setSelectedTicket(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTicket.eventName}</h3>
                <p className="text-sm text-gray-500 mb-6">Ticket #{selectedTicket.onChainId}</p>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                    alt="QR Code"
                    className="mx-auto"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-blue-800 font-semibold mb-2">Your Wallet Address:</p>
                  <code className="text-xs text-blue-900 break-all block bg-white p-2 rounded">
                    {address}
                  </code>
                </div>

                <div className="text-xs text-gray-500 space-y-2">
                  <p>📱 Show this QR code to the gate scanner at the event entrance</p>
                  <p>🔐 This QR contains your wallet address for identity verification</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Transfer Ticket</h2>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferRecipient('');
                    setTransferError('');
                    setSelectedTicket(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Ticket Details</h3>
                  <p className="text-sm text-blue-800"><strong>Event:</strong> {selectedTicket.eventName}</p>
                  <p className="text-sm text-blue-800"><strong>Token ID:</strong> #{selectedTicket.onChainId}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-900 mb-1">Important Notice</h3>
                      <p className="text-xs text-yellow-800">
                        Tickets can only be transferred to wallets with a valid RacePass Identity. 
                        The recipient must have completed KYC verification first.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Wallet Address *
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    value={transferRecipient}
                    onChange={(e) => {
                      setTransferRecipient(e.target.value);
                      setTransferError('');
                    }}
                    placeholder="0x..."
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 font-mono text-sm p-3 border"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the Ethereum address of the recipient
                  </p>
                </div>

                {transferError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">❌ {transferError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferRecipient('');
                      setTransferError('');
                      setSelectedTicket(null);
                    }}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    disabled={isTransferring}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransferTicket}
                    disabled={isTransferring || !transferRecipient.trim()}
                    className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white ${
                      isTransferring || !transferRecipient.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500'
                    }`}
                  >
                    {isTransferring ? 'Transferring...' : '🔄 Transfer Ticket'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Security & Privacy</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your credentials are cryptographically signed and stored securely. Only you
                  control who can access your verification status. Your personal data never
                  appears on the blockchain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface Attestation {
  uid: string;
  eventName: string;
  reputationValue: number;
  issuedAt: string;
  payload: any;
}

export default function CredentialsPage() {
  const { address, isConnected } = useAccount();
  const { data: profile, isLoading: profileLoading } = useRacePassProfile();
  const [selectedAttestation, setSelectedAttestation] = useState<Attestation | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  // Presentation builder state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set());
  const [showPresentationModal, setShowPresentationModal] = useState(false);

  const handleVerifyAttestation = async (attestation: Attestation) => {
    setIsVerifying(true);
    setVerificationResult(null);
    setSelectedAttestation(attestation);

    try {
      const response = await fetch(`${BACKEND_URL}/api/attest/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attestation: attestation.payload })
      });

      const data = await response.json();
      setVerificationResult(data);
    } catch (error) {
      setVerificationResult({
        success: false,
        error: 'Failed to verify attestation'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyAttestation = (attestation: Attestation) => {
    const attestationData = JSON.stringify(attestation.payload, null, 2);
    navigator.clipboard.writeText(attestationData);
    alert('Attestation copied to clipboard! You can now share this with third parties for verification.');
  };

  const toggleCredentialSelection = (uid: string) => {
    const newSelection = new Set(selectedCredentials);
    if (newSelection.has(uid)) {
      newSelection.delete(uid);
    } else {
      newSelection.add(uid);
    }
    setSelectedCredentials(newSelection);
  };

  const handleCreatePresentation = () => {
    if (selectedCredentials.size === 0) {
      alert('Please select at least one credential to create a presentation');
      return;
    }
    setShowPresentationModal(true);
  };

  const handleCopyPresentation = () => {
    const selectedAttestations = attestations.filter(a => selectedCredentials.has(a.uid));
    const presentation = {
      version: '1.0',
      issuer: 'RacePass Platform',
      issuedAt: new Date().toISOString(),
      holder: address,
      credentials: selectedAttestations.map(a => ({
        uid: a.uid,
        eventName: a.eventName,
        reputationValue: a.reputationValue,
        issuedAt: a.issuedAt,
        payload: a.payload
      }))
    };
    
    navigator.clipboard.writeText(JSON.stringify(presentation, null, 2));
    alert(`Presentation with ${selectedCredentials.size} credential(s) copied to clipboard! Share this with third parties for verification.`);
    setShowPresentationModal(false);
    setIsSelectionMode(false);
    setSelectedCredentials(new Set());
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-6">Please connect your wallet to view your credentials</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-gray-500">Loading credentials...</div>
        </div>
      </div>
    );
  }

  const attestations = profile?.verifiableAttestations || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🎫 Credentials Wallet</h1>
          <p className="mt-2 text-lg text-gray-600">
            Your verifiable off-chain attestations for privacy-preserving proofs
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 bg-purple-50 rounded-xl border border-purple-200 p-6">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">What are Credentials?</h3>
              <p className="mt-1 text-sm text-purple-700">
                These are cryptographically signed proofs of your event attendance, issued using the Ethereum Attestation Service (EAS). 
                You can share these with third parties to prove you attended specific events without revealing your entire transaction history.
              </p>
            </div>
          </div>
        </div>

        {/* Presentation Builder Controls */}
        {attestations.length > 0 && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isSelectionMode ? `${selectedCredentials.size} credential(s) selected` : 'Presentation Builder'}
              </h3>
              <p className="text-xs text-gray-600">
                {isSelectionMode ? 'Select credentials to bundle into a verifiable presentation' : 'Bundle multiple credentials for high-value verifications'}
              </p>
            </div>
            <div className="flex gap-2">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedCredentials(new Set());
                    }}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePresentation}
                    disabled={selectedCredentials.size === 0}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                      selectedCredentials.size === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-500'
                    }`}
                  >
                    Create Presentation ({selectedCredentials.size})
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/verify"
                    className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                  >
                    🔍 Verify Credentials
                  </Link>
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                  >
                    📦 Build Presentation
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Credentials Grid */}
        {attestations.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Credentials Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Credentials are automatically issued when you check in at events. 
              Attend events to start collecting verifiable attestations!
            </p>
            <Link
              href="/events"
              className="inline-flex items-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attestations.map((attestation) => (
              <div
                key={attestation.uid}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden relative ${
                  isSelectionMode && selectedCredentials.has(attestation.uid) ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="absolute top-4 right-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedCredentials.has(attestation.uid)}
                      onChange={() => toggleCredentialSelection(attestation.uid)}
                      className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Card Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                  <div className="text-3xl mb-2">🎟️</div>
                  <h3 className="text-lg font-semibold">{attestation.eventName}</h3>
                  <div className="mt-2 text-sm opacity-90">
                    +{attestation.reputationValue} Reputation
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500">Attestation ID</dt>
                      <dd className="text-sm font-mono text-gray-900 break-all">
                        {attestation.uid.slice(0, 16)}...{attestation.uid.slice(-8)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Issued At</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(attestation.issuedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </dd>
                    </div>
                  </dl>

                  {/* Actions */}
                  {!isSelectionMode && (
                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => handleVerifyAttestation(attestation)}
                        className="flex-1 rounded-lg bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleCopyAttestation(attestation)}
                        className="flex-1 rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                      >
                        Share
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Modal */}
        {selectedAttestation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Attestation Details</h2>
                <button
                  onClick={() => {
                    setSelectedAttestation(null);
                    setVerificationResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Event</h3>
                  <div className="text-lg font-semibold text-gray-900">{selectedAttestation.eventName}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Attestation UID</h3>
                  <code className="text-xs bg-gray-100 p-3 rounded-lg block break-all">
                    {selectedAttestation.uid}
                  </code>
                </div>

                {isVerifying && (
                  <div className="text-center py-6">
                    <div className="text-gray-500">Verifying attestation signature...</div>
                  </div>
                )}

                {verificationResult && (
                  <div className={`rounded-lg p-4 ${
                    verificationResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      verificationResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {verificationResult.success ? '✅ Attestation Verified!' : '❌ Verification Failed'}
                    </div>
                    <div className={`mt-2 text-sm ${
                      verificationResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {verificationResult.message || verificationResult.error}
                    </div>
                    {verificationResult.success && verificationResult.issuer && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="text-xs text-green-600">
                          <div><strong>Issuer:</strong> {verificationResult.issuer}</div>
                          <div><strong>Recipient:</strong> {verificationResult.recipient}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Raw Payload (JSON)</h3>
                  <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedAttestation.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Presentation Modal */}
        {showPresentationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Verifiable Presentation</h2>
                <button
                  onClick={() => setShowPresentationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">✅ Presentation Ready</h3>
                  <p className="text-sm text-green-700">
                    You've bundled {selectedCredentials.size} credential(s) into a single verifiable presentation. 
                    This allows you to prove multiple attributes in one shareable package.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Included Credentials:</h3>
                  <div className="space-y-2">
                    {attestations
                      .filter(a => selectedCredentials.has(a.uid))
                      .map(att => (
                        <div key={att.uid} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{att.eventName}</p>
                              <p className="text-xs text-gray-600">+{att.reputationValue} rep</p>
                            </div>
                            <span className="text-xs text-purple-700 font-mono">
                              {att.uid.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 How to Use</h3>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Click "Copy Presentation" below</li>
                    <li>Share the JSON with the verifying party</li>
                    <li>They can verify it at the public verification portal</li>
                    <li>All credentials are cryptographically signed and tamper-proof</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPresentationModal(false)}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCopyPresentation}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-500"
                  >
                    📋 Copy Presentation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

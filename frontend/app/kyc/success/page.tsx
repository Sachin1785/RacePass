'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/Navbar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface KycSession {
  sessionId: string;
  status: string;
  completedAt: string;
}

export default function KycSuccessPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [session, setSession] = useState<KycSession | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [identityTokenId, setIdentityTokenId] = useState<string | null>(null);
  const mintAttempted = useRef(false);

  useEffect(() => {
    // Retrieve session from localStorage
    const storedSession = localStorage.getItem('kyc_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
      } catch (error) {
        console.error('Error parsing session:', error);
        router.push('/kyc');
      }
    } else {
      router.push('/kyc');
    }
  }, [router]);

  // Unified bridge logic: Link the KYC session to the On-Chain Identity
  useEffect(() => {
    const triggerIdentityMint = async () => {
      if (!address || !session || mintAttempted.current || isMinting) return;
      
      // Only proceed if record suggests verification is complete
      if (session.status.toLowerCase() !== 'completed' && session.status.toLowerCase() !== 'approved') {
        console.log('Verification not yet approved, status:', session.status);
        return;
      }

      mintAttempted.current = true;
      setIsMinting(true);
      setMintError(null);

      try {
        console.log(`Verifying Didit session ${session.sessionId} and minting Identity SBT for ${address}...`);
        
        // 1. Verify Didit status with our backend (which can call Didit API server-side)
        // For this hackathon version, we assume the frontend 'completed' status is enough 
        // to trigger our backend's identity issuance.
        
        const response = await fetch(`${BACKEND_URL}/api/identity/issue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: address,
            isKycVerified: true,
            isOver18: true, // In production, we'd parse this from Didit's result
            initialReputation: 100
          }),
        });

        const result = await response.json();

        if (result.success) {
          setMintTxHash(result.txHash);
          setIdentityTokenId(result.tokenId);
          
          // Clear the session from localStorage as it's now an on-chain identity
          // localStorage.removeItem('kyc_session'); 
          
          // Auto-redirect to dashboard after 5 seconds of celebration
          setTimeout(() => {
            router.push('/dashboard');
          }, 5000);
        } else {
          throw new Error(result.error || 'Failed to mint Identity SBT');
        }
      } catch (err) {
        console.error('Minting error:', err);
        setMintError(err instanceof Error ? err.message : 'Unknown error during minting');
        mintAttempted.current = false; // Allow retry if it failed
      } finally {
        setIsMinting(false);
      }
    };

    if (isConnected && address && session) {
      triggerIdentityMint();
    }
  }, [isConnected, address, session, isMinting, router]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'in review':
        return 'text-yellow-600 bg-yellow-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Verification Submitted!
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Your identity verification has been submitted successfully.
          </p>
        </div>

        {/* Session Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Verification Details
            </h2>
            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center shadow-sm border ${
              identityTokenId 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : isMinting 
                ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              {identityTokenId ? (
                <>
                  <span className="mr-2">🏁</span>
                  Identity Minted!
                </>
              ) : isMinting ? (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mr-2"></div>
                  Minting on Monad...
                </>
              ) : (
                'Processing'
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {identityTokenId && (
              <div className="flex justify-between items-start border-b border-green-100 bg-green-50/30 p-4 rounded-lg">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-green-600">RacePass ID (SBT)</p>
                  <p className="text-2xl font-mono text-gray-900 mt-1">
                    #{identityTokenId}
                  </p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Identity successfully stored on Monad Testnet
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <p className="text-sm text-gray-500">Session ID</p>
                <p className="text-base font-mono text-gray-900 mt-1">
                  {session.sessionId}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <p className="text-sm text-gray-500">Verification Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
            </div>

            {mintTxHash && (
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <div>
                  <p className="text-sm text-gray-500">Transaction Hash</p>
                  <a 
                    href={`https://testnet.monadscan.com/tx/${mintTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-blue-600 hover:text-blue-500 mt-1 block"
                  >
                    {mintTxHash.slice(0, 16)}...{mintTxHash.slice(-16)}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/dashboard"
            className={`inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold shadow-sm transition-all duration-200 ${
              identityTokenId 
                ? 'bg-blue-600 text-white hover:bg-blue-500 scale-105' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Go to Racing Dashboard
            {identityTokenId && (
              <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Return Home
          </Link>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-6 w-6 text-blue-400"
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
              <h3 className="text-sm font-medium text-blue-800">What&apos;s Next?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Your verification is being processed. You&apos;ll receive updates on the status:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Approved</strong> - You can now access age-restricted events</li>
                  <li><strong>In Review</strong> - Our team is reviewing your submission</li>
                  <li><strong>Declined</strong> - Please contact support for assistance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex justify-center items-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/events"
            className="inline-flex justify-center items-center rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </main>
    </div>
  );
}

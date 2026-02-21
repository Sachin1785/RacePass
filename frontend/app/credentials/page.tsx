'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface Attestation {
  uid: string;
  eventName: string;
  reputationValue: number;
  issuedAt: string;
  payload: any;
}

// ─── Animation Helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as any, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay },
});

export default function CredentialsPage() {
  const { address, isConnected } = useAccount();
  const { data: profile, isLoading: profileLoading } = useRacePassProfile();
  const [selectedAttestation, setSelectedAttestation] = useState<Attestation | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  
  // Presentation builder state
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Redirect unverified users to KYC
  useEffect(() => {
    if (isClient && !profileLoading && !profile?.identity?.isKycVerified) {
      router.push('/kyc');
    }
  }, [isClient, profileLoading, profile?.identity?.isKycVerified, router]);
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set());
  const [showPresentationModal, setShowPresentationModal] = useState(false);

  const attestations = (profile?.verifiableAttestations || []) as Attestation[];

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
      setVerificationResult({ success: false, error: 'Failed to verify attestation' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyAttestation = (attestation: Attestation) => {
    const attestationData = JSON.stringify(attestation.payload, null, 2);
    navigator.clipboard.writeText(attestationData);
    alert('Attestation copied to clipboard! You can share this for off-chain verification.');
  };

  const toggleCredentialSelection = (uid: string) => {
    const newSelection = new Set(selectedCredentials);
    if (newSelection.has(uid)) { newSelection.delete(uid); } else { newSelection.add(uid); }
    setSelectedCredentials(newSelection);
  };

  const handleCreatePresentation = () => {
    if (selectedCredentials.size === 0) {
      alert('Please select at least one credential');
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
    alert('Presentation bundle copied to clipboard!');
    setShowPresentationModal(false);
    setIsSelectionMode(false);
    setSelectedCredentials(new Set());
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      <main className="relative overflow-hidden bg-linear-to-b from-amber-50 via-white to-white min-h-[calc(100vh-64px)] pb-20">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #f59e0b22 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-175 h-100 rounded-full bg-amber-200/30 blur-3xl opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            
            {/* Header */}
            <motion.div {...fadeUp(0)} className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="max-w-xl">
                    <motion.div {...fadeIn(0.1)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 mb-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                            Attestation Wallet
                        </span>
                    </motion.div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Verifiable <span className="text-amber-500 underline decoration-amber-200 underline-offset-4">Credentials</span></h1>
                    <p className="mt-3 text-gray-500 font-medium leading-relaxed">
                        Manage your signed proofs of attendance and reputation. These are portable credentials you can share without exposing your wallet history.
                    </p>
                </div>

                <div className="flex gap-3">
                    {attestations.length > 0 && (
                        <button
                          onClick={() => { setIsSelectionMode(!isSelectionMode); if(isSelectionMode) setSelectedCredentials(new Set()); }}
                          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            isSelectionMode ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {isSelectionMode ? 'Cancel Selection' : '🛡️ Build Presentation'}
                        </button>
                    )}
                    {isSelectionMode && selectedCredentials.size > 0 && (
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            onClick={handleCreatePresentation}
                            className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/20"
                        >
                            Bundle {selectedCredentials.size} Items
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* Content Area */}
            {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-md rounded-[3rem] border border-amber-100">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Digital Wallet...</p>
                </div>
            ) : attestations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attestations.map((att, idx) => (
                        <motion.div
                            key={att.uid}
                            {...fadeUp(0.1 + idx * 0.05)}
                            onClick={() => isSelectionMode && toggleCredentialSelection(att.uid)}
                            className={`group relative overflow-hidden rounded-[2.5rem] p-8 border transition-all duration-300 ${
                                isSelectionMode 
                                    ? (selectedCredentials.has(att.uid) ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-amber-100 opacity-60 grayscale cursor-pointer') 
                                    : 'bg-white border-amber-100 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/5'
                            }`}
                        >
                            {/* Card Edge Cut-outs */}
                            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-amber-50 border border-amber-100 rounded-full -translate-y-1/2" />
                            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-amber-50 border border-amber-100 rounded-full -translate-y-1/2" />

                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-300 uppercase">Trust Value</p>
                                    <p className="text-xl font-black text-amber-500">+{att.reputationValue} REP</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-black text-gray-900 leading-tight mb-2">{att.eventName}</h3>
                                <p className="text-xs font-mono text-gray-400 truncate tracking-tighter">UID: {att.uid}</p>
                            </div>

                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {new Date(att.issuedAt).toLocaleDateString()}
                                </span>
                                {!isSelectionMode && (
                                    <div className="flex gap-2">
                                        <button onClick={(e) => {e.stopPropagation(); handleVerifyAttestation(att);}} className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95 transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </button>
                                        <button onClick={(e) => {e.stopPropagation(); handleCopyAttestation(att);}} className="p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 active:scale-95 transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div {...fadeIn(0.2)} className="text-center py-32 bg-amber-50/50 rounded-[3.5rem] border border-dashed border-amber-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <span className="text-4xl grayscale opacity-50 text-amber-500">📜</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Wallet is Empty</h3>
                    <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
                        You haven't earned any verifiable credentials yet. Race clean and attend events to build your portable reputation.
                    </p>
                    <Link href="/events" className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform">
                        Find Your First Event
                    </Link>
                </motion.div>
            )}

            {/* Verification Result Modal */}
            <AnimatePresence>
                {selectedAttestation && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl relative border border-amber-100 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <button onClick={() => setSelectedAttestation(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h3 className="text-2xl font-black text-gray-900 mb-6">Credential <span className="text-amber-500">Audit</span></h3>
                            
                            <div className="space-y-6">
                                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Authenticity Check</p>
                                    {isVerifying ? (
                                        <div className="flex items-center gap-3 py-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                                            <span className="text-sm font-bold text-gray-500">Querying global attestation registry...</span>
                                        </div>
                                    ) : verificationResult?.success ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-green-600">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-black uppercase tracking-widest">Valid Attestation</span>
                                            </div>
                                            <div className="bg-white/50 rounded-2xl p-4 text-[10px] font-mono text-gray-600 overflow-x-auto whitespace-pre">
                                                {JSON.stringify(verificationResult, null, 2)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-red-600">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-black uppercase tracking-widest">Verification Failed</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setSelectedAttestation(null)} className="w-full py-4 bg-gray-900 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-black transition-colors">
                                    Close Audit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Presentation Builder Drawer */}
            <AnimatePresence>
                {showPresentationModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-end justify-center p-0 md:p-4"
                    >
                        <motion.div 
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-white rounded-t-[40px] md:rounded-[40px] max-w-lg w-full p-10 shadow-3xl border border-amber-100 ring-4 ring-amber-500/5"
                        >
                            <div className="text-center">
                                <div className="w-20 h-2 bg-gray-100 rounded-full mx-auto mb-8 md:hidden" />
                                <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <span className="text-3xl text-amber-500">🛡️</span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Presentation <span className="text-amber-500">Bundle</span></h3>
                                <p className="text-gray-500 font-medium text-sm mb-8 px-8">
                                    You've selected {selectedCredentials.size} credentials. This will create a local presentation proof for third-party verification.
                                </p>

                                <div className="space-y-3 mb-8">
                                    <button onClick={handleCopyPresentation} className="w-full py-5 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-transform">
                                        Bundle and Copy to Clipboard
                                    </button>
                                    <button onClick={() => setShowPresentationModal(false)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">
                                        Cancel Build
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                                    Privacy Preservation: Selected data remains local till you share.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
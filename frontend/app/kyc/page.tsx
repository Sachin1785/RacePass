'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KycForm } from '@/components/KycForm';
import { motion } from 'framer-motion';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';

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

export default function KycPage() {
  const { isConnected, isConnecting } = useAccount();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useRacePassProfile();

  // Wait for client-side hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Redirect verified users to dashboard
  useEffect(() => {
    if (isClient && !profileLoading && profile?.identity?.isKycVerified) {
      router.push('/dashboard');
    }
  }, [isClient, profileLoading, profile?.identity?.isKycVerified, router]);

  // Show loading during SSR or while wagmi is checking connection
  if (!isClient || isConnecting) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Connecting...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500 font-medium">Please connect your wallet to continue.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      <main className="relative overflow-hidden bg-white min-h-[calc(100vh-64px)]">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #f5c51833 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div {...fadeUp(0)} className="text-center mb-12">
            {/* Badge */}
            <motion.div {...fadeIn(0.1)} className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3 mx-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
                Identity Verification
              </span>
            </motion.div>

            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
              Complete Your{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-yellow-500">KYC</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q100 0 200 6" stroke="#f5c518" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Verify your identity once and use it everywhere. Our privacy-first process typically takes 2-5 minutes.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 overflow-hidden relative">
            <div className="relative z-10 font-medium">
              <KycForm />
            </div>
            {/* Accent line */}
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
          </motion.div>

          {/* Requirements Panel */}
          <motion.div {...fadeUp(0.25)} className="bg-gray-50 rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              Requirements
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4 text-gray-600">
              {[
                "Government-issued ID",
                "Clear selfie photo"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { KycForm } from '@/components/KycForm';
import { motion } from 'framer-motion';

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
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Wait for client-side hydration before checking wallet connection
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only check wallet connection after client-side hydration is complete
    if (isClient && !isConnecting && !isConnected) {
      router.push('/');
    }
  }, [isClient, isConnecting, isConnected, router]);

  // Show loading during SSR or while wagmi is checking connection
  if (!isClient || isConnecting) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Connecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not connected after loading finished, this will be caught by useEffect redirect
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500 font-medium">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <main className="relative overflow-hidden bg-linear-to-b from-amber-50 via-white to-white min-h-[calc(100vh-64px)]">
        {/* Subtle grid bg */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #f59e0b22 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-175 h-100 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div {...fadeUp(0)} className="text-center mb-12">
            {/* Badge */}
            <motion.div {...fadeIn(0.1)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 mb-6 mx-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Identity Verification
              </span>
            </motion.div>

            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
              Complete Your{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-amber-500">KYC</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q100 0 200 6" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Verify your identity once and use it everywhere. Our privacy-first process typically takes 2-5 minutes.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl shadow-xl shadow-amber-100/50 border border-gray-100 p-8 mb-10 overflow-hidden relative">
            <div className="relative z-10 font-medium">
              <KycForm />
            </div>
            {/* Subtle card accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
          </motion.div>

          {/* Information Panel */}
          <motion.div {...fadeUp(0.25)} className="bg-amber-50/50 rounded-2xl border border-amber-100 p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-xl">📋</span> Requirements
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4 text-gray-600">
              {[
                "Government-issued ID",
                "Clear selfie photo",
                "Residential address",
                "5 minutes of time"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
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

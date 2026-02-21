'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { KycForm } from '@/components/KycForm';

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
    console.log('[KYC Page] Wallet state:', { isConnecting, isConnected, isClient });
    
    // Only check wallet connection after client-side hydration is complete
    if (isClient && !isConnecting && !isConnected) {
      console.log('[KYC Page] Not connected, redirecting to home...');
      router.push('/');
    }
  }, [isClient, isConnecting, isConnected, router]);

  // Show loading during SSR or while wagmi is checking connection
  if (!isClient || isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Connecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not connected after loading finished, this will be caught by useEffect redirect
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
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Complete Your KYC Verification
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Verify your identity once and use it everywhere. This process typically takes 2-5 minutes.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <KycForm />
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What You'll Need
          </h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
              <span>A valid government-issued ID (passport, driver's license, or national ID)</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
              <span>A clear, recent selfie photo</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
              <span>Your current residential address</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
              <span>5 minutes of your time</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

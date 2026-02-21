'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/Navbar';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your Universal Digital Identity
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
            Complete KYC once, use everywhere. RacePass creates a privacy-preserving 
            digital identity that works across platforms and blockchains.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {isConnected ? (
              <Link
                href="/kyc"
                className="rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
              >
                Complete KYC
              </Link>
            ) : (
              <p className="text-gray-600">Connect your wallet to get started</p>
            )}
            <Link href="/events" className="text-lg font-semibold leading-6 text-gray-900">
              Browse Events <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="text-blue-600 text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Privacy-Preserving
            </h3>
            <p className="text-gray-600">
              Your personal data never touches the blockchain. Use zero-knowledge 
              proofs to verify eligibility without revealing sensitive information.
            </p>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="text-blue-600 text-3xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reusable Credentials
            </h3>
            <p className="text-gray-600">
              Complete verification once and reuse your credentials across 
              multiple platforms. No more repetitive KYC processes.
            </p>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="text-blue-600 text-3xl mb-4">🌐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cross-Platform
            </h3>
            <p className="text-gray-600">
              Works across different blockchains and platforms. Your identity 
              is portable and interoperable by design.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect Wallet</h3>
              <p className="text-gray-600 text-sm">
                Connect your Web3 wallet using MetaMask
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Complete KYC</h3>
              <p className="text-gray-600 text-sm">
                Submit your identity documents once to our trusted verification partner
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Credential</h3>
              <p className="text-gray-600 text-sm">
                Receive a verifiable credential stored securely in your wallet
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-4">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Use Everywhere</h3>
              <p className="text-gray-600 text-sm">
                Access events and platforms without repeating verification
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  issuer?: string;
  recipient?: string;
  details?: any;
}

export default function VerifyPage() {
  const [input, setInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [presentationType, setPresentationType] = useState<'single' | 'bundle' | null>(null);

  const handleVerify = async () => {
    if (!input.trim()) {
      alert('Please paste a credential or presentation JSON');
      return;
    }

    setIsVerifying(true);
    setResults([]);
    setPresentationType(null);

    try {
      const parsed = JSON.parse(input);
      
      // Check if it's a presentation bundle or single attestation
      if (parsed.version && parsed.credentials && Array.isArray(parsed.credentials)) {
        // It's a presentation bundle
        setPresentationType('bundle');
        const verificationResults: VerificationResult[] = [];

        for (const credential of parsed.credentials) {
          try {
            const response = await fetch(`${BACKEND_URL}/api/attest/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ attestation: credential.payload })
            });

            const data = await response.json();
            verificationResults.push({
              ...data,
              eventName: credential.eventName,
              reputationValue: credential.reputationValue
            } as VerificationResult);
          } catch {
            verificationResults.push({
              success: false,
              error: `Failed to verify credential: ${credential.eventName}`,
              eventName: credential.eventName
            } as VerificationResult);
          }
        }

        setResults(verificationResults);
      } else {
        // It's a single attestation
        setPresentationType('single');
        const response = await fetch(`${BACKEND_URL}/api/attest/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attestation: parsed })
        });

        const data = await response.json();
        setResults([data]);
      }
    } catch {
      setResults([{
        success: false,
        error: 'Invalid JSON format. Please paste a valid credential or presentation.'
      }]);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResults([]);
    setPresentationType(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🔍 Credential Verification Portal</h1>
          <p className="mt-2 text-lg text-gray-600">
            Verify the authenticity of RacePass credentials and presentations
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex">
            <div className="shrink-0">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Public Verification Portal</h3>
              <p className="mt-1 text-sm text-blue-700">
                This is a public portal where anyone can verify RacePass credentials without needing a wallet. 
                Simply paste the credential JSON received from a user and click verify to check its authenticity.
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Paste Credential or Presentation</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste the credential JSON here, e.g.:
{
  "version": "1.0",
  "issuer": "RacePass Platform",
  "credentials": [...]
}

Or paste a single attestation payload.'
            rows={12}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-xs p-4 border"
          />
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleVerify}
              disabled={isVerifying || !input.trim()}
              className={`flex-1 rounded-lg px-6 py-3 text-sm font-semibold text-white ${
                isVerifying || !input.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isVerifying ? 'Verifying...' : '🔍 Verify Credential'}
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Verification Results
              {presentationType === 'bundle' && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  (Presentation with {results.length} credential{results.length !== 1 ? 's' : ''})
                </span>
              )}
            </h2>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-2 p-6 ${
                    result.success
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`text-2xl mr-3 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✅' : '❌'}
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                          {result.success ? 'Verified Authentic' : 'Verification Failed'}
                        </h3>
                        {(result as any).eventName && (
                          <p className="text-sm text-gray-700 font-semibold">
                            Event: {(result as any).eventName}
                          </p>
                        )}
                      </div>
                    </div>
                    {result.success && (
                      <span className="inline-flex items-center rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
                        Valid
                      </span>
                    )}
                  </div>

                  <p className={`text-sm mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message || result.error}
                  </p>

                  {result.success && (
                    <div className="border-t border-green-200 pt-4 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs text-green-600 font-medium">Issuer</dt>
                          <dd className="text-sm text-gray-900 font-mono break-all">{result.issuer}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-green-600 font-medium">Recipient</dt>
                          <dd className="text-sm text-gray-900 font-mono break-all">{result.recipient}</dd>
                        </div>
                      </div>

                      {result.details && (
                        <div className="mt-4 bg-white rounded p-3">
                          <dt className="text-xs text-gray-600 font-medium mb-2">Credential Details</dt>
                          <dd className="text-sm text-gray-900">
                            {Object.entries(result.details).map(([key, value]) => (
                              <div key={key} className="flex justify-between py-1">
                                <span className="text-gray-600">{key}:</span>
                                <span className="font-semibold">{String(value)}</span>
                              </div>
                            ))}
                          </dd>
                        </div>
                      )}

                      {(result as any).reputationValue && (
                        <div className="mt-2 bg-purple-50 border border-purple-200 rounded p-3">
                          <p className="text-sm text-purple-800">
                            <strong>Reputation Value:</strong> +{(result as any).reputationValue} points
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {presentationType === 'bundle' && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">📊 Presentation Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{results.length}</div>
                    <div className="text-xs text-blue-700">Total Credentials</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.success).length}
                    </div>
                    <div className="text-xs text-green-700">Verified</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {results.filter(r => !r.success).length}
                    </div>
                    <div className="text-xs text-red-700">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {results.reduce((sum, r) => sum + ((r as any).reputationValue || 0), 0)}
                    </div>
                    <div className="text-xs text-purple-700">Total Reputation</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Verification Works</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">1️⃣</span>
              <p>
                <strong>Cryptographic Signatures:</strong> Each credential is signed using EIP-712 by the RacePass issuer wallet.
              </p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">2️⃣</span>
              <p>
                <strong>Tamper-Proof:</strong> Any modification to the credential data will cause signature verification to fail.
              </p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">3️⃣</span>
              <p>
                <strong>Privacy-Preserving:</strong> Users can share only specific credentials without revealing their entire history.
              </p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">4️⃣</span>
              <p>
                <strong>Presentation Bundles:</strong> Multiple credentials can be bundled together for high-value verifications.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-300">
            <p className="text-sm text-gray-600 mb-3">
              Want to issue your own verifiable credentials?
            </p>
            <Link
              href="/credentials"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              View Your Credentials →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

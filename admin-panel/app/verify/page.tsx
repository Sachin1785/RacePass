'use client';

import { useState } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  issuer?: string;
  recipient?: string;
  details?: any;
  eventName?: string;
  reputationValue?: number;
}

export default function AdminVerifyPage() {
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">🔍 Manual Verification</h1>
          <p className="mt-1 text-sm text-gray-600">Verify user credentials and presentation bundles manually</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex">
            <div className="shrink-0 text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Admin Verification Tool</h3>
              <p className="mt-1 text-sm text-blue-700">
                Use this tool to manually verify cryptographically signed identity proofs shared by users. 
                This is a staff-side version of the public verification portal.
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Paste JSON Payload</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste JSON here...'
            rows={10}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-xs p-4 border"
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
              {isVerifying ? 'Verifying...' : '🔍 Verify JSON'}
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Verification Results
              {presentationType === 'bundle' && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({results.length} credentials checked)
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
                        {result.eventName && (
                          <p className="text-sm text-gray-700 font-semibold">
                            Event: {result.eventName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message || result.error}
                  </p>

                  {result.success && (
                    <div className="border-t border-green-200 pt-4 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <dt className="text-xs text-green-600 font-medium uppercase">Issuer</dt>
                          <dd className="text-xs text-gray-900 font-mono break-all">{result.issuer}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-green-600 font-medium uppercase">Recipient</dt>
                          <dd className="text-xs text-gray-900 font-mono break-all">{result.recipient}</dd>
                        </div>
                      </div>

                      {result.details && (
                        <div className="mt-4 bg-white rounded p-3 text-xs border border-green-100">
                          <dt className="text-xs text-gray-500 font-medium mb-2 border-b border-gray-100 pb-1">Signed Attributes</dt>
                          <dd className="space-y-1">
                            {Object.entries(result.details).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-500">{key}:</span>
                                <span className="font-semibold text-gray-900">{String(value)}</span>
                              </div>
                            ))}
                          </dd>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

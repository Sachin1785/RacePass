'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  issuer?: string;
  recipient?: string;
  details?: Record<string, unknown>;
  eventName?: string;
  reputationValue?: number;
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);
const XIcon = ({ className = 'w-5 h-5 text-red-500' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Results Side Panel ─────────────────────────────────────────────────────────
function ResultsPanel({
  results,
  presentationType,
  onClose,
}: {
  results: VerificationResult[];
  presentationType: 'single' | 'bundle' | null;
  onClose: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const result = results[activeIdx];

  return (
    <>
      {/* Backdrop (only on mobile) */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 lg:hidden"
        onClick={onClose}
      />

      {/* Side panel */}
      <div className="fixed right-0 top-20 bottom-0 w-full max-w-md bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col animate-slide-in-right">

        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-black text-gray-900">Verification Results</h2>
            {presentationType === 'bundle' && (
              <p className="text-xs text-gray-400 mt-0.5">{results.length} credentials checked</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <XIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tab bar for bundle mode */}
        {presentationType === 'bundle' && results.length > 1 && (
          <div className="flex gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto shrink-0">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all ${activeIdx === i
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {r.success ? (
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                )}
                #{i + 1} {r.eventName ? r.eventName.slice(0, 12) + (r.eventName.length > 12 ? '…' : '') : ''}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable result content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Status banner */}
          <div className={`rounded-2xl border-2 p-5 flex items-center gap-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${result.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
              {result.success ? <CheckIcon /> : <XIcon />}
            </div>
            <div>
              <h3 className={`text-base font-black ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Verified Authentic' : 'Verification Failed'}
              </h3>
              {result.eventName && (
                <p className="text-sm font-semibold text-gray-600 mt-0.5">
                  {result.eventName}
                </p>
              )}
              <p className={`text-xs mt-1 leading-relaxed ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message || result.error}
              </p>
            </div>
          </div>

          {/* Details tiles */}
          {result.success && (
            <>
              {/* Issuer */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issuer</dt>
                <dd className="text-xs font-mono text-gray-800 break-all">{result.issuer}</dd>
              </div>

              {/* Recipient */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Recipient</dt>
                <dd className="text-xs font-mono text-gray-800 break-all">{result.recipient}</dd>
              </div>

              {/* Signed attributes */}
              {result.details && Object.keys(result.details).length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Signed Attributes
                  </dt>
                  <dd className="space-y-2">
                    {Object.entries(result.details).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{key}</span>
                        <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-0.5">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}

              {/* Reputation */}
              {result.reputationValue !== undefined && (
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
                      Reputation Value
                    </span>
                    <p className="text-xs text-yellow-700 mt-0.5">Awarded on check-in</p>
                  </div>
                  <span className="text-2xl font-black text-yellow-500">
                    +{result.reputationValue}
                    <span className="text-sm font-bold text-yellow-400 ml-0.5">pts</span>
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — overall summary for bundles */}
        {presentationType === 'bundle' && results.length > 1 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-bold text-gray-600">
                  {results.filter(r => r.success).length} passed
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-gray-600">
                  {results.filter(r => !r.success).length} failed
                </span>
              </div>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${results.every(r => r.success)
              ? 'bg-green-100 text-green-700'
              : results.some(r => r.success)
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
              }`}>
              {results.every(r => r.success) ? 'All Valid' : results.some(r => r.success) ? 'Partial' : 'All Failed'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 0.28s cubic-bezier(0.22,1,0.36,1); }
      `}</style>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminVerifyPage() {
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [presentationType, setPresentationType] = useState<'single' | 'bundle' | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleVerify = async () => {
    if (!input.trim()) { alert('Please paste a credential or presentation JSON'); return; }

    setIsVerifying(true);
    setResults([]);
    setPresentationType(null);
    setPanelOpen(false);

    try {
      const parsed = JSON.parse(input);

      if (parsed.version && parsed.credentials && Array.isArray(parsed.credentials)) {
        setPresentationType('bundle');
        const verificationResults: VerificationResult[] = [];

        for (const credential of parsed.credentials) {
          try {
            const res = await fetch(`${BACKEND_URL}/api/attest/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ attestation: credential.payload }),
            });
            const data = await res.json();
            verificationResults.push({ ...data, eventName: credential.eventName, reputationValue: credential.reputationValue });
          } catch {
            verificationResults.push({ success: false, error: `Failed to verify credential: ${credential.eventName}`, eventName: credential.eventName });
          }
        }

        setResults(verificationResults);
      } else {
        setPresentationType('single');
        const res = await fetch(`${BACKEND_URL}/api/attest/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attestation: parsed }),
        });
        const data = await res.json();
        setResults([data]);
      }

      setPanelOpen(true);
    } catch {
      setResults([{ success: false, error: 'Invalid JSON format. Please paste a valid credential or presentation.' }]);
      setPanelOpen(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResults([]);
    setPresentationType(null);
    setPanelOpen(false);
    setUploadedFileName('');
  };

  const loadFile = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { setInput((e.target?.result as string) || ''); };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Results panel (rendered above everything else) */}
      {panelOpen && results.length > 0 && (
        <ResultsPanel
          results={results}
          presentationType={presentationType}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-gray-100"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #f5c51820 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 hover:text-yellow-700 mb-4 transition-colors">
            ← Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3 block">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
              Manual Verification
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Verify Credentials</h1>
          <p className="mt-1 text-sm text-gray-500">
            Verify cryptographically signed identity proofs and presentation bundles.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── INFO BANNER ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex gap-4">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-yellow-900">Admin Verification Tool</h3>
            <p className="mt-0.5 text-sm text-yellow-800 leading-relaxed">
              Paste a single EAS attestation object or a multi-credential presentation bundle.
              Results will open in a side panel — no scrolling needed.
            </p>
          </div>
        </div>

        {/* ── INPUT ───────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-900">EAS Certificate Input</h2>
            {panelOpen && results.length > 0 && (
              <button
                onClick={() => setPanelOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700 hover:bg-yellow-400 hover:text-black transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10" />
                </svg>
                Show Results
              </button>
            )}
          </div>

          {/* Mode toggle tabs */}
          <div className="flex gap-2 mb-5 p-1 bg-gray-50 rounded-xl border border-gray-100">
            <button
              onClick={() => setInputMode('paste')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${inputMode === 'paste' ? 'bg-white shadow-sm text-yellow-700 border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              📋 Paste JSON
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${inputMode === 'upload' ? 'bg-white shadow-sm text-yellow-700 border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              📂 Upload .racepass
            </button>
          </div>

          {inputMode === 'paste' ? (
            <textarea
              id="credential-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'{ "version": "1.0", "credentials": [...] }  or paste a single attestation object…'}
              rows={12}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none font-mono text-xs p-4 transition-all duration-200 resize-none"
            />
          ) : (
            <>
              <input ref={fileInputRef} type="file" accept=".racepass,.json" onChange={handleFileChange} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all py-16 ${dragOver ? 'border-yellow-400 bg-yellow-50' : uploadedFileName ? 'border-yellow-300 bg-yellow-50/40' : 'border-gray-200 bg-gray-50/50 hover:border-yellow-300 hover:bg-yellow-50/20'}`}
              >
                {uploadedFileName ? (
                  <>
                    <div className="text-4xl">✅</div>
                    <p className="text-sm font-bold text-yellow-700">{uploadedFileName}</p>
                    <p className="text-xs text-gray-400">File loaded — click Verify JSON to audit</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl">📂</div>
                    <p className="text-sm font-semibold text-gray-500">Drop your <span className="text-yellow-600 font-bold">.racepass</span> file here</p>
                    <p className="text-xs text-gray-400">or click to browse — accepts .racepass and .json</p>
                  </>
                )}
              </div>
            </>
          )}

          <div className="mt-4 flex gap-3">
            <button
              id="verify-btn"
              onClick={handleVerify}
              disabled={isVerifying || !input.trim()}
              className={`flex-1 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 ${isVerifying || !input.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20 hover:-translate-y-0.5'
                }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Verifying…
                </span>
              ) : (
                'Verify JSON'
              )}
            </button>
            <button
              id="clear-btn"
              onClick={handleClear}
              className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-600 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── EMPTY STATE HINT ────────────────────────────────────────────────── */}
        {results.length === 0 && !isVerifying && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-400">Results will appear in a side panel</p>
            <p className="text-xs text-gray-300 mt-1">Paste a credential above and click Verify JSON</p>
          </div>
        )}
      </div>
    </div>
  );
}

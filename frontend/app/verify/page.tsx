'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';

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

export default function VerifyPage() {
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [presentationType, setPresentationType] = useState<'single' | 'bundle' | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useRacePassProfile();

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

  const handleVerify = async () => {
    if (!input.trim()) { alert('Please paste a credential or presentation JSON'); return; }
    setIsVerifying(true); setResults([]); setPresentationType(null);

    try {
      const parsed = JSON.parse(input);
      if (parsed.version && parsed.credentials && Array.isArray(parsed.credentials)) {
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
            verificationResults.push({ ...data, eventName: credential.eventName, reputationValue: credential.reputationValue });
          } catch {
            verificationResults.push({ success: false, error: `Failed to verify: ${credential.eventName}`, eventName: credential.eventName });
          }
        }
        setResults(verificationResults);
      } else {
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
      setResults([{ success: false, error: 'Invalid JSON format. Check your input.' }]);
    } finally { setIsVerifying(false); }
  };

  const handleClear = () => { setInput(''); setResults([]); setPresentationType(null); setUploadedFileName(''); };

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
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <main className="relative overflow-hidden bg-white min-h-[calc(100vh-64px)] pb-20">
        {/* Grid Background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #f5c51833 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div {...fadeUp(0)} className="mb-10">
            <motion.div {...fadeIn(0.1)} className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Trust Audit Protocol</span>
            </motion.div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Identity <span className="text-yellow-500 underline decoration-yellow-400/40 underline-offset-4">Audit</span></h1>
            <p className="mt-4 text-gray-500 font-medium max-w-xl">Paste a RacePass verifiable credential or bundle presentation to audit its authenticity on-chain.</p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="bg-white/70 backdrop-blur-xl rounded-[3rem] p-10 border border-yellow-100 shadow-2xl shadow-yellow-900/5 transition-all duration-300">
            {/* Mode toggle tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-yellow-50 rounded-2xl border border-yellow-100">
              <button
                onClick={() => setInputMode('paste')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inputMode === 'paste' ? 'bg-white shadow-sm text-yellow-700 border border-yellow-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                📋 Paste JSON
              </button>
              <button
                onClick={() => setInputMode('upload')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${inputMode === 'upload' ? 'bg-white shadow-sm text-yellow-700 border border-yellow-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                📂 Upload .racepass
              </button>
            </div>

            <div className="mb-8">
              {inputMode === 'paste' ? (
                <>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Payload Entry</label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='{"version": "1.0", ...}'
                    className="w-full h-48 rounded-3xl border-yellow-100 bg-yellow-50/30 p-6 font-mono text-xs focus:ring-yellow-500 focus:border-yellow-500 shadow-inner outline-none transition-all"
                  />
                </>
              ) : (
                <>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Upload .racepass File</label>
                  <input ref={fileInputRef} type="file" accept=".racepass,.json" onChange={handleFileChange} className="hidden" />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`w-full h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${dragOver ? 'border-yellow-400 bg-yellow-50' : uploadedFileName ? 'border-yellow-300 bg-yellow-50/40' : 'border-yellow-100 bg-yellow-50/20 hover:border-yellow-300 hover:bg-yellow-50/40'}`}
                  >
                    {uploadedFileName ? (
                      <>
                        <div className="text-3xl">✅</div>
                        <p className="text-sm font-black text-yellow-700">{uploadedFileName}</p>
                        <p className="text-xs text-gray-400">File loaded — click Verify to audit</p>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl">📂</div>
                        <p className="text-sm font-bold text-gray-500">Drop your <span className="text-yellow-600 font-black">.racepass</span> file here</p>
                        <p className="text-xs text-gray-400">or click to browse</p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleVerify}
                disabled={isVerifying || !input.trim()}
                className={`flex-1 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isVerifying || !input.trim() ? "bg-gray-100 text-gray-400" : "bg-yellow-400 text-black shadow-xl shadow-yellow-400/20 hover:bg-yellow-300 hover:scale-[1.02]"}`}
              >
                {isVerifying ? "Auditing Profile..." : "Start Verification Audit"}
              </button>
              {input && (
                <button onClick={handleClear} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-full font-black text-xs uppercase hover:bg-gray-100 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </motion.div>


          {/* Results Section */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-yellow-100 flex-1" />
                  <h2 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest px-4 py-1.5 border border-yellow-50 rounded-full bg-white shadow-sm">Audit Findings</h2>
                  <div className="h-px bg-yellow-100 flex-1" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {results.map((res, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className={`rounded-3xl border p-6 flex items-center justify-between transition-all ${res.success ? "bg-green-50/50 border-green-200 ring-4 ring-green-600/5 shadow-md shadow-green-900/5" : "bg-red-50/50 border-red-200 ring-4 ring-red-600/5 shadow-md shadow-red-900/5"
                        }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${res.success ? "bg-green-100 text-green-600 shadow-inner" : "bg-red-100 text-red-600 shadow-inner"}`}>
                          {res.success ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-gray-900 leading-tight">{res.eventName || (res.success ? "Authentic Credential" : "Invalid Payload")}</h4>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{res.success ? "On-Chain Sig Verified" : "Failed Signature Validation"}</p>
                        </div>
                      </div>
                      {res.reputationValue && (
                        <div className="text-right">
                          <p className="text-xl font-black text-green-600">+{res.reputationValue} REP</p>
                          <p className="text-[10px] font-bold text-gray-300 uppercase">Trust Impact</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 p-10 bg-gray-900 rounded-[3rem] text-left text-white relative overflow-hidden group">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 relative z-10">Audit Cryptographic Proofs</h4>
                  <p className="text-xs text-gray-400 max-w-sm font-medium relative z-10">The RacePass audit engine validates off-chain attestations against the EAS deployment on-chain.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
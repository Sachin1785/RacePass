'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export function KycForm() {
  const router = useRouter();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingKyc, setIsCheckingKyc] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  // Check if user is already KYC verified before loading SDK
  useEffect(() => {
    const checkKycStatus = async () => {
      if (!address) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/kyc/status/${address.toLowerCase()}`);
        const result = await response.json();
        
        if (result.success && result.isVerified) {
          // Already verified, redirect to dashboard or success with a flag
          router.push('/dashboard');
        }
      } catch (err) {
        console.warn('KYC status check failed, proceeding with normal flow:', err);
      } finally {
        setIsCheckingKyc(false);
      }
    };

    checkKycStatus();
  }, [address, router]);

  // Load Didit SDK dynamically
  useEffect(() => {
    if (isCheckingKyc) return; // Don't load until we mark check as done
    
    const loadSdk = async () => {
      try {
        await import('@didit-protocol/sdk-web');
        setIsSdkLoaded(true);
      } catch (err) {
        console.error('Failed to load Didit SDK:', err);
        setError('Failed to load verification SDK');
      }
    };
    loadSdk();
  }, [isCheckingKyc]);

  const startVerification = async () => {
    if (!isSdkLoaded) {
      setError('Verification SDK not loaded yet. Please try again.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Import DiditSdk dynamically at usage time
      const { DiditSdk } = await import('@didit-protocol/sdk-web');

      // Create a verification session with backend
      const response = await fetch('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: address,
          // Don't pass callback_url for localhost - Didit can't reach it
          // In production, this should be your deployed webhook URL
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create verification session');
      }

      console.log('Session created:', {
        session_id: result.session_id,
        verification_url: result.verification_url,
        has_url: !!result.verification_url
      });

      if (!result.verification_url) {
        throw new Error('No verification URL received from server');
      }

      // Initialize Didit SDK with callbacks
      DiditSdk.shared.onComplete = (completionResult) => {
        console.log('Verification completed:', completionResult);
        
        switch (completionResult.type) {
          case 'completed':
            // Store session info and redirect to success page
            localStorage.setItem('kyc_session', JSON.stringify({
              sessionId: completionResult.session?.sessionId || result.session_id,
              status: completionResult.session?.status || 'Pending',
              completedAt: new Date().toISOString(),
            }));
            router.push('/kyc/success');
            break;
          
          case 'cancelled':
            setError('Verification was cancelled. Please try again.');
            setIsLoading(false);
            break;
          
          case 'failed':
            setError(completionResult.error?.message || 'Verification failed');
            setIsLoading(false);
            break;
        }
      };

      DiditSdk.shared.onStateChange = (state, errorMsg) => {
        console.log('SDK State changed:', state, errorMsg);
        if (state === 'error' && errorMsg) {
          setError(errorMsg);
          setIsLoading(false);
        }
      };

      DiditSdk.shared.onEvent = (event) => {
        console.log('SDK Event:', event.type, event.data);
      };

      console.log('Starting verification with URL:', result.verification_url);

      // Start verification with the URL from backend
      DiditSdk.shared.startVerification({
        url: result.verification_url,
        configuration: {
          loggingEnabled: true,
          showCloseButton: true,
          showExitConfirmation: true,
          closeModalOnComplete: false,
        }
      });

    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setIsLoading(false);
    }
  };

  if (isCheckingKyc) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-gray-500 text-sm font-medium">Checking KYC status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Information Panel */}
      <div className="rounded-xl bg-amber-50 p-6 border border-amber-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <svg className="w-16 h-16 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        <div className="flex relative z-10">
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-base font-black text-gray-900 leading-none mb-2">Powered by Didit Identity</h3>
            <div className="text-sm text-gray-600 leading-relaxed font-medium">
              <p>
                Secure your digital racing identity. You&apos;ll be guided through a quick 
                document capture and face verification process. 
                Everything is encrypted and privacy-protected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-100 animate-shake">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Start Verification Button */}
      <div className="flex justify-center flex-col items-center gap-4">
        <button
          onClick={startVerification}
          disabled={isLoading || !isSdkLoaded}
          className="group relative w-full max-w-md flex items-center justify-center rounded-xl bg-amber-500 px-8 py-4 text-lg font-black text-white shadow-xl shadow-amber-200/50 hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-1 active:translate-y-0 overflow-hidden"
        >
          {/* Button Shine effect */}
          <div className="absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000" />
          
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Verification...
            </>
          ) : (
            <>
              <span className="mr-3 text-xl">🛡️</span>
              Start Verification
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          256-bit Secure Encryption
        </p>
      </div>

      {/* Steps/Requirements visual clue */}
      <div className="pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2">
          {["Identify", "Verify", "Access"].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-1 opacity-50 group">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                {i + 1}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

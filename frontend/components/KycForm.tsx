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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 text-sm">Checking KYC status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Information Panel */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <div className="flex">
          <div className="shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Didit Identity Verification</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Click the button below to start your identity verification process. 
                You&apos;ll be guided through document capture and face verification. 
                The process typically takes 2-5 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Start Verification Button */}
      <div className="flex justify-center">
        <button
          onClick={startVerification}
          disabled={isLoading || !isSdkLoaded}
          className="w-full max-w-md flex justify-center rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Verification...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Identity Verification
            </>
          )}
        </button>
      </div>

      {/* Requirements List */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">What You&apos;ll Need</h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5"
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
            <span>A valid government-issued ID (passport, driver&apos;s license, or national ID)</span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5"
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
            <span>A device with a camera (for selfie verification)</span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5"
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
            <span>5-10 minutes of your time</span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5"
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
            <span>Good lighting and a stable internet connection</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

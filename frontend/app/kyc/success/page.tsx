'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

interface KycSession {
  sessionId: string;
  status: string;
  completedAt: string;
}

export default function KycSuccessPage() {
  const router = useRouter();
  const [session, setSession] = useState<KycSession | null>(null);

  useEffect(() => {
    // Retrieve session from localStorage
    const loadSession = () => {
      const storedSession = localStorage.getItem('kyc_session');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          setSession(parsed);
        } catch (error) {
          console.error('Error parsing session:', error);
          router.push('/kyc');
        }
      } else {
        // No session found, redirect to KYC page
        router.push('/kyc');
      }
    };

    loadSession();
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'in review':
        return 'text-yellow-600 bg-yellow-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-10 w-10 text-green-600"
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
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Verification Submitted!
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Your identity verification has been submitted successfully.
          </p>
        </div>

        {/* Session Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Verification Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <p className="text-sm text-gray-500">Session ID</p>
                <p className="text-base font-mono text-gray-900 mt-1">
                  {session.sessionId}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <p className="text-sm text-gray-500">Submitted At</p>
                <p className="text-base text-gray-900 mt-1">
                  {new Date(session.completedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-6 w-6 text-blue-400"
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
              <h3 className="text-sm font-medium text-blue-800">What&apos;s Next?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Your verification is being processed. You&apos;ll receive updates on the status:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Approved</strong> - You can now access age-restricted events</li>
                  <li><strong>In Review</strong> - Our team is reviewing your submission</li>
                  <li><strong>Declined</strong> - Please contact support for assistance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex justify-center items-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/events"
            className="inline-flex justify-center items-center rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </main>
    </div>
  );
}

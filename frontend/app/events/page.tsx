'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

// Mock event data - in production, this would come from a backend/smart contract
const mockEvents = [
  {
    id: 1,
    name: 'Formula E Championship 2026',
    date: '2026-03-15',
    location: 'Mumbai, India',
    description: 'Experience the future of racing with electric vehicles',
    price: '₹5,000',
    image: '🏎️',
    requiresKyc: true,
    minAge: 18,
  },
  {
    id: 2,
    name: 'Tech Conference 2026',
    date: '2026-04-22',
    location: 'Bangalore, India',
    description: 'Join industry leaders in blockchain and AI innovation',
    price: '₹2,500',
    image: '💻',
    requiresKyc: true,
    minAge: 16,
  },
  {
    id: 3,
    name: 'Music Festival Summer',
    date: '2026-06-10',
    location: 'Goa, India',
    description: 'A weekend of electronic music and beach vibes',
    price: '₹8,000',
    image: '🎵',
    requiresKyc: true,
    minAge: 21,
  },
  {
    id: 4,
    name: 'Crypto Summit 2026',
    date: '2026-05-05',
    location: 'Dubai, UAE',
    description: 'Explore the future of decentralized finance',
    price: '$500',
    image: '₿',
    requiresKyc: true,
    minAge: 18,
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Upcoming Events</h1>
          <p className="mt-2 text-lg text-gray-600">
            Discover and access exclusive events using your verified credentials
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
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
              <h3 className="text-sm font-medium text-blue-800">KYC Required</h3>
              <p className="mt-1 text-sm text-blue-700">
                All events require verified credentials. Complete KYC once to access all age-restricted
                events without repeating the verification process.
              </p>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-6xl">
                {event.image}
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {event.minAge}+
                  </span>
                  {event.requiresKyc && (
                    <span className="inline-flex items-center text-xs text-gray-500">
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      KYC Required
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {event.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {event.location}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">
                    {event.price}
                  </span>
                  <button
                    disabled
                    className="rounded-full bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Access Events?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Complete your KYC verification to unlock access to age-restricted events.
            Verify once, use everywhere—no more repetitive identity checks.
          </p>
          <Link
            href="/kyc"
            className="inline-flex items-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Complete KYC Verification
          </Link>
        </div>
      </main>
    </div>
  );
}

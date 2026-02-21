'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  price: string;
  image: string;
  requiresKyc: boolean;
  minAge: number;
  minReputation: number;
  ticketsMinted: number;
  ticketsCheckedIn: number;
  maxTickets: number;
  isActive: boolean;
}

export default function EventsPage() {
  const { address, isConnected } = useAccount();
  const { data: profile } = useRacePassProfile();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mintingEventId, setMintingEventId] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/events`);
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const canAccessEvent = (event: Event) => {
    if (!profile?.identity) return false;
    if (!profile.identity.isKycVerified && event.requiresKyc) return false;
    if (profile.identity.isRevoked) return false;
    
    const activeRep = parseInt(profile.identity.activeReputation);
    if (activeRep < event.minReputation) return false;
    
    return true;
  };

  const handleMintTicket = async (event: Event) => {
    if (!address || !canAccessEvent(event)) return;
    
    setMintingEventId(event.id);
    try {
      const response = await fetch(`${BACKEND_URL}/api/tickets/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: address,
          eventId: event.id,
          eventName: event.name,
          requireAge18: event.minAge >= 18,
          minReputation: event.minReputation,
          maxResalePrice: '0.1'
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Ticket minted successfully! Token ID: ${result.onChainId}`);
        // Refresh events to update ticket count
        const eventsResponse = await fetch(`${BACKEND_URL}/api/events`);
        const eventsData = await eventsResponse.json();
        if (eventsData.success) {
          setEvents(eventsData.events);
        }
      } else {
        alert(`Failed to mint ticket: ${result.error}`);
      }
    } catch (error) {
      console.error('Minting error:', error);
      alert('Failed to mint ticket');
    } finally {
      setMintingEventId(null);
    }
  };
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading events...</div>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const isSoldOut = event.ticketsMinted >= event.maxTickets;
              const canAccess = canAccessEvent(event);
              const activeRep = profile?.identity ? parseInt(profile.identity.activeReputation) : 0;
              const needsMoreRep = activeRep < event.minReputation;
              const isMinting = mintingEventId === event.id;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-6xl">
                    {event.image}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {event.minAge}+
                        </span>
                        {event.minReputation > 0 && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                            Rep {event.minReputation}+
                          </span>
                        )}
                      </div>
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

                      {/* Ticket Availability */}
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
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                          />
                        </svg>
                        {event.ticketsMinted}/{event.maxTickets} tickets minted
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">
                        {event.price}
                      </span>
                      
                      {!isConnected ? (
                        <button
                          disabled
                          className="rounded-full bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                        >
                          Connect Wallet
                        </button>
                      ) : !profile?.identity ? (
                        <Link
                          href="/kyc"
                          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                          Complete KYC
                        </Link>
                      ) : isSoldOut ? (
                        <button
                          disabled
                          className="rounded-full bg-red-300 px-4 py-2 text-sm font-semibold text-red-800 cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      ) : needsMoreRep ? (
                        <button
                          disabled
                          className="rounded-full bg-purple-300 px-4 py-2 text-sm font-semibold text-purple-800 cursor-not-allowed"
                          title={`Need ${event.minReputation} reputation (you have ${activeRep})`}
                        >
                          Need Rep {event.minReputation}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMintTicket(event)}
                          disabled={!canAccess || isMinting}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            canAccess && !isMinting
                              ? 'bg-green-600 text-white hover:bg-green-500'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isMinting ? 'Minting...' : 'Mint Ticket'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No events available at the moment.</p>
          </div>
        )}

        {/* CTA Section */}
        {isConnected && !profile?.identity && (
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
        )}

        {/* Reputation Info */}
        {isConnected && profile?.identity && (
          <div className="mt-12 text-center bg-purple-50 rounded-xl border border-purple-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Reputation: {profile.identity.activeReputation}
            </h2>
            <p className="text-gray-600 mb-2 max-w-2xl mx-auto">
              Earn reputation by attending events and participating in the RacePass ecosystem.
              Higher reputation unlocks exclusive premium events.
            </p>
            <p className="text-sm text-gray-500">
              Base Reputation: {profile.identity.baseReputation} | Active Reputation: {profile.identity.activeReputation}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

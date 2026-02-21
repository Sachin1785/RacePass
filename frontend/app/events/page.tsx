'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';
import { motion, AnimatePresence } from 'framer-motion';

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
    const activeRep = parseInt(profile.identity.activeReputation || '0');
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
        const eventsResponse = await fetch(`${BACKEND_URL}/api/events`);
        const eventsData = await eventsResponse.json();
        if (eventsData.success) { setEvents(eventsData.events); }
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
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      
      <main className="relative overflow-hidden bg-linear-to-b from-amber-50 via-white to-white min-h-[calc(100vh-64px)] pb-20">
        {/* Subtle grid bg */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #f59e0b22 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-175 h-100 rounded-full bg-amber-200/30 blur-3xl opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <motion.div {...fadeUp(0)} className="text-center mb-16">
            <motion.div {...fadeIn(0.1)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                RacePass Ecosystem
              </span>
            </motion.div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
              Upcoming <span className="text-amber-500 underline decoration-amber-200 underline-offset-8">Experiences</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-500 font-medium">
              Discover high-stakes events protected by on-chain identity. One verified profile, infinite access.
            </p>
          </motion.div>

          {/* Verification Status (Toast-like) */}
          <AnimatePresence>
            {!profile?.identity && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12 bg-linear-to-r from-amber-500 to-orange-600 rounded-[2rem] p-6 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🛡️</div>
                    <div>
                        <h4 className="font-black text-lg">Limited Access Mode</h4>
                        <p className="text-amber-100 text-sm font-medium">Connect and verify your KYC to unlock all events.</p>
                    </div>
                 </div>
                 <Link href="/kyc" className="bg-white text-orange-600 font-black px-8 py-3 rounded-full text-sm hover:scale-105 transition-transform relative z-10">
                    Verify Now →
                 </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing Global Events...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, idx) => {
                const isSoldOut = event.ticketsMinted >= event.maxTickets;
                const canAccess = canAccessEvent(event);
                const activeRep = profile?.identity ? parseInt(profile.identity.activeReputation || '0') : 0;
                const needsMoreRep = activeRep < event.minReputation;
                const isMinting = mintingEventId === event.id;

                return (
                  <motion.div
                    key={event.id}
                    {...fadeUp(0.1 + idx * 0.05)}
                    className="group relative flex flex-col bg-white rounded-[2.5rem] border border-amber-100 overflow-hidden hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500"
                  >
                    {/* Visual Header */}
                    <div className="relative h-56 bg-linear-to-br from-amber-100 to-orange-50 flex items-center justify-center overflow-hidden">
                       <div className="absolute inset-0 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none" 
                            style={{ backgroundImage: 'radial-gradient(circle at center, #f59e0b 2px, transparent 0)', backgroundSize: '16px 16px' }} />
                       <span className="text-7xl group-hover:scale-110 transition-transform duration-500 z-10">{event.image}</span>
                       
                       {/* Overlay Status */}
                       <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                          <div className="flex flex-col gap-2">
                             <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-white text-[10px] font-black text-gray-900 uppercase">
                                {event.minAge}+ Verified
                             </div>
                             {event.minReputation > 0 && (
                               <div className="px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black text-white uppercase shadow-lg shadow-amber-500/20">
                                 Rep {event.minReputation}+
                               </div>
                             )}
                          </div>
                          {event.requiresKyc && (
                             <div className="w-8 h-8 bg-white/80 backdrop-blur-md rounded-full border border-white flex items-center justify-center text-amber-600 shadow-sm" title="KYC Required">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                             </div>
                          )}
                       </div>

                       {isSoldOut && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                             <span className="text-white text-2xl font-black tracking-widest uppercase rotate-[-12deg] border-4 border-white px-4 py-1">Sold Out</span>
                          </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-8 flex flex-col flex-1">
                       <div className="mb-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 opacity-80">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="3" />
                             </svg>
                             {event.location}
                          </div>
                          <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-amber-500 transition-colors">{event.name}</h3>
                       </div>

                       <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2 leading-relaxed">
                          {event.description}
                       </p>

                       <div className="mt-auto space-y-6">
                            {/* Availability Bar */}
                            <div className="space-y-2 text-xs font-bold uppercase tracking-tighter">
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-400">Tickets Available</span>
                                    <span className="text-gray-900">{Math.max(0, event.maxTickets - event.ticketsMinted)} Left</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(event.ticketsMinted / event.maxTickets) * 100}%` }}
                                        className="h-full bg-linear-to-r from-amber-400 to-orange-500 rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-gray-300 uppercase">Mint Price</p>
                                    <p className="text-xl font-black text-gray-900 tracking-tighter">{event.price}</p>
                                </div>

                                {!isConnected ? (
                                    <button disabled className="bg-gray-100 text-gray-400 px-6 py-3 rounded-2xl text-xs font-black uppercase pointer-events-none">
                                        Locked
                                    </button>
                                ) : !profile?.identity ? (
                                    <Link href="/kyc" className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl text-xs font-black uppercase hover:bg-amber-200 transition-colors">
                                        Verify
                                    </Link>
                                ) : isSoldOut ? (
                                    <button disabled className="bg-red-50 text-red-400 px-6 py-3 rounded-2xl text-xs font-black uppercase">
                                        Full
                                    </button>
                                ) : needsMoreRep ? (
                                    <button disabled className="bg-purple-50 text-purple-400 px-6 py-3 rounded-2xl text-xs font-black uppercase text-center leading-tight">
                                        Need<br/>{event.minReputation} REP
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleMintTicket(event)}
                                        disabled={!canAccess || isMinting}
                                        className={`px-8 py-3 rounded-2xl text-xs font-black uppercase shadow-lg transition-all ${
                                            canAccess && !isMinting
                                            ? 'bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/20 hover:scale-[1.05] active:scale-95'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isMinting ? 'Minting...' : 'Access Now'}
                                    </button>
                                )}
                            </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && events.length === 0 && (
            <motion.div {...fadeIn(0.2)} className="text-center py-32 bg-amber-50/50 rounded-[3rem] border border-dashed border-amber-200">
              <div className="text-6xl mb-6 opacity-30">🏁</div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No Active Seasons</h3>
              <p className="text-gray-500 font-medium">The racing season is currently cooling down. Check back shortly.</p>
            </motion.div>
          )}

          {/* Footer Stats */}
          {isConnected && profile?.identity && (
                <motion.div {...fadeUp(0.3)} className="mt-20 flex flex-col items-center">
                    <div className="w-full max-w-2xl bg-white/50 backdrop-blur-xl border border-amber-100 rounded-[2.5rem] p-8 text-center relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Your Trust Profile</h4>
                        <div className="flex justify-center gap-12">
                            <div>
                                <p className="text-3xl font-black text-gray-900">{profile.identity.activeReputation}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Live Reputation</p>
                            </div>
                            <div className="w-px h-12 bg-amber-100" />
                            <div>
                                <p className="text-3xl font-black text-gray-900">{profile.identity.baseReputation}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Base Score</p>
                            </div>
                        </div>
                        <p className="mt-6 text-xs text-gray-400 font-medium max-w-sm mx-auto">
                            Higher reputation unlocks access to restricted high-limit events. Keep racing clean to maintain your score.
                        </p>
                    </div>
                </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

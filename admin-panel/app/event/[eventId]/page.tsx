'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  createdAt: string;
}

interface Attendee {
  owner_address: string;
  minted_at: string;
}

interface Stats {
  totalMinted: number;
  totalCheckedIn: number;
  attendanceRate: string;
}

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (eventId) fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
        setAttendees(data.attendees);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch event details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin mb-3" />
          <p className="text-sm text-gray-400">Loading event details…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎟️</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-sm text-gray-400 mb-6">This event doesn't exist or has been removed.</p>
          <Link
            href="/"
            className="rounded-xl bg-yellow-400 hover:bg-yellow-300 px-6 py-2.5 text-sm font-bold text-black transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const fillPct = Math.min(100, (event.ticketsMinted / event.maxTickets) * 100);
  const checkinPct = event.ticketsMinted > 0
    ? Math.min(100, (event.ticketsCheckedIn / event.ticketsMinted) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-gray-100"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #f5c51820 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 hover:text-yellow-700 mb-4 transition-colors"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{event.image}</div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${event.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
                    {event.isActive ? 'Active Event' : 'Inactive Event'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-gray-900">{event.name}</h1>
                <p className="mt-0.5 text-sm text-gray-500">{event.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* ── EVENT INFO CARD ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
            <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-4">
              Event Details
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-400 font-medium mb-0.5">Date</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 font-medium mb-0.5">Description</dt>
                <dd className="text-sm text-gray-700 leading-relaxed">{event.description || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 font-medium mb-0.5">Ticket Price</dt>
                <dd className="text-sm font-bold text-gray-900">{event.price}</dd>
              </div>
            </dl>
          </div>

          {/* Requirements */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-300 transition-colors duration-200">
            <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-4">
              Access Requirements
            </h3>
            <div className="space-y-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${event.requiresKyc
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
              >
                {event.requiresKyc ? '✓' : '✗'} KYC {event.requiresKyc ? 'Required' : 'Not Required'}
              </span>
              <br />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                🎂 {event.minAge}+ Age Requirement
              </span>
              {event.minReputation > 0 && (
                <>
                  <br />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
                    ⭐ {event.minReputation}+ Reputation Required
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Tickets Sold */}
          <div className="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 hover:-translate-y-1">
            <div className="text-sm font-medium text-gray-500 mb-1">Tickets Sold</div>
            <div className="text-3xl font-black text-yellow-500 mb-1">
              {event.ticketsMinted}
              <span className="text-base font-semibold text-gray-400"> / {event.maxTickets}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">{fillPct.toFixed(0)}% capacity filled</div>
            <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>

          {/* Check-Ins */}
          <div className="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 hover:-translate-y-1">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Check-Ins</div>
            <div className="text-3xl font-black text-yellow-500 mb-1">{event.ticketsCheckedIn}</div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${checkinPct}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {stats ? `${stats.attendanceRate}% attendance rate` : '—'}
            </div>
            <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>

          {/* Remaining */}
          <div className="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 hover:-translate-y-1">
            <div className="text-sm font-medium text-gray-500 mb-1">Remaining</div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {event.maxTickets - event.ticketsMinted}
            </div>
            <div className="text-xs text-gray-400 mt-4">tickets still available</div>
            {event.ticketsMinted >= event.maxTickets && (
              <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                Sold Out
              </span>
            )}
            <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
          </div>
        </div>

        {/* ── ATTENDEES TABLE ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900">Ticket Holders</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-3 py-1">
              {attendees.length} holders
            </span>
          </div>

          {attendees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-4 text-2xl">
                👤
              </div>
              <p className="text-sm font-semibold text-gray-600">No tickets minted yet</p>
              <p className="text-xs text-gray-400 mt-1">Attendees will appear here once tickets are sold.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Wallet Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Minted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Explorer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendees.map((attendee, idx) => (
                    <tr
                      key={`${attendee.owner_address}-${idx}`}
                      className="hover:bg-yellow-50/40 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
                          {attendee.owner_address.slice(0, 6)}…{attendee.owner_address.slice(-4)}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attendee.minted_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={`https://testnet.monadscan.com/address/${attendee.owner_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:border-yellow-400 hover:bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all duration-200"
                        >
                          View on Explorer →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

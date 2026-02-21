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
    if (eventId) {
      fetchEventDetails();
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-5xl mr-4">{event.image}</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <p className="mt-1 text-sm text-gray-600">{event.location}</p>
              </div>
            </div>
            <Link
              href={`/scanner?eventId=${event.id}&eventName=${encodeURIComponent(event.name)}`}
              className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500"
            >
              📱 Open Gate Scanner
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Event Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Event Details</h3>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Date</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Description</dt>
                  <dd className="text-sm font-medium text-gray-900">{event.description}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Price</dt>
                  <dd className="text-sm font-medium text-gray-900">{event.price}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Requirements</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    event.requiresKyc ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.requiresKyc ? '✓ KYC Required' : 'No KYC Required'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {event.minAge}+ Age Requirement
                  </span>
                </div>
                {event.minReputation > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {event.minReputation}+ Reputation Required
                    </span>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Tickets Sold</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {event.ticketsMinted} / {event.maxTickets}
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(event.ticketsMinted / event.maxTickets) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Check-Ins</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{event.ticketsCheckedIn}</div>
            <div className="mt-2 text-sm text-gray-500">
              {stats && `${stats.attendanceRate}% attendance rate`}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Remaining</div>
            <div className="mt-2 text-3xl font-bold text-purple-600">
              {event.maxTickets - event.ticketsMinted}
            </div>
            <div className="mt-2 text-sm text-gray-500">tickets available</div>
          </div>
        </div>

        {/* Attendees List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ticket Holders ({attendees.length})
            </h2>
          </div>
          {attendees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tickets minted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wallet Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Minted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendees.map((attendee) => (
                    <tr key={attendee.owner_address}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {attendee.owner_address.slice(0, 6)}...{attendee.owner_address.slice(-4)}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attendee.minted_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={`https://testnet.monadscan.com/address/${attendee.owner_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
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
      </main>
    </div>
  );
}

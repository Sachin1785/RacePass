'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsMinted: 0,
    totalCheckedIn: 0,
    avgAttendanceRate: 0
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
        
        // Calculate aggregate stats
        const totalMinted = data.events.reduce((sum: number, e: Event) => sum + e.ticketsMinted, 0);
        const totalChecked = data.events.reduce((sum: number, e: Event) => sum + e.ticketsCheckedIn, 0);
        const avgRate = totalMinted > 0 ? ((totalChecked / totalMinted) * 100).toFixed(1) : 0;
        
        setStats({
          totalEvents: data.events.length,
          totalTicketsMinted: totalMinted,
          totalCheckedIn: totalChecked,
          avgAttendanceRate: Number(avgRate)
        });
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏎️ RacePass Admin</h1>
              <p className="mt-1 text-sm text-gray-600">Event management & monitoring dashboard</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/verify"
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
              >
                🔍 Verify
              </Link>
              <Link
                href="/users"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
              >
                👥 Users
              </Link>
              <Link
                href="/scanner"
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
              >
                📱 Gate Scanner
              </Link>
              <Link
                href="/create-event"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                ➕ Create Event
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Events</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalEvents}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Tickets Minted</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{stats.totalTicketsMinted}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Check-Ins</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.totalCheckedIn}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Avg Attendance</div>
            <div className="mt-2 text-3xl font-bold text-purple-600">{stats.avgAttendanceRate}%</div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Events</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No events found. Create your first event to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-Ins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => {
                    const attendanceRate = event.ticketsMinted > 0 
                      ? ((event.ticketsCheckedIn / event.ticketsMinted) * 100).toFixed(0)
                      : 0;
                    const isSoldOut = event.ticketsMinted >= event.maxTickets;

                    return (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{event.image}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{event.name}</div>
                              <div className="text-sm text-gray-500">{event.price}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {event.ticketsMinted} / {event.maxTickets}
                          </div>
                          {isSoldOut && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Sold Out
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.ticketsCheckedIn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 mr-2">{attendanceRate}%</div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${attendanceRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/event/${event.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

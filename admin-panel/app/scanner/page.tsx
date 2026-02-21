'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface CheckInResult {
  success: boolean;
  message?: string;
  tokenId?: string;
  attestationUid?: string;
  txHash?: string;
  error?: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  isActive: boolean;
}

export default function GateScannerPage() {
  const searchParams = useSearchParams();
  const prefilledEventName = searchParams.get('eventName') || '';
  const prefilledEventId = searchParams.get('eventId') || '';
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventName, setEventName] = useState(prefilledEventName);
  const [walletAddress, setWalletAddress] = useState('');
  const [reputationValue, setReputationValue] = useState('50');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<Array<{
    address: string;
    time: string;
    success: boolean;
    message: string;
  }>>([]);

  // Fetch events list on mount
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
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventName.trim() || !walletAddress.trim()) {
      setResult({
        success: false,
        error: 'Please provide both event name and wallet address'
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/tickets/check-in-by-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress.trim(),
          eventName: eventName.trim(),
          reputationValue: parseInt(reputationValue) || 50
        })
      });

      const data = await response.json();
      setResult(data);

      // Add to history
      setCheckInHistory(prev => [{
        address: walletAddress,
        time: new Date().toLocaleTimeString(),
        success: data.success,
        message: data.message || data.error || 'Unknown'
      }, ...prev.slice(0, 9)]); // Keep last 10

      // Clear input on success
      if (data.success) {
        setWalletAddress('');
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error. Please check if the backend is running.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📱 Gate Scanner</h1>
              <p className="mt-1 text-sm text-gray-600">Scan attendee QR codes to check them in</p>
            </div>
            {prefilledEventId && (
              <Link
                href={`/event/${prefilledEventId}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View Event Details →
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Form */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Check-In Form</h2>
              
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                    Event Name
                  </label>
                  {isLoadingEvents ? (
                    <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border bg-gray-50 text-gray-500">
                      Loading events...
                    </div>
                  ) : (
                    <select
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                      required
                    >
                      <option value="">Select an event...</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.name}>
                          {event.name} - {new Date(event.date).toLocaleDateString()} ({event.location})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Select the event for check-in
                  </p>
                </div>

                <div>
                  <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
                    Wallet Address (from QR Code)
                  </label>
                  <input
                    type="text"
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border font-mono text-sm"
                    placeholder="0x..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    QR code should contain the attendee wallet address
                  </p>
                </div>

                <div>
                  <label htmlFor="reputationValue" className="block text-sm font-medium text-gray-700">
                    Reputation Reward
                  </label>
                  <input
                    type="number"
                    id="reputationValue"
                    value={reputationValue}
                    onChange={(e) => setReputationValue(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    min="10"
                    max="500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Points awarded for attending this event
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {isProcessing ? 'Processing Check-In...' : '✓ Check In Attendee'}
                </button>
              </form>

              {/* Result Display */}
              {result && (
                <div className={`mt-6 rounded-lg p-4 ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? '✅ Check-In Successful!' : '❌ Check-In Failed'}
                  </div>
                  <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message || result.error}
                  </div>
                  {result.success && result.tokenId && (
                    <div className="mt-3 space-y-1 text-xs text-green-600">
                      <div>Ticket ID: {result.tokenId}</div>
                      {result.attestationUid && <div>Attestation: {result.attestationUid.slice(0, 16)}...</div>}
                      {result.txHash && (
                        <div>
                          <a
                            href={`https://testnet.monadscan.com/tx/${result.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-green-800"
                          >
                            View Transaction →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">📖 How to Use</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li>1. Select the event from the dropdown menu</li>
                <li>2. Scan the attendee QR code or paste their wallet address</li>
                <li>3. Adjust reputation reward if needed (default: 50 points)</li>
                <li>4. Click &quot;Check In Attendee&quot; to process</li>
              </ol>
              <div className="mt-4 pt-4 border-t border-blue-200 text-xs text-blue-700">
                💡 The system will automatically find the correct ticket for this event and mark it as used.
              </div>
            </div>
          </div>

          {/* Check-In History */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Recent Check-Ins ({checkInHistory.length})
              </h2>
              
              {checkInHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <div>No check-ins yet</div>
                  <div className="text-sm mt-1">Check-in history will appear here</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkInHistory.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        item.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-white px-2 py-1 rounded border">
                              {item.address.slice(0, 6)}...{item.address.slice(-4)}
                            </code>
                            <span className={`text-xs font-medium ${
                              item.success ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.success ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className={`text-xs mt-1 ${
                            item.success ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {item.message}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

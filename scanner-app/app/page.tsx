'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageId, RaceEvent } from '@/lib/types';
import { checkAPIHealth, loadEvents } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import ScanPage from '@/components/ScanPage';
import EventsPage from '@/components/EventsPage';
import Toast from '@/components/Toast';

export default function Home() {
  const [page, setPage] = useState<PageId>('scan');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast({ message: msg, visible: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await loadEvents();
      if (data.success) setEvents(data.events);
    } catch {
      showToast('Failed to load events');
    }
  }, [showToast]);

  const pingAPI = useCallback(async () => {
    const ok = await checkAPIHealth();
    setApiOnline(ok);
  }, []);

  useEffect(() => {
    pingAPI();
    fetchEvents();
    const interval = setInterval(pingAPI, 30_000);
    return () => clearInterval(interval);
  }, [pingAPI, fetchEvents]);

  const statusColor =
    apiOnline === null ? 'var(--amber)' : apiOnline ? 'var(--green)' : 'var(--red)';
  const statusLabel =
    apiOnline === null ? 'Connecting' : apiOnline ? 'Online' : 'Offline';

  return (
    <>
      {/* App shell */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100dvh', overflow: 'hidden',
        background: 'var(--background)',
      }}>

        {/* ── Header ── */}
        <header style={{
          flexShrink: 0,
          padding: '12px 20px 10px',
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(245,197,24,0.35)',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--foreground)' }}>
              Race<span style={{ color: 'var(--accent-dark)' }}>Pass</span>
            </div>
          </div>

          {/* API status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 11px', borderRadius: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            fontSize: 11, color: 'var(--muted)',
            fontWeight: 500,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 5px ${statusColor}`,
            }} className="animate-pulse-dot" />
            {statusLabel}
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{
          flex: 1,
          overflowY: 'auto', overflowX: 'hidden',
          paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom) + 8px)',
          background: 'var(--surface)',
        }}>
          {page === 'scan' && <ScanPage events={events} onToast={showToast} />}
          {page === 'events' && <EventsPage events={events} onRefresh={fetchEvents} onToast={showToast} />}
        </main>

        <BottomNav active={page} onChange={setPage} />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}

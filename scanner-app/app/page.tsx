'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageId, RaceEvent, ScanHistoryEntry } from '@/lib/types';
import { checkAPIHealth, loadEvents } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import ScanPage from '@/components/ScanPage';
import EventsPage from '@/components/EventsPage';
import HistoryPage from '@/components/HistoryPage';
import Toast from '@/components/Toast';

export default function Home() {
  const [page, setPage] = useState<PageId>('scan');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
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

  function addHistory(entry: Omit<ScanHistoryEntry, 'id' | 'time'>) {
    setHistory((prev) => [
      { ...entry, id: Date.now().toString(), time: new Date() },
      ...prev.slice(0, 49),
    ]);
  }

  return (
    <>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        filter: 'blur(80px)', opacity: 0.18,
        width: 340, height: 340, top: -80, left: -80,
        background: 'radial-gradient(circle, #7c3aed, transparent)',
      }} />
      <div style={{
        position: 'fixed', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        filter: 'blur(80px)', opacity: 0.18,
        width: 260, height: 260, bottom: 120, right: -60,
        background: 'radial-gradient(circle, #06b6d4, transparent)',
      }} />

      {/* App shell */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        height: '100dvh', overflow: 'hidden',
      }}>
        {/* Header */}
        <header style={{
          flexShrink: 0, padding: '16px 20px 12px',
          background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--teal))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            }}>🏎️</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>
              Race<span style={{ color: 'var(--accent2)' }}>Pass</span>
            </div>
          </div>

          {/* API status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: apiOnline === null ? 'var(--amber)' : apiOnline ? 'var(--green)' : 'var(--red)',
              boxShadow: `0 0 8px ${apiOnline === null ? 'var(--amber)' : apiOnline ? 'var(--green)' : 'var(--red)'}`,
            }} className="animate-pulse-dot" />
            {apiOnline === null ? 'Connecting…' : apiOnline ? 'API Online' : 'API Offline'}
          </div>
        </header>

        {/* Main scrollable area */}
        <main style={{
          flex: 1,
          overflowY: 'auto', overflowX: 'hidden',
          paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom) + 8px)',
        }}>
          {page === 'scan' && (
            <ScanPage
              events={events}
              onToast={showToast}
              onScanLogged={addHistory}
            />
          )}
          {page === 'events' && (
            <EventsPage
              events={events}
              onRefresh={fetchEvents}
              onToast={showToast}
            />
          )}
          {page === 'history' && (
            <HistoryPage history={history} />
          )}
        </main>

        <BottomNav active={page} onChange={setPage} />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}

'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  imageUrl?: string;
  requiresKyc: boolean;
  minAge: number;
  minReputation: number;
  ticketsMinted: number;
  ticketsCheckedIn: number;
  maxTickets: number;
  isActive: boolean;
}

interface EditForm {
  name: string;
  date: string;
  location: string;
  description: string;
  price: string;
  imageEmoji: string;
  imageUrl: string | null;
  requiresKyc: boolean;
  minAge: number;
  minReputation: number;
  maxTickets: number;
  isActive: boolean;
}

// ── Chart helpers (same as before) ────────────────────────────────────────────

function StackedBar({ minted, checkedIn, max }: { minted: number; checkedIn: number; max: number }) {
  if (max === 0) return <div className="h-3 bg-gray-100 rounded-full" />;
  const mintedPct = Math.min(100, (minted / max) * 100);
  const checkinPct = minted > 0 ? Math.min(100, (checkedIn / minted) * mintedPct) : 0;
  return (
    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
      <div className="h-full bg-yellow-300 rounded-l-full transition-all duration-700" style={{ width: `${mintedPct - checkinPct}%` }} />
      <div className="h-full bg-yellow-500 transition-all duration-700" style={{ width: `${checkinPct}%` }} />
    </div>
  );
}

function DonutChart({ value, max, label, color = '#f5c518' }: { value: number; max: number; label: string; color?: string }) {
  const r = 44; const circ = 2 * Math.PI * r;
  const dash = max > 0 ? Math.min(1, value / max) * circ : 0;
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="55" y="51" textAnchor="middle" fontSize="15" fontWeight="800" fill="#111">{value}</text>
        <text x="55" y="66" textAnchor="middle" fontSize="9" fill="#9ca3af">/ {max}</text>
      </svg>
      <span className="text-xs font-semibold text-gray-500 -mt-1">{label}</span>
    </div>
  );
}

function BarChart({ events }: { events: Event[] }) {
  const top = useMemo(() => [...events].sort((a, b) => b.ticketsMinted - a.ticketsMinted).slice(0, 6), [events]);
  const maxVal = Math.max(...top.map(e => e.ticketsMinted), 1);
  if (top.length === 0) return <div className="h-44 flex items-center justify-center text-sm text-gray-400">No data yet</div>;
  return (
    <div className="flex items-end gap-3 h-44 w-full px-2">
      {top.map((ev, i) => {
        const h = Math.max(8, Math.round((ev.ticketsMinted / maxVal) * 140));
        return (
          <div key={ev.id} className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[10px] font-bold text-gray-700 mb-1">{ev.ticketsMinted}</span>
            <div className="w-full rounded-t-lg" style={{ height: h, background: i === 0 ? 'linear-gradient(to top,#d97706,#fbbf24)' : 'linear-gradient(to top,#fde68a,#fef3c7)' }} />
            <span className="text-[9px] text-gray-500 mt-1 truncate text-center w-full" title={ev.name}>
              {ev.name.length > 10 ? ev.name.slice(0, 9) + '…' : ev.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AttendanceBars({ events }: { events: Event[] }) {
  const sorted = useMemo(() =>
    [...events].filter(e => e.ticketsMinted > 0)
      .sort((a, b) => (b.ticketsCheckedIn / b.ticketsMinted) - (a.ticketsCheckedIn / a.ticketsMinted))
      .slice(0, 5), [events]);
  if (sorted.length === 0) return <div className="flex items-center justify-center h-32 text-sm text-gray-400">No check-in data yet</div>;
  return (
    <div className="space-y-3">
      {sorted.map(ev => {
        const rate = ((ev.ticketsCheckedIn / ev.ticketsMinted) * 100);
        return (
          <div key={ev.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-700 truncate max-w-[65%]">{ev.name}</span>
              <span className="text-xs font-black text-yellow-600">{rate.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${rate}%`,
                background: rate > 70 ? 'linear-gradient(to right,#f59e0b,#fbbf24)' : rate > 40 ? 'linear-gradient(to right,#fcd34d,#fde68a)' : '#e5e7eb'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KycPieChart({ events }: { events: Event[] }) {
  const kyc = events.filter(e => e.requiresKyc).length;
  const total = events.length;
  if (total === 0) return <div className="flex items-center justify-center h-24 text-sm text-gray-400">No data</div>;
  const r = 36; const circ = 2 * Math.PI * r; const dash = (kyc / total) * circ;
  return (
    <div className="flex items-center gap-6">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        <circle cx="45" cy="45" r={r} fill="none" stroke="#f5c518" strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} strokeLinecap="round" />
      </svg>
      <div className="space-y-2">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /><span className="text-xs text-gray-600 font-semibold">KYC Required</span><span className="ml-auto text-xs font-black text-gray-900">{kyc}</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /><span className="text-xs text-gray-600 font-semibold">Open Access</span><span className="ml-auto text-xs font-black text-gray-900">{total - kyc}</span></div>
        <div className="pt-1 border-t border-gray-100"><span className="text-[10px] text-gray-400">{total > 0 ? ((kyc / total) * 100).toFixed(0) : 0}% require KYC</span></div>
      </div>
    </div>
  );
}

const inputClass = 'mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none px-3 py-2 text-sm transition-all duration-200';

// ── Edit Drawer ────────────────────────────────────────────────────────────────
function EditDrawer({
  event, onClose, onSaved,
}: {
  event: Event;
  onClose: () => void;
  onSaved: (updated: Event) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState(false);

  const [form, setForm] = useState<EditForm>({
    name: event.name,
    date: event.date?.slice(0, 10) ?? '',
    location: event.location,
    description: event.description ?? '',
    price: event.price ?? '',
    imageEmoji: event.image ?? '🎫',
    imageUrl: event.imageUrl ?? null,
    requiresKyc: event.requiresKyc,
    minAge: event.minAge,
    minReputation: event.minReputation,
    maxTickets: event.maxTickets,
    isActive: event.isActive,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') setForm(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    else if (type === 'number') setForm(p => ({ ...p, [name]: parseInt(value) || 0 }));
    else setForm(p => ({ ...p, [name]: value }));
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setSaveError('Not a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setSaveError('Image must be under 5 MB'); return; }
    setSaveError('');
    const reader = new FileReader();
    reader.onload = e => setForm(p => ({ ...p, imageUrl: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0]; if (file) processFile(file);
  }, []);

  const handleSave = async () => {
    setIsSaving(true); setSaveError(''); setSaveOk(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, imageEmoji: form.imageEmoji }),
      });
      const data = await res.json();
      if (!data.success) { setSaveError(data.error || 'Failed to save'); return; }
      setSaveOk(true);
      onSaved({ ...event, ...form, image: form.imageEmoji, imageUrl: form.imageUrl ?? undefined });
      setTimeout(onClose, 800);
    } catch {
      setSaveError('Network error — check backend');
    } finally {
      setIsSaving(false);
    }
  };

  const emojiOptions = ['🎫', '🏎️', '💻', '🎵', '₿', '🎪', '🎭', '🏆', '🎨', '🎬', '⚽', '🎸'];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-black text-gray-900">Edit Event</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{event.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Cover image */}
          <div>
            <label className="block text-xs font-bold text-yellow-600 uppercase tracking-widest mb-2">Cover Image</label>
            {form.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 group h-40">
                <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow hover:bg-yellow-50">Change</button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, imageUrl: null }))}
                    className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-red-400">Remove</button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed h-32 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isDragging ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'}`}
              >
                <svg className={`w-6 h-6 ${isDragging ? 'text-yellow-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs font-semibold text-gray-500">{isDragging ? 'Drop to upload' : 'Drag & drop or click — max 5 MB'}</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Event Name</label>
            <input name="name" value={form.name} onChange={handleChange} className={inputClass} />
          </div>

          {/* Date + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Location</label>
              <input name="location" value={form.location} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass + ' resize-none'} />
          </div>

          {/* Price + Emoji */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Price</label>
              <input name="price" value={form.price} onChange={handleChange} className={inputClass} placeholder="₹5,000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Fallback Emoji</label>
              <select name="imageEmoji" value={form.imageEmoji} onChange={handleChange} className={inputClass + ' text-xl'}>
                {emojiOptions.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Requirements */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Access Requirements</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="requiresKyc" checked={form.requiresKyc} onChange={handleChange} className="w-4 h-4 accent-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">Require KYC Verification</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Min Age</label>
                <input type="number" name="minAge" value={form.minAge} onChange={handleChange} className={inputClass} min="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Min Reputation</label>
                <input type="number" name="minReputation" value={form.minReputation} onChange={handleChange} className={inputClass} min="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Max Tickets</label>
              <input type="number" name="maxTickets" value={form.maxTickets} onChange={handleChange} className={inputClass} min="1" />
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer rounded-2xl border border-gray-100 px-4 py-3 hover:border-yellow-200 transition-colors">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-4 h-4 accent-yellow-400" />
            <div>
              <span className="text-sm font-semibold text-gray-700">Event is active</span>
              <p className="text-xs text-gray-400">Inactive events are hidden from the frontend</p>
            </div>
          </label>

          {/* Feedback */}
          {saveError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-xs font-semibold text-red-700">{saveError}</p>
            </div>
          )}
          {saveOk && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs font-semibold text-green-800">Saved successfully!</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-sm font-semibold text-gray-600 transition-all">Cancel</button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20 hover:-translate-y-0.5'}`}
          >
            {isSaving ? <><span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 0.28s cubic-bezier(0.22,1,0.36,1); }
      `}</style>
    </>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const statCards = [
  { key: 'totalEvents', label: 'Total Events', suffix: '' },
  { key: 'totalTicketsMinted', label: 'Tickets Minted', suffix: '' },
  { key: 'totalCheckedIn', label: 'Total Check-Ins', suffix: '' },
  { key: 'avgAttendanceRate', label: 'Avg Attendance', suffix: '%' },
];

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState({ totalEvents: 0, totalTicketsMinted: 0, totalCheckedIn: 0, avgAttendanceRate: 0 });

  const calcStats = (evs: Event[]) => {
    const totalMinted = evs.reduce((s, e) => s + e.ticketsMinted, 0);
    const totalChecked = evs.reduce((s, e) => s + e.ticketsCheckedIn, 0);
    setStats({
      totalEvents: evs.length,
      totalTicketsMinted: totalMinted,
      totalCheckedIn: totalChecked,
      avgAttendanceRate: Number(totalMinted > 0 ? ((totalChecked / totalMinted) * 100).toFixed(1) : 0),
    });
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/events`);
      const data = await res.json();
      if (data.success) { setEvents(data.events); calcStats(data.events); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSaved = (updated: Event) => {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
    calcStats(events.map(e => e.id === updated.id ? updated : e));
  };

  const totalCapacity = useMemo(() => events.reduce((s, e) => s + e.maxTickets, 0), [events]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Edit Drawer ─────────────────────────────────────────────────────── */}
      {editingEvent && (
        <EditDrawer event={editingEvent} onClose={() => setEditingEvent(null)} onSaved={handleSaved} />
      )}

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-gray-100"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #f5c51820 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Admin Dashboard</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900">Event Management</h1>
              <p className="mt-1 text-sm text-gray-500">Monitor events, tickets, and attendance in real time.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/verify" className="rounded-xl border border-gray-200 bg-white hover:bg-yellow-50 hover:border-yellow-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200">
                Verify Credential
              </Link>
              <Link href="/create-event" className="rounded-xl bg-yellow-400 hover:bg-yellow-300 px-4 py-2 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all duration-200 hover:-translate-y-0.5">
                + Create Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── STAT CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ key, label, suffix }) => (
            <div key={key} className="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 hover:-translate-y-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-4xl font-black text-yellow-500 mt-2">{stats[key as keyof typeof stats]}{suffix}</div>
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW 1 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-black text-gray-900">Tickets Minted by Event</h2>
                <p className="text-xs text-gray-400 mt-0.5">Top events by ticket volume</p>
              </div>
            </div>
            {isLoading ? <div className="h-44 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" /></div>
              : <BarChart events={events} />}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col">
            <div className="mb-5">
              <h2 className="text-sm font-black text-gray-900">Event KYC Split</h2>
              <p className="text-xs text-gray-400 mt-0.5">KYC vs open access events</p>
            </div>
            {isLoading ? <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" /></div>
              : <div className="flex-1 flex items-center"><KycPieChart events={events} /></div>}
          </div>
        </div>

        {/* ── CHARTS ROW 2 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-5">
              <h2 className="text-sm font-black text-gray-900">Attendance Rates</h2>
              <p className="text-xs text-gray-400 mt-0.5">Check-in % per event</p>
            </div>
            {isLoading ? <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" /></div>
              : <AttendanceBars events={events} />}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-5">
              <h2 className="text-sm font-black text-gray-900">Capacity Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Minted vs capacity</p>
            </div>
            {isLoading ? <div className="h-28 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" /></div>
              : <div className="flex justify-around"><DonutChart value={stats.totalTicketsMinted} max={totalCapacity} label="Tickets Sold" /><DonutChart value={stats.totalCheckedIn} max={stats.totalTicketsMinted} label="Checked In" color="#d97706" /></div>}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-sm font-black text-gray-900">Quick Summary</h2>
              <p className="text-xs text-gray-400 mt-0.5">Platform health at a glance</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total capacity', value: totalCapacity.toLocaleString() },
                { label: 'Capacity utilisation', value: totalCapacity > 0 ? `${((stats.totalTicketsMinted / totalCapacity) * 100).toFixed(1)}%` : '—' },
                { label: 'Active events', value: events.filter(e => e.isActive).length },
                { label: 'Sold out events', value: events.filter(e => e.ticketsMinted >= e.maxTickets).length },
                { label: 'KYC-gated events', value: events.filter(e => e.requiresKyc).length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-black text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── EVENTS TABLE ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900">All Events</h2>
              <p className="text-xs text-gray-400 mt-0.5">{events.length} events total — click Edit to update any event</p>
            </div>
            <Link href="/create-event" className="rounded-xl bg-yellow-400 hover:bg-yellow-300 px-4 py-1.5 text-xs font-bold text-black transition-all duration-200">
              + New Event
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin mb-3" />
              <p className="text-sm text-gray-400">Loading events…</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-gray-600">No events yet</p>
              <Link href="/create-event" className="inline-block mt-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 px-5 py-2 text-sm font-bold text-black">
                Create Event →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Event', 'Date', 'Location', 'Capacity', 'Attendance', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map(event => {
                    const arPct = event.ticketsMinted > 0 ? ((event.ticketsCheckedIn / event.ticketsMinted) * 100).toFixed(0) : 0;
                    const isSoldOut = event.ticketsMinted >= event.maxTickets;
                    return (
                      <tr key={event.id} className="hover:bg-yellow-50/40 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Thumbnail or emoji */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                              {event.imageUrl
                                ? <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-yellow-50 flex items-center justify-center text-xl">{event.image}</div>
                              }
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{event.name}</div>
                              <div className="text-xs text-gray-400">{event.price}</div>
                            </div>
                            {isSoldOut && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Sold Out</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                          <div className="text-xs font-semibold text-gray-700 mb-1.5">{event.ticketsMinted} / {event.maxTickets}</div>
                          <StackedBar minted={event.ticketsMinted} checkedIn={event.ticketsCheckedIn} max={event.maxTickets} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-gray-900">{arPct}%</div>
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${arPct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {/* Edit button */}
                            <button
                              onClick={() => setEditingEvent(event)}
                              className="inline-flex items-center gap-1 rounded-lg border border-yellow-300 bg-yellow-50 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black px-3 py-1.5 text-xs font-bold text-yellow-700 transition-all duration-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <Link href={`/event/${event.id}`}
                              className="inline-flex items-center rounded-lg border border-gray-200 bg-white hover:border-yellow-400 hover:bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all duration-200">
                              View →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

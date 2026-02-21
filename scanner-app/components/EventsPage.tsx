'use client';

import { useState } from 'react';
import { RaceEvent, EventDetail } from '@/lib/types';
import { loadEventDetail } from '@/lib/api';

interface Props {
    events: RaceEvent[];
    onRefresh: () => void;
    onToast: (msg: string) => void;
}

export default function EventsPage({ events, onRefresh, onToast }: Props) {
    const [detail, setDetail] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(false);

    async function openStats(eventId: number) {
        setLoading(true);
        try {
            const data = await loadEventDetail(eventId);
            if (!data.success) throw new Error(data.error);
            setDetail(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Error';
            onToast('Failed to load stats: ' + msg);
        } finally {
            setLoading(false);
        }
    }

    function closeStats() {
        setDetail(null);
        onRefresh();
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <div style={{
                    width: 40, height: 40,
                    border: '3px solid rgba(124,58,237,0.2)',
                    borderTopColor: 'var(--accent2)',
                    borderRadius: '50%',
                }} className="animate-spin" />
            </div>
        );
    }

    /* ── STATS DETAIL ───────────────────────────────────────────────── */
    if (detail) {
        const ev = detail.event;
        const pct = ev.maxTickets > 0 ? Math.min(100, (ev.ticketsCheckedIn / ev.maxTickets) * 100) : 0;

        return (
            <div className="animate-fadeUp" style={{ padding: '0 16px 16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <button onClick={closeStats} style={{
                        background: 'var(--glass-b)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '7px 12px',
                        color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                    }}>← Back</button>
                    <div style={{ fontSize: 15, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.image} {ev.name}
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[
                        { value: ev.ticketsMinted, label: '🎟 Tickets Sold', accent: true },
                        { value: ev.ticketsCheckedIn, label: '✅ Checked In', accent: true },
                        { value: ev.maxTickets, label: '🏟 Capacity', accent: false },
                        { value: detail.stats.attendanceRate + '%', label: '📊 Attendance', accent: false },
                    ].map((s) => (
                        <div key={s.label} style={{
                            background: 'var(--glass)', border: '1px solid var(--border)',
                            borderRadius: 14, padding: '14px 12px', textAlign: 'center',
                        }}>
                            <div style={s.accent ? {
                                fontSize: 28, fontWeight: 800, lineHeight: 1,
                                background: 'linear-gradient(135deg, var(--accent2), var(--teal))',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            } : { fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                                {s.value}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontWeight: 500, letterSpacing: '0.5px' }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                        <span>Check-in Progress</span>
                        <span>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 4,
                            background: 'linear-gradient(90deg, var(--accent), var(--teal))',
                            width: pct + '%', transition: 'width 0.6s ease',
                        }} />
                    </div>
                </div>

                {/* Event Details Card */}
                <div style={{
                    background: 'var(--glass)', backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border)',
                    borderRadius: 18, padding: 18, marginBottom: 12,
                }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                        Event Details
                    </p>
                    {[
                        { label: '📍 Location', value: ev.location },
                        { label: '📅 Date', value: ev.date },
                        { label: '💰 Price', value: ev.price },
                        { label: '🔞 Min Age', value: ev.minAge },
                        { label: '⭐ Min Reputation', value: ev.minReputation },
                    ].map((row) => (
                        <div key={row.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0', borderBottom: '1px solid var(--border)',
                            fontSize: 13,
                        }}>
                            <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                            <span style={{ fontWeight: 500 }}>{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Attendees */}
                <div style={{
                    background: 'var(--glass)', backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border)',
                    borderRadius: 18, padding: 18,
                }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                        Recent Attendees ({detail.attendees.length})
                    </p>
                    {detail.attendees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>No attendees yet</div>
                    ) : (
                        detail.attendees.slice(0, 20).map((a, i) => {
                            const short = a.owner_address.slice(0, 6) + '…' + a.owner_address.slice(-4);
                            const initials = a.owner_address.slice(2, 4).toUpperCase();
                            const time = new Date(a.minted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 0', borderBottom: i < detail.attendees.length - 1 ? '1px solid var(--border)' : 'none',
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, var(--accent), var(--teal))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700,
                                    }}>{initials}</div>
                                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {short}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{time}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    /* ── EVENTS LIST ─────────────────────────────────────────────────── */
    return (
        <div className="animate-fadeUp" style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                Active Events — tap for stats
            </p>

            {events.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 42, marginBottom: 12 }}>🎪</div>
                    <p style={{ fontSize: 14 }}>No active events found.<br />Check API connection.</p>
                </div>
            )}

            {events.map((ev) => {
                const pct = ev.maxTickets > 0 ? ((ev.ticketsCheckedIn / ev.maxTickets) * 100).toFixed(0) : '0';
                return (
                    <div
                        key={ev.id}
                        onClick={() => openStats(ev.id)}
                        style={{
                            background: 'var(--glass)', border: '1px solid var(--border)',
                            borderRadius: 16, padding: '14px 16px', marginBottom: 10,
                            display: 'flex', alignItems: 'center', gap: 14,
                            cursor: 'pointer', transition: 'border-color 0.2s',
                        }}
                    >
                        <span style={{ fontSize: 32, flexShrink: 0 }}>{ev.image || '🎫'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span>📍 {ev.location}</span>
                                <span>📅 {ev.date}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                {[
                                    { label: `🎟 ${ev.ticketsMinted} sold`, bg: 'rgba(124,58,237,0.2)', color: 'var(--accent2)' },
                                    { label: `✅ ${ev.ticketsCheckedIn} in`, bg: 'rgba(34,197,94,0.15)', color: 'var(--green)' },
                                    { label: `📊 ${pct}%`, bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
                                    ...(ev.requiresKyc ? [{ label: '🔒 KYC', bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' }] : []),
                                ].map((b) => (
                                    <span key={b.label} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                        padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                        background: b.bg, color: b.color,
                                    }}>{b.label}</span>
                                ))}
                            </div>
                        </div>
                        <span style={{ color: 'var(--muted)', fontSize: 16 }}>›</span>
                    </div>
                );
            })}
        </div>
    );
}

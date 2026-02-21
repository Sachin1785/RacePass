'use client';

import React, { useState } from 'react';
import { RaceEvent, EventDetail } from '@/lib/types';
import { loadEventDetail } from '@/lib/api';

// ── Tiny icon factory ──────────────────────────────────────
const I = (d: React.ReactNode, size = 11) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const TicketIcon = ({ s = 11 }: { s?: number }) => I(<path d="M2 9a1 1 0 000 2 2 2 0 012 2H2a1 1 0 000 2h20a1 1 0 000-2h-2a2 2 0 012-2 1 1 0 000-2H2z" />, s);
const CheckInIcon = ({ s = 11 }: { s?: number }) => I(<polyline points="20 6 9 17 4 12" />, s);
const CapacityIcon = ({ s = 11 }: { s?: number }) => I(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>, s);
const ChartIcon = ({ s = 11 }: { s?: number }) => I(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>, s);
const LockIcon = ({ s = 11 }: { s?: number }) => I(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>, s);
const LocationIcon = ({ s = 11 }: { s?: number }) => I(<><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>, s);
const CalendarIcon = ({ s = 11 }: { s?: number }) => I(<><rect x="3" y="4" width="18" height="17" rx="2.5" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, s);
const MoneyIcon = ({ s = 11 }: { s?: number }) => I(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>, s);
const AgeIcon = ({ s = 11 }: { s?: number }) => I(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>, s);
const StarIcon = ({ s = 11 }: { s?: number }) => I(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />, s);
const ChevronRight = () => I(<polyline points="9 18 15 12 9 6" />, 14);
const ArrowLeft = () => I(<><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>, 15);
const CalEmptyIcon = () => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2.5" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

// ── Shared styles ──────────────────────────────────────────
const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.9px',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
};
const card: React.CSSProperties = {
    background: 'var(--background)',
    border: '1px solid var(--border)',
};

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
            onToast('Failed to load stats: ' + (e instanceof Error ? e.message : 'Error'));
        } finally {
            setLoading(false);
        }
    }

    function closeStats() { setDetail(null); onRefresh(); }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                }} className="animate-spin" />
            </div>
        );
    }

    /* ── STATS DETAIL ─────────────────────────────────── */
    if (detail) {
        const ev = detail.event;
        const pct = ev.maxTickets > 0 ? Math.min(100, (ev.ticketsCheckedIn / ev.maxTickets) * 100) : 0;

        const statCards = [
            { value: ev.ticketsMinted, label: 'Tickets Sold', Icon: TicketIcon, accent: true },
            { value: ev.ticketsCheckedIn, label: 'Checked In', Icon: CheckInIcon, accent: true },
            { value: ev.maxTickets, label: 'Capacity', Icon: CapacityIcon, accent: false },
            { value: detail.stats.attendanceRate + '%', label: 'Rate', Icon: ChartIcon, accent: false },
        ];

        const detailRows = [
            { icon: <LocationIcon s={12} />, label: 'Location', value: ev.location },
            { icon: <CalendarIcon s={12} />, label: 'Date', value: ev.date },
            { icon: <MoneyIcon s={12} />, label: 'Price', value: ev.price },
            { icon: <AgeIcon s={12} />, label: 'Min Age', value: ev.minAge },
            { icon: <StarIcon s={12} />, label: 'Min Reputation', value: ev.minReputation },
        ];

        return (
            <div className="animate-fadeUp" style={{ padding: 16 }}>
                {/* Back header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <button id="back-btn" onClick={closeStats} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '7px 12px',
                        color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
                        fontFamily: 'inherit', fontWeight: 500,
                    }}><ArrowLeft /> Back</button>
                    <div style={{ fontSize: 15, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px', color: 'var(--foreground)' }}>
                        {ev.name}
                    </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {statCards.map((s) => (
                        <div key={s.label} style={{ ...card, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                            <div style={s.accent
                                ? { fontSize: 26, fontWeight: 800, lineHeight: 1, color: 'var(--accent-dark)' }
                                : { fontSize: 26, fontWeight: 800, lineHeight: 1, color: 'var(--foreground)' }
                            }>{s.value}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, color: 'var(--muted)', marginTop: 5, fontWeight: 500, letterSpacing: '0.4px' }}>
                                <s.Icon s={10} /> {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                        <span>Check-in Progress</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-dark)' }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{
                            height: '100%', borderRadius: 3,
                            background: 'var(--accent)',
                            width: pct + '%', transition: 'width 0.6s ease',
                        }} />
                    </div>
                </div>

                {/* Event details */}
                <div style={{ ...card, borderRadius: 16, padding: '12px 16px', marginBottom: 12 }}>
                    <p style={sectionLabel}>Event Details</p>
                    {detailRows.map((row, i) => (
                        <div key={row.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: i < detailRows.length - 1 ? '1px solid var(--border)' : 'none',
                            fontSize: 13,
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)' }}>{row.icon} {row.label}</span>
                            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Attendees */}
                <div style={{ ...card, borderRadius: 16, padding: '12px 16px' }}>
                    <p style={sectionLabel}>Attendees ({detail.attendees.length})</p>
                    {detail.attendees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--muted)', fontSize: 13 }}>No attendees yet</div>
                    ) : (
                        detail.attendees.slice(0, 20).map((a, i) => {
                            const short = a.owner_address.slice(0, 6) + '…' + a.owner_address.slice(-4);
                            const initials = a.owner_address.slice(2, 4).toUpperCase();
                            const time = new Date(a.minted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 0',
                                    borderBottom: i < detail.attendees.length - 1 ? '1px solid var(--border)' : 'none',
                                }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                        background: 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, color: 'var(--foreground)',
                                    }}>{initials}</div>
                                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--foreground)' }}>
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

    /* ── EVENTS LIST ──────────────────────────────────── */
    return (
        <div className="animate-fadeUp" style={{ padding: 16 }}>
            <p style={sectionLabel}>Active Events</p>

            {events.length === 0 && (
                <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><CalEmptyIcon /></div>
                    <p style={{ fontSize: 14, lineHeight: 1.7 }}>No active events.<br />Check API connection.</p>
                </div>
            )}

            {events.map((ev) => {
                const pct = ev.maxTickets > 0 ? ((ev.ticketsCheckedIn / ev.maxTickets) * 100).toFixed(0) : '0';
                const initials = ev.name.slice(0, 2).toUpperCase();
                return (
                    <div
                        key={ev.id}
                        id={`event-card-${ev.id}`}
                        onClick={() => openStats(ev.id)}
                        style={{
                            ...card, borderRadius: 16,
                            padding: '13px 15px', marginBottom: 8,
                            display: 'flex', alignItems: 'center', gap: 13,
                            cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        }}
                    >
                        {/* Gold avatar */}
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800, color: 'var(--foreground)',
                            letterSpacing: '-0.5px',
                        }}>{initials}</div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4, color: 'var(--foreground)' }}>
                                {ev.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><LocationIcon /> {ev.location}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CalendarIcon /> {ev.date}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {[
                                    { icon: <TicketIcon />, label: `${ev.ticketsMinted} sold`, bg: 'rgba(245,197,24,0.12)', color: 'var(--accent-dark)' },
                                    { icon: <CheckInIcon />, label: `${ev.ticketsCheckedIn} checked in`, bg: 'var(--green-bg)', color: 'var(--green)' },
                                    { icon: <ChartIcon />, label: `${pct}%`, bg: 'var(--surface-2)', color: 'var(--muted)' },
                                    ...(ev.requiresKyc ? [{ icon: <LockIcon />, label: 'KYC', bg: 'var(--amber-bg)', color: 'var(--amber)' }] : []),
                                ].map((b) => (
                                    <span key={b.label} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                        padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                        background: b.bg, color: b.color,
                                    }}>{b.icon}{b.label}</span>
                                ))}
                            </div>
                        </div>

                        <div style={{ color: 'var(--muted-light)', flexShrink: 0 }}><ChevronRight /></div>
                    </div>
                );
            })}
        </div>
    );
}

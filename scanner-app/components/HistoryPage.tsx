'use client';

import { ScanHistoryEntry } from '@/lib/types';

interface Props {
    history: ScanHistoryEntry[];
}

export default function HistoryPage({ history }: Props) {
    if (history.length === 0) {
        return (
            <div className="animate-fadeUp" style={{ padding: '0 16px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                    Scan History
                </p>
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>No scans yet.<br />Start scanning to see results here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeUp" style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                Scan History ({history.length})
            </p>
            <div style={{
                background: 'var(--glass)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border)',
                borderRadius: 18, padding: '4px 18px',
            }}>
                {history.map((h, i) => {
                    const short = h.address.slice(0, 8) + '…' + h.address.slice(-6);
                    const timeStr = h.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr = h.time.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                        <div key={h.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 0',
                            borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16,
                                background: h.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            }}>
                                {h.success ? '✅' : '❌'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {short}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                                    {h.eventName}
                                    {h.error && <span style={{ color: 'var(--red)' }}> · {h.error.slice(0, 40)}</span>}
                                </div>
                                {h.txHash && (
                                    <div style={{ fontSize: 10, color: 'var(--teal)', marginTop: 2, fontFamily: 'monospace' }}>
                                        Tx: {h.txHash.slice(0, 18)}…
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, paddingTop: 2, textAlign: 'right' }}>
                                <div>{timeStr}</div>
                                <div>{dateStr}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

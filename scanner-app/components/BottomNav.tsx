'use client';

import { PageId } from '@/lib/types';

interface Props {
    active: PageId;
    onChange: (p: PageId) => void;
}

const ScanIcon = ({ size = 22, sw = 1.9 }: { size?: number; sw?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="17" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
        <line x1="14" y1="14" x2="17" y2="14" />
        <line x1="21" y1="14" x2="21" y2="17" />
        <line x1="17" y1="21" x2="21" y2="21" />
    </svg>
);

const EventsIcon = ({ size = 22, sw = 1.9 }: { size?: number; sw?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="8" y2="14" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="12" y1="14" x2="12" y2="14" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="16" y1="14" x2="16" y2="14" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="8" y1="18" x2="8" y2="18" strokeWidth={2.5} strokeLinecap="round" />
        <line x1="12" y1="18" x2="12" y2="18" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
);

const tabs: { id: PageId; label: string; Icon: typeof ScanIcon }[] = [
    { id: 'scan', label: 'Scan', Icon: ScanIcon },
    { id: 'events', label: 'Events', Icon: EventsIcon },
];

export default function BottomNav({ active, onChange }: Props) {
    return (
        <nav style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: 'calc(var(--nav-h) + var(--safe-bottom))',
            paddingBottom: 'var(--safe-bottom)',
            background: 'var(--background)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 100,
        }}>
            {tabs.map((tab) => {
                const isActive = active === tab.id;
                const isScan = tab.id === 'scan';

                return (
                    <button
                        key={tab.id}
                        id={`nav-${tab.id}`}
                        onClick={() => onChange(tab.id)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: '8px 0',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            color: isActive ? 'var(--foreground)' : 'var(--muted-light)',
                            transition: 'color 0.18s',
                        }}
                    >
                        {isScan ? (
                            /* Yellow FAB-style active button for scan */
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: '50%',
                                background: isActive ? 'var(--accent)' : 'var(--surface-2)',
                                border: isActive ? 'none' : '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isActive ? 'var(--foreground)' : 'var(--muted)',
                                boxShadow: isActive ? '0 4px 16px rgba(245,197,24,0.45)' : 'none',
                                transform: isActive ? 'scale(1.06)' : 'scale(1)',
                                transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                            }}>
                                <tab.Icon size={21} sw={isActive ? 2.2 : 1.9} />
                            </div>
                        ) : (
                            <div style={{
                                width: 36, height: 36,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 10,
                                background: isActive ? 'rgba(245,197,24,0.12)' : 'none',
                                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                                transition: 'background 0.2s, transform 0.2s',
                                color: isActive ? 'var(--accent-dark)' : 'var(--muted-light)',
                            }}>
                                <tab.Icon size={21} sw={isActive ? 2.1 : 1.8} />
                            </div>
                        )}

                        <span style={{
                            fontSize: 10,
                            fontWeight: isActive ? 700 : 400,
                            letterSpacing: '0.2px',
                            color: isScan
                                ? (isActive ? 'var(--foreground)' : 'var(--muted-light)')
                                : (isActive ? 'var(--accent-dark)' : 'var(--muted-light)'),
                            transition: 'color 0.18s',
                        }}>
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

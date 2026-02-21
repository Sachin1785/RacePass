'use client';

import { PageId } from '@/lib/types';

interface Props {
    active: PageId;
    onChange: (p: PageId) => void;
}

const tabs: { id: PageId; label: string; icon: string }[] = [
    { id: 'scan', label: 'Scan', icon: '📷' },
    { id: 'events', label: 'Events', icon: '🎪' },
    { id: 'history', label: 'History', icon: '🕐' },
];

export default function BottomNav({ active, onChange }: Props) {
    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'calc(var(--nav-h) + var(--safe-bottom))',
            paddingBottom: 'var(--safe-bottom)',
            background: 'rgba(18,18,28,0.88)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
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
                            color: isActive ? 'var(--accent2)' : 'var(--muted)',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {isScan ? (
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent), var(--teal))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 22,
                                boxShadow: isActive
                                    ? '0 0 30px rgba(124,58,237,0.75)'
                                    : '0 0 18px rgba(124,58,237,0.4)',
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                transition: 'box-shadow 0.2s, transform 0.2s',
                            }}>
                                {tab.icon}
                            </div>
                        ) : (
                            <span style={{
                                fontSize: 22,
                                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                                transition: 'transform 0.2s',
                                display: 'block',
                            }}>
                                {tab.icon}
                            </span>
                        )}
                        <span style={{
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.3px',
                            color: isScan && !isActive ? 'var(--text)' : undefined,
                        }}>
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

'use client';

import { useEffect, useState } from 'react';

export default function InstallBanner() {
    const [prompt, setPrompt] = useState<Event | null>(null);
    const [visible, setVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed this session
        if (sessionStorage.getItem('pwa-dismissed')) return;

        // Don't show if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setPrompt(e);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    async function handleInstall() {
        if (!prompt) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (prompt as any).prompt();
        if (result?.outcome === 'accepted') {
            setVisible(false);
        }
    }

    function dismiss() {
        setVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem('pwa-dismissed', '1');
    }

    if (!visible || isDismissed) return null;

    return (
        <div style={{
            position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)',
            left: 12, right: 12, zIndex: 150,
            background: 'rgba(18,18,28,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 18, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 8px 32px rgba(124,58,237,0.2)',
            animation: 'fadeUp 0.3s ease',
        }}>
            {/* Icon */}
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: '0 0 16px rgba(124,58,237,0.4)',
            }}>
                🏎️
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                    Install RacePass Scanner
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Add to home screen for quick access
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={dismiss} style={{
                    padding: '7px 10px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 9, color: '#94a3b8',
                    fontFamily: 'Inter, sans-serif', fontSize: 12, cursor: 'pointer',
                }}>✕</button>
                <button onClick={handleInstall} style={{
                    padding: '7px 14px',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    border: 'none', borderRadius: 9, color: '#fff',
                    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,58,237,0.35)',
                }}>Install</button>
            </div>
        </div>
    );
}

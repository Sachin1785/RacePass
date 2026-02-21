'use client';

import { useEffect, useRef, useState } from 'react';
import { RaceEvent } from '@/lib/types';
import { checkKYC, checkInByAddress } from '@/lib/api';

interface ResultState {
    visible: boolean;
    loading: boolean;
    icon: string;
    status: string;
    statusClass: 'success' | 'error' | 'loading';
    address: string;
    detail: string;
    showCheckin: boolean;
}

const DEFAULT_RESULT: ResultState = {
    visible: false, loading: false,
    icon: '', status: '', statusClass: 'loading',
    address: '', detail: '', showCheckin: false,
};

interface Props {
    events: RaceEvent[];
    onToast: (msg: string) => void;
    onScanLogged: (entry: { address: string; eventName: string; success: boolean; error?: string; txHash?: string }) => void;
}

export default function ScanPage({ events, onToast, onScanLogged }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lockedRef = useRef(false);

    const [cameraActive, setCameraActive] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
    const [result, setResult] = useState<ResultState>(DEFAULT_RESULT);
    const [pendingAddress, setPendingAddress] = useState('');

    const selectedEvent = events.find((e) => e.id === selectedEventId);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function toggleCamera() {
        if (cameraActive) stopCamera();
        else await startCamera();
    }

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraActive(true);
            intervalRef.current = setInterval(scanFrame, 250);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            onToast('Camera error: ' + msg);
        }
    }

    function stopCamera() {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraActive(false);
        lockedRef.current = false;
    }

    function scanFrame() {
        if (lockedRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Dynamically import jsQR (client-side only)
        import('jsqr').then(({ default: jsQR }) => {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });
            if (code?.data) handleQR(code.data);
        });
    }

    function handleQR(raw: string) {
        let address = raw.trim().replace(/^ethereum:/i, '').split('?')[0].split('@')[0];
        if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return;

        lockedRef.current = true;
        if ('vibrate' in navigator) navigator.vibrate([60, 30, 60]);

        if (!selectedEvent) {
            setResult({
                visible: true, loading: false,
                icon: '⚠️', status: 'No Event Selected', statusClass: 'loading',
                address,
                detail: 'Please choose an event from the dropdown before scanning.',
                showCheckin: false,
            });
            return;
        }

        setPendingAddress(address);
        setResult({
            visible: true, loading: true,
            icon: '', status: 'Checking…', statusClass: 'loading',
            address,
            detail: `Looking up ticket for <b>${selectedEvent.name}</b>…`,
            showCheckin: false,
        });

        // Run KYC check
        fetchKYCThenShow(address, selectedEvent);
    }

    async function fetchKYCThenShow(address: string, ev: RaceEvent) {
        try {
            const kycD = await checkKYC(address);
            let kycBadge = '';
            if (kycD.success) {
                kycBadge = kycD.isVerified
                    ? '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(34,197,94,0.15);color:#22c55e;">✅ KYC Verified</span>'
                    : '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(245,158,11,0.15);color:#f59e0b;">⚠️ No KYC</span>';
            }
            setResult({
                visible: true, loading: false,
                icon: '📋', status: 'Ready to Check In', statusClass: 'loading',
                address,
                detail: `<div style="margin-bottom:8px;">${kycBadge}</div>Ready to check in for <b>${ev.name}</b>?`,
                showCheckin: true,
            });
        } catch {
            setResult({
                visible: true, loading: false,
                icon: '❌', status: 'Error', statusClass: 'error',
                address,
                detail: 'Failed to verify address. Check API connection.',
                showCheckin: false,
            });
        }
    }

    async function doCheckin() {
        if (!selectedEvent || !pendingAddress) return;

        setResult((r) => ({ ...r, loading: true, showCheckin: false, status: 'Checking In…', icon: '' }));

        try {
            const data = await checkInByAddress(pendingAddress, selectedEvent.name, 50);
            onScanLogged({ address: pendingAddress, eventName: selectedEvent.name, success: data.success, error: data.error, txHash: data.txHash });

            if (data.success) {
                setResult({
                    visible: true, loading: false,
                    icon: '✅', status: 'Check-in Successful!', statusClass: 'success',
                    address: pendingAddress,
                    detail: `<b>${selectedEvent.name}</b><br/>Attendee checked in & reputation awarded 🎉<br/><small style="color:var(--muted)">Tx: ${(data.txHash as string)?.slice(0, 20)}…</small>`,
                    showCheckin: false,
                });
            } else {
                setResult({
                    visible: true, loading: false,
                    icon: '❌', status: 'Check-in Failed', statusClass: 'error',
                    address: pendingAddress,
                    detail: data.error || 'Unknown error occurred.',
                    showCheckin: false,
                });
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Network error';
            onScanLogged({ address: pendingAddress, eventName: selectedEvent.name, success: false, error: msg });
            setResult({
                visible: true, loading: false,
                icon: '❌', status: 'Network Error', statusClass: 'error',
                address: pendingAddress,
                detail: msg,
                showCheckin: false,
            });
        }
    }

    function closeResult() {
        setResult(DEFAULT_RESULT);
        setTimeout(() => { lockedRef.current = false; }, 1200);
    }

    const statusColors = { success: 'var(--green)', error: 'var(--red)', loading: 'var(--amber)' };

    return (
        <div className="animate-fadeUp" style={{ padding: '0 16px 16px' }}>
            {/* Result Overlay */}
            {result.visible && (
                <div className="animate-fadeIn" style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(10,10,15,0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 24,
                }}>
                    <div className="animate-popIn" style={{
                        background: 'var(--glass-b)', border: '1px solid var(--border)',
                        borderRadius: 24, padding: '28px 24px',
                        width: '100%', maxWidth: 380, textAlign: 'center',
                    }}>
                        {/* Icon / Spinner */}
                        {result.loading && !result.icon
                            ? <div style={{
                                width: 40, height: 40, margin: '0 auto 16px',
                                border: '3px solid rgba(124,58,237,0.2)',
                                borderTopColor: 'var(--accent2)',
                                borderRadius: '50%',
                            }} className="animate-spin" />
                            : result.icon
                                ? <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>{result.icon}</div>
                                : null
                        }

                        {/* Status */}
                        <div style={{
                            fontSize: 20, fontWeight: 700, marginBottom: 8,
                            color: statusColors[result.statusClass],
                        }}>
                            {result.status}
                        </div>

                        {/* Address */}
                        {result.address && (
                            <div style={{
                                fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all',
                                marginBottom: 16, padding: '8px 12px',
                                background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontFamily: 'monospace',
                            }}>
                                {result.address.slice(0, 10)}…{result.address.slice(-8)}
                            </div>
                        )}

                        {/* Detail */}
                        <div
                            style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}
                            dangerouslySetInnerHTML={{ __html: result.detail }}
                        />

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={closeResult} style={{
                                padding: '12px 28px',
                                background: 'var(--glass-b)', border: '1px solid var(--border)',
                                borderRadius: 12, color: 'var(--text)',
                                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
                                cursor: 'pointer',
                            }}>Close</button>
                            {result.showCheckin && (
                                <button onClick={doCheckin} style={{
                                    padding: '12px 28px',
                                    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                                    border: 'none', borderRadius: 12, color: '#fff',
                                    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
                                    cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                                }}>Check In ✓</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Event Selector */}
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                Selected Event
            </p>
            <div style={{
                background: 'var(--glass)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border)',
                borderRadius: 18, padding: 18, marginBottom: 12,
            }}>
                <div style={{ position: 'relative' }}>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value === '' ? '' : parseInt(e.target.value))}
                        style={{
                            width: '100%', padding: '13px 38px 13px 14px',
                            background: 'var(--glass-b)', border: '1px solid var(--border)',
                            borderRadius: 12, color: 'var(--text)',
                            fontFamily: 'Inter, sans-serif', fontSize: 14,
                            appearance: 'none', WebkitAppearance: 'none',
                            outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="">— Choose an event to scan for —</option>
                        {events.map((ev) => (
                            <option key={ev.id} value={ev.id} style={{ background: '#12121c' }}>
                                {ev.image} {ev.name}
                            </option>
                        ))}
                    </select>
                    <span style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)', color: 'var(--muted)',
                        pointerEvents: 'none', fontSize: 14,
                    }}>▾</span>
                </div>

                {/* Selected event info */}
                {selectedEvent && (
                    <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 28 }}>{selectedEvent.image}</span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedEvent.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    📍 {selectedEvent.location} · 📅 {selectedEvent.date} · {selectedEvent.price}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                            {[
                                { label: `🎟 ${selectedEvent.ticketsMinted}/${selectedEvent.maxTickets} sold`, cls: 'purple' },
                                { label: `✅ ${selectedEvent.ticketsCheckedIn} checked in`, cls: 'green' },
                                ...(selectedEvent.requiresKyc ? [{ label: '🔒 KYC Required', cls: 'amber' }] : []),
                            ].map((b) => (
                                <span key={b.label} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    background: b.cls === 'purple' ? 'rgba(124,58,237,0.2)'
                                        : b.cls === 'green' ? 'rgba(34,197,94,0.15)'
                                            : 'rgba(245,158,11,0.15)',
                                    color: b.cls === 'purple' ? 'var(--accent2)'
                                        : b.cls === 'green' ? 'var(--green)'
                                            : 'var(--amber)',
                                }}>{b.label}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Viewfinder */}
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                Scan Wallet QR
            </p>
            <div style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden',
                aspectRatio: '1', width: '100%', maxWidth: 360,
                margin: '0 auto 16px',
                boxShadow: '0 0 0 3px var(--border), 0 0 40px rgba(124,58,237,0.2)',
                background: '#000',
            }}>
                <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Scan line */}
                {cameraActive && (
                    <div style={{
                        position: 'absolute', left: '10%', right: '10%', height: 2,
                        background: 'linear-gradient(90deg, transparent, var(--accent2), var(--teal), var(--accent2), transparent)',
                        borderRadius: 2, filter: 'drop-shadow(0 0 6px var(--accent2))',
                        pointerEvents: 'none',
                    }} className="animate-scan" />
                )}

                {/* Corners */}
                {[
                    { top: 10, left: 10 },
                    { top: 10, right: 10 },
                    { bottom: 10, left: 10 },
                    { bottom: 10, right: 10 },
                ].map((pos, i) => (
                    <div key={i} style={{
                        position: 'absolute', width: 28, height: 28, pointerEvents: 'none',
                        ...pos,
                        borderTop: pos.top !== undefined ? '3px solid var(--accent2)' : undefined,
                        borderBottom: pos.bottom !== undefined ? '3px solid var(--accent2)' : undefined,
                        borderLeft: pos.left !== undefined ? '3px solid var(--accent2)' : undefined,
                        borderRight: pos.right !== undefined ? '3px solid var(--accent2)' : undefined,
                        borderRadius: pos.top !== undefined
                            ? (pos.left !== undefined ? '4px 0 0 0' : '0 4px 0 0')
                            : (pos.left !== undefined ? '0 0 0 4px' : '0 0 4px 0'),
                    }} />
                ))}
            </div>

            {/* Hint */}
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
                {cameraActive
                    ? <>Scanning for QR codes… <strong style={{ color: 'var(--text)' }}>aim at wallet address</strong></>
                    : <>Point the camera at the attendee&apos;s<br /><strong style={{ color: 'var(--text)' }}>MetaMask wallet QR code</strong></>
                }
            </p>

            {/* Camera Button */}
            <button onClick={toggleCamera} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: 14,
                background: cameraActive
                    ? 'linear-gradient(135deg, #374151, #1f2937)'
                    : 'linear-gradient(135deg, var(--accent), var(--teal))',
                border: 'none', borderRadius: 14, color: '#fff',
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: cameraActive ? 'none' : '0 4px 24px rgba(124,58,237,0.35)',
                transition: 'opacity 0.2s',
            }}>
                {cameraActive ? '⏹ Stop Camera' : '▶ Start Camera'}
            </button>
        </div>
    );
}

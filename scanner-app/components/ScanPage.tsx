'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RaceEvent } from '@/lib/types';
import { checkKYC, checkInByAddress } from '@/lib/api';

// ── Icons ─────────────────────────────────────────────────
const CheckCircleIcon = () => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" stroke="var(--green)" strokeWidth="1.7" />
        <polyline points="8 12 11 15 16 9" stroke="var(--green)" strokeWidth="2.1" />
    </svg>
);
const XCircleIcon = () => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="1.7" />
        <line x1="15" y1="9" x2="9" y2="15" stroke="var(--red)" strokeWidth="2.1" />
        <line x1="9" y1="9" x2="15" y2="15" stroke="var(--red)" strokeWidth="2.1" />
    </svg>
);
const AlertIcon = () => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" stroke="var(--amber)" strokeWidth="1.7" />
        <line x1="12" y1="8" x2="12" y2="12" stroke="var(--amber)" strokeWidth="2.1" />
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="var(--amber)" strokeWidth="2.8" />
    </svg>
);
const ClipboardIcon = () => (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="var(--accent-dark)" strokeWidth="1.7" />
        <rect x="8" y="2" width="8" height="4" rx="1.5" stroke="var(--accent-dark)" strokeWidth="1.7" />
    </svg>
);
const CameraIcon = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);
const StopIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
);
const ShieldIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const LocationIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
);
const CalendarIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const TicketIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a1 1 0 000 2 2 2 0 012 2H2a1 1 0 000 2h20a1 1 0 000-2h-2a2 2 0 012-2 1 1 0 000-2H2z" />
    </svg>
);
const CheckInIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const LockIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);
const ChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// ── Types ─────────────────────────────────────────────────
type IconType = 'success' | 'error' | 'warning' | 'clipboard' | '';

interface ResultState {
    visible: boolean; loading: boolean;
    iconType: IconType; status: string;
    statusClass: 'success' | 'error' | 'loading';
    address: string; detail: string;
    kycVerified: boolean | null; showCheckin: boolean;
}

const DEFAULT_RESULT: ResultState = {
    visible: false, loading: false, iconType: '', status: '', statusClass: 'loading',
    address: '', detail: '', kycVerified: null, showCheckin: false,
};

interface Props {
    events: RaceEvent[];
    onToast: (msg: string) => void;
}

const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.9px',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
};

const card: React.CSSProperties = {
    background: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: 16,
};

export default function ScanPage({ events, onToast }: Props) {
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

    useEffect(() => { return () => stopCamera(); }, []); // eslint-disable-line

    async function toggleCamera() {
        if (cameraActive) stopCamera(); else await startCamera();
    }

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
            setCameraActive(true);
            intervalRef.current = setInterval(scanFrame, 250);
        } catch (e: unknown) {
            onToast('Camera error: ' + (e instanceof Error ? e.message : 'Unknown error'));
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
        const video = videoRef.current, canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth) return;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        import('jsqr').then(({ default: jsQR }) => {
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
            if (code?.data) handleQR(code.data);
        });
    }

    function handleQR(raw: string) {
        const address = raw.trim().replace(/^ethereum:/i, '').split('?')[0].split('@')[0];
        if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return;
        lockedRef.current = true;
        if ('vibrate' in navigator) navigator.vibrate([60, 30, 60]);

        if (!selectedEvent) {
            setResult({ visible: true, loading: false, iconType: 'warning', status: 'No Event Selected', statusClass: 'loading', address, detail: 'Choose an event before scanning.', kycVerified: null, showCheckin: false });
            return;
        }
        setPendingAddress(address);
        setResult({ visible: true, loading: true, iconType: '', status: 'Verifying…', statusClass: 'loading', address, detail: `Checking ticket for ${selectedEvent.name}`, kycVerified: null, showCheckin: false });
        fetchKYCThenShow(address, selectedEvent);
    }

    async function fetchKYCThenShow(address: string, ev: RaceEvent) {
        try {
            const kycD = await checkKYC(address);
            setResult({ visible: true, loading: false, iconType: 'clipboard', status: 'Ready to Check In', statusClass: 'loading', address, detail: `Ready to check in for ${ev.name}`, kycVerified: kycD.success ? kycD.isVerified : null, showCheckin: true });
        } catch {
            setResult({ visible: true, loading: false, iconType: 'error', status: 'Verification Failed', statusClass: 'error', address, detail: 'Failed to verify address. Check API connection.', kycVerified: null, showCheckin: false });
        }
    }

    async function doCheckin() {
        if (!selectedEvent || !pendingAddress) return;
        setResult((r) => ({ ...r, loading: true, showCheckin: false, status: 'Checking In…', iconType: '' }));
        try {
            const data = await checkInByAddress(pendingAddress, selectedEvent.name, 50);
            if (data.success) {
                setResult({ visible: true, loading: false, iconType: 'success', status: 'Check-in Successful', statusClass: 'success', address: pendingAddress, detail: `${selectedEvent.name} · Reputation awarded · Tx: ${(data.txHash as string)?.slice(0, 18)}…`, kycVerified: null, showCheckin: false });
            } else {
                setResult({ visible: true, loading: false, iconType: 'error', status: 'Check-in Failed', statusClass: 'error', address: pendingAddress, detail: data.error || 'Unknown error.', kycVerified: null, showCheckin: false });
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Network error';
            setResult({ visible: true, loading: false, iconType: 'error', status: 'Network Error', statusClass: 'error', address: pendingAddress, detail: msg, kycVerified: null, showCheckin: false });
        }
    }

    function closeResult() {
        setResult(DEFAULT_RESULT);
        setTimeout(() => { lockedRef.current = false; }, 1200);
    }

    const statusColors: Record<ResultState['statusClass'], string> = {
        success: 'var(--green)', error: 'var(--red)', loading: 'var(--foreground)',
    };

    const renderIcon = () => {
        if (result.loading && !result.iconType) {
            return (
                <div style={{
                    width: 40, height: 40, margin: '0 auto 20px',
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                }} className="animate-spin" />
            );
        }
        const map: Record<IconType, React.ReactNode> = {
            'success': <div style={{ marginBottom: 14 }}><CheckCircleIcon /></div>,
            'error': <div style={{ marginBottom: 14 }}><XCircleIcon /></div>,
            'warning': <div style={{ marginBottom: 14 }}><AlertIcon /></div>,
            'clipboard': <div style={{ marginBottom: 14 }}><ClipboardIcon /></div>,
            '': null,
        };
        return map[result.iconType];
    };

    return (
        <div className="animate-fadeUp" style={{ padding: '16px' }}>

            {/* ── Result Modal ─────────────────────────────── */}
            {result.visible && (
                <div className="animate-fadeIn" style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(10,10,10,0.4)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 24,
                }}>
                    <div className="animate-popIn" style={{
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 24, padding: '28px 22px 22px',
                        width: '100%', maxWidth: 360, textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    }}>
                        {renderIcon()}

                        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px', color: statusColors[result.statusClass] }}>
                            {result.status}
                        </div>

                        {/* KYC badge */}
                        {result.kycVerified !== null && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    background: result.kycVerified ? 'var(--green-bg)' : 'var(--amber-bg)',
                                    color: result.kycVerified ? 'var(--green)' : 'var(--amber)',
                                    border: `1px solid ${result.kycVerified ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.2)'}`,
                                }}>
                                    <ShieldIcon />
                                    {result.kycVerified ? 'KYC Verified' : 'No KYC'}
                                </span>
                            </div>
                        )}

                        {/* Wallet */}
                        {result.address && (
                            <div style={{
                                fontSize: 12, color: 'var(--muted)',
                                marginBottom: 12, padding: '7px 12px',
                                background: 'var(--surface)', borderRadius: 9,
                                fontFamily: 'ui-monospace, monospace',
                                border: '1px solid var(--border)',
                            }}>
                                {result.address.slice(0, 10)}…{result.address.slice(-8)}
                            </div>
                        )}

                        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.65 }}>
                            {result.detail}
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button id="result-close-btn" onClick={closeResult} style={{
                                padding: '10px 22px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 11, color: 'var(--muted)',
                                fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                            }}>Dismiss</button>
                            {result.showCheckin && (
                                <button id="result-checkin-btn" onClick={doCheckin} style={{
                                    padding: '10px 22px',
                                    background: 'var(--accent)',
                                    border: 'none', borderRadius: 11, color: 'var(--foreground)',
                                    fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 3px 14px rgba(245,197,24,0.40)',
                                }}>Check In</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Event Selector ───────────────────────────── */}
            <p style={sectionLabel}>Event</p>
            <div style={{ ...card, padding: 14, marginBottom: 16 }}>
                <div style={{ position: 'relative' }}>
                    <select
                        id="event-selector"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value === '' ? '' : parseInt(e.target.value))}
                        style={{
                            width: '100%', padding: '11px 34px 11px 13px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 10, color: 'var(--foreground)',
                            fontFamily: 'inherit', fontSize: 14,
                            appearance: 'none', WebkitAppearance: 'none',
                            outline: 'none', cursor: 'pointer',
                        }}
                    >
                        <option value="">Choose an event to scan for</option>
                        {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                    </select>
                    <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
                        <ChevronDown />
                    </span>
                </div>

                {selectedEvent && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, letterSpacing: '-0.2px' }}>{selectedEvent.name}</div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted)', marginBottom: 9, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><LocationIcon /> {selectedEvent.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CalendarIcon /> {selectedEvent.date}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {[
                                { icon: <TicketIcon />, label: `${selectedEvent.ticketsMinted}/${selectedEvent.maxTickets} sold`, bg: 'rgba(245,197,24,0.12)', color: 'var(--accent-dark)' },
                                { icon: <CheckInIcon />, label: `${selectedEvent.ticketsCheckedIn} checked in`, bg: 'var(--green-bg)', color: 'var(--green)' },
                                ...(selectedEvent.requiresKyc ? [{ icon: <LockIcon />, label: 'KYC Required', bg: 'var(--amber-bg)', color: 'var(--amber)' }] : []),
                            ].map((b) => (
                                <span key={b.label} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    background: b.bg, color: b.color,
                                }}>{b.icon}{b.label}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Camera Viewfinder ─────────────────────────── */}
            <p style={sectionLabel}>Scan QR Code</p>
            <div style={{
                position: 'relative', borderRadius: 18, overflow: 'hidden',
                aspectRatio: '1', width: '100%', maxWidth: 360,
                margin: '0 auto 14px',
                border: '1px solid var(--border)',
                boxShadow: cameraActive ? '0 0 0 3px var(--accent), 0 6px 28px rgba(245,197,24,0.2)' : '0 2px 12px rgba(0,0,0,0.06)',
                background: '#111',
                transition: 'box-shadow 0.3s',
            }}>
                <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Scan line — gold */}
                {cameraActive && (
                    <div style={{
                        position: 'absolute', left: '8%', right: '8%', height: 2,
                        background: 'linear-gradient(90deg, transparent, var(--accent), #fff, var(--accent), transparent)',
                        borderRadius: 2,
                        filter: 'drop-shadow(0 0 6px var(--accent))',
                        pointerEvents: 'none',
                    }} className="animate-scan" />
                )}

                {/* Corner markers — gold */}
                {([
                    { top: 12, left: 12 },
                    { top: 12, right: 12 },
                    { bottom: 12, left: 12 },
                    { bottom: 12, right: 12 },
                ] as React.CSSProperties[]).map((pos, i) => (
                    <div key={i} style={{
                        position: 'absolute', width: 26, height: 26, pointerEvents: 'none',
                        ...pos,
                        borderTop: pos.top !== undefined ? '3px solid var(--accent)' : undefined,
                        borderBottom: pos.bottom !== undefined ? '3px solid var(--accent)' : undefined,
                        borderLeft: pos.left !== undefined ? '3px solid var(--accent)' : undefined,
                        borderRight: pos.right !== undefined ? '3px solid var(--accent)' : undefined,
                        borderRadius: pos.top !== undefined
                            ? (pos.left !== undefined ? '5px 0 0 0' : '0 5px 0 0')
                            : (pos.left !== undefined ? '0 0 0 5px' : '0 0 5px 0'),
                    }} />
                ))}
            </div>

            {/* Hint */}
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.65 }}>
                {cameraActive
                    ? <>Scanning · <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>aim at wallet QR code</span></>
                    : <>Point at attendee&apos;s <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>MetaMask QR code</span></>
                }
            </p>

            {/* Camera button */}
            <button id="camera-toggle-btn" onClick={toggleCamera} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: 14,
                background: cameraActive ? 'var(--surface-2)' : 'var(--accent)',
                border: cameraActive ? '1px solid var(--border)' : 'none',
                borderRadius: 14,
                color: cameraActive ? 'var(--foreground)' : 'var(--foreground)',
                fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: cameraActive ? 'none' : '0 4px 18px rgba(245,197,24,0.40)',
                transition: 'background 0.2s, box-shadow 0.2s',
            }}>
                {cameraActive ? <><StopIcon />&nbsp;Stop Camera</> : <><CameraIcon />&nbsp;Start Camera</>}
            </button>
        </div>
    );
}

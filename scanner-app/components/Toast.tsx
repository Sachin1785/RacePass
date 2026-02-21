'use client';

interface ToastProps {
    message: string;
    visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
    return (
        <div style={{
            position: 'fixed',
            bottom: 'calc(var(--nav-h) + var(--safe-bottom) + 16px)',
            left: '50%',
            transform: `translateX(-50%) translateY(${visible ? '0' : '10px'})`,
            background: 'rgba(30,30,45,0.95)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 18px',
            fontSize: 13,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.25s, transform 0.25s',
            zIndex: 300,
            pointerEvents: 'none',
        }}>
            {message}
        </div>
    );
}

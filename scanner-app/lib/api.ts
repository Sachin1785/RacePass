// Base URL: set NEXT_PUBLIC_API_URL in .env.local to override the default localhost address.
// Example .env.local:
//   NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
export const API =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3005';

export const NGROK_HEADERS: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
};

export async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            // Only add ngrok headers if using ngrok (not localhost)
            ...(API.includes('ngrok') ? NGROK_HEADERS : {}),
            ...(options.headers || {}),
        },
    });
    return res.json();
}

export async function checkAPIHealth(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${API}/api/events`, {
            signal: controller.signal,
            headers: API.includes('ngrok') ? NGROK_HEADERS : {},
        });
        clearTimeout(timeout);
        return res.ok;
    } catch {
        return false;
    }
}

export async function loadEvents() {
    return apiFetch('/api/events');
}

export async function loadEventDetail(eventId: number) {
    return apiFetch(`/api/events/${eventId}`);
}

export async function checkKYC(address: string) {
    return apiFetch(`/api/kyc/status/${address}`);
}

export async function checkInByAddress(address: string, eventName: string, reputationValue = 50) {
    return apiFetch('/api/tickets/check-in-by-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, eventName, reputationValue }),
    });
}

/** Returns { success, hasEmbedding } — fast pre-check before opening face camera */
export async function checkFaceEmbedding(address: string) {
    return apiFetch(`/api/face/has-embedding/${address}`);
}

/** Sends a base64 frame to the backend and returns { success, isMatch, confidence, distance } */
export async function verifyFace(address: string, liveImageBase64: string) {
    return apiFetch('/api/face/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, liveImageBase64 }),
    });
}

export const API = 'https://unremarked-zonally-harold.ngrok-free.dev';

export const NGROK_HEADERS: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
};

export async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            ...NGROK_HEADERS,
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
            headers: NGROK_HEADERS,
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

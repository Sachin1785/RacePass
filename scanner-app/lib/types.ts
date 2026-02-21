export interface RaceEvent {
    id: number;
    name: string;
    date: string;
    location: string;
    description: string;
    price: string;
    image: string;
    requiresKyc: boolean;
    minAge: number;
    minReputation: number;
    ticketsMinted: number;
    ticketsCheckedIn: number;
    maxTickets: number;
    isActive: boolean;
}

export interface EventDetail {
    event: RaceEvent;
    attendees: Attendee[];
    stats: {
        totalMinted: number;
        totalCheckedIn: number;
        attendanceRate: string;
    };
}

export interface Attendee {
    owner_address: string;
    minted_at: string;
}

export interface ScanHistoryEntry {
    id: string;
    address: string;
    eventName: string;
    success: boolean;
    error?: string;
    txHash?: string;
    time: Date;
}

export type PageId = 'scan' | 'events' | 'history';

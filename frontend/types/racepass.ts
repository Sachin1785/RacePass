export interface RacePassIdentity {
  tokenId: string;
  activeReputation: string;
  baseReputation: string;
  isOver18: boolean;
  isKycVerified: boolean;
  isRevoked: boolean;
  lastUpdate: string;
}

export interface RacePassTicket {
  dbId: number;
  onChainId: string;
  txHash: string;
  mintedAt: string;
  isCheckedIn: boolean;
  eventName: string;
}

export interface ReputationLog {
  id: number;
  token_id: string;
  amount: number;
  type: 'add' | 'deduct';
  reason: string;
  tx_hash: string;
  created_at: string;
}

export interface VerifiableAttestation {
  uid: string;
  eventName: string;
  reputationValue: number;
  issuedAt: string;
  payload: any;
}

export interface RacePassProfile {
  success: boolean;
  wallet: string;
  identity: RacePassIdentity | null;
  tickets: RacePassTicket[];
  reputationHistory: ReputationLog[];
  verifiableAttestations: VerifiableAttestation[];
}

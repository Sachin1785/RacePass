// Type definitions for KYC data structures

export interface KycFormData {
  fullName: string;
  address: string;
  dateOfBirth: string;
  idImage: FileList;
  selfieImage: FileList;
}

export interface KycSubmitData {
  fullName: string;
  address: string;
  dateOfBirth: string;
  idDocument: string; // Base64 encoded
  selfie: string; // Base64 encoded
}

export interface KycResponse {
  success: boolean;
  credentialId?: string;
  credential?: VerifiableCredential;
  error?: string;
  message?: string;
}

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: {
    id: string;
    name?: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string; // User's wallet address or DID
    kycVerified: boolean;
    verificationLevel?: string;
    dateOfBirth?: string;
    isAdult?: boolean;
    country?: string;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws?: string;
  };
}

export type KycStatus = 'not-started' | 'pending' | 'verified' | 'rejected' | 'expired';

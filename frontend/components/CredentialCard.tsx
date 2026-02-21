'use client';

import type { VerifiableCredential } from '@/types/kyc';

interface CredentialCardProps {
  credential: VerifiableCredential;
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const isExpired = credential.expirationDate
    ? new Date(credential.expirationDate) < new Date()
    : false;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">KYC Credential</h3>
          <p className="text-sm text-blue-100 mt-1">
            {credential.issuer.name || 'Identity Provider'}
          </p>
        </div>
        {!isExpired ? (
          <span className="inline-flex items-center rounded-full bg-green-400 px-3 py-1 text-xs font-medium text-green-900">
            ✓ Verified
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-400 px-3 py-1 text-xs font-medium text-red-900">
            Expired
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-blue-200">Credential Type</p>
          <p className="text-sm font-medium">
            {credential.type.filter((t) => t !== 'VerifiableCredential').join(', ')}
          </p>
        </div>

        {credential.credentialSubject.isAdult !== undefined && (
          <div>
            <p className="text-xs text-blue-200">Age Status</p>
            <p className="text-sm font-medium">
              {credential.credentialSubject.isAdult ? '18+ years' : 'Under 18'}
            </p>
          </div>
        )}

        {credential.credentialSubject.verificationLevel && (
          <div>
            <p className="text-xs text-blue-200">Verification Level</p>
            <p className="text-sm font-medium capitalize">
              {credential.credentialSubject.verificationLevel}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-blue-500 pt-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-blue-200">Issued</p>
            <p className="font-medium">
              {new Date(credential.issuanceDate).toLocaleDateString()}
            </p>
          </div>
          {credential.expirationDate && (
            <div>
              <p className="text-blue-200">Expires</p>
              <p className="font-medium">
                {new Date(credential.expirationDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-500">
        <p className="text-xs text-blue-200 mb-1">Credential ID</p>
        <p className="text-xs font-mono break-all opacity-75">
          {credential.credentialSubject.id}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { RacePassProfile } from '@/types/racepass';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

export function useRacePassProfile() {
  const { address, isConnected } = useAccount();

  return useQuery<RacePassProfile>({
    queryKey: ['racepass-profile', address],
    queryFn: async () => {
      if (!address) throw new Error('No address connected');
      
      const response = await fetch(`${BACKEND_URL}/api/user/${address.toLowerCase()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000, // Poll every 10 seconds for live reputation/ticket updates
    staleTime: 5000,
  });
}

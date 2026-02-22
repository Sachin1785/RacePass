'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWallet } from './ConnectWallet';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/events',
    label: 'Events',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    href: '/kyc',
    label: 'KYC Verification',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    href: '/credentials',
    label: 'Credentials',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
  {
    href: '/verify',
    label: 'Verify Identity',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: profile } = useRacePassProfile();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-2 overflow-y-auto bg-white border-r border-gray-200 px-5 pb-6 pt-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-6 group">
          <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shadow-sm group-hover:shadow-yellow-400/40 transition-shadow">
            <span className="text-black font-black text-base">R</span>
          </div>
          <div>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              Race<span className="text-yellow-500">Pass</span>
            </span>
            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase -mt-0.5">
              Web3 Racing ID
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                  ? 'bg-yellow-400 text-black shadow-sm'
                  : 'text-gray-500 hover:bg-yellow-50 hover:text-gray-900'
                  }`}
              >
                <span className={isActive ? 'text-black' : 'text-gray-400 group-hover:text-yellow-500'}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black/30" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* KYC Status */}
        {profile?.identity && (
          <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-widest">
                {profile.identity.isKycVerified ? '✓ Verified' : '⚠ Pending'}
              </span>
            </div>
            <p className="text-[10px] text-yellow-600 mt-0.5">
              RacePass #{profile.identity.tokenId}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <ConnectWallet />
        </div>
      </div>
    </aside>
  );
}

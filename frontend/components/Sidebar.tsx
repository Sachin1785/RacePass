'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWallet } from './ConnectWallet';
import { motion } from 'framer-motion';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';

export function Sidebar() {
  const pathname = usePathname();
  const { data: profile } = useRacePassProfile();

  const links = [
    { href: '/events', label: 'Events', icon: '🎟️' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/credentials', label: 'Credentials', icon: '🛡️' },
    { href: '/verify', label: 'Verify', icon: '🔍' },
    { href: '/kyc', label: 'KYC', icon: '✓', highlight: !profile?.identity?.isKycVerified },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-amber-100 px-6 pb-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 pt-8 pb-4 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-black text-lg">R</span>
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900 tracking-tight block leading-none">
                Race<span className="text-amber-500">Pass</span>
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Universal ID
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                      : 'text-gray-600 hover:bg-amber-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="uppercase tracking-wider">{link.label}</span>
                  {link.highlight && (
                    <span className="ml-auto flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}

            {/* KYC Status Badge */}
            {profile?.identity && (
              <div className="mt-auto mb-4 p-4 rounded-2xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full ${profile.identity.isKycVerified ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Identity Status
                  </span>
                </div>
                <p className="text-sm font-black text-gray-900 mb-1">
                  {profile.identity.isKycVerified ? 'Verified' : 'Not Verified'}
                </p>
                <p className="text-xs font-bold text-amber-600">
                  Reputation: {profile.identity.activeReputation}
                </p>
              </div>
            )}

            {/* Connect Wallet */}
            <div className="mt-4">
              <ConnectWallet />
            </div>
          </nav>
        </div>
      </motion.aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-amber-100 bg-white/95 backdrop-blur-md px-4 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">R</span>
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">
            Race<span className="text-amber-500">Pass</span>
          </span>
        </Link>
        <div className="ml-auto">
          <ConnectWallet />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-amber-100 px-2 py-2 shadow-lg">
        <div className="flex items-center justify-around">
          {links.slice(0, 5).map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-600'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-tight">{link.label}</span>
                {link.highlight && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

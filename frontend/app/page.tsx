'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useRacePassProfile } from '@/hooks/useRacePassProfile';

// ─── Animation Helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as any, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

// ─── Feature Cards ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: '🔒',
    title: 'Privacy-Preserving',
    desc: 'Zero-knowledge proofs verify eligibility without exposing sensitive personal data to the blockchain.',
  },
  {
    icon: '🔄',
    title: 'Reusable Credentials',
    desc: 'Complete verification once, reuse across any platform. No more repetitive KYC friction.',
  },
  {
    icon: '🌐',
    title: 'Cross-Platform',
    desc: 'Portable identity that works across blockchains and platforms by design.',
  },
];

// ─── Steps ─────────────────────────────────────────────────────────────────────
const steps = [
  { n: 1, title: 'Connect Wallet', desc: 'Link MetaMask or any Web3 wallet in seconds.' },
  { n: 2, title: 'Complete KYC', desc: 'Submit documents once to our trusted verification partner.' },
  { n: 3, title: 'Get Credential', desc: 'Receive a verifiable credential stored in your wallet.' },
  { n: 4, title: 'Use Everywhere', desc: 'Access events and platforms without repeating steps.' },
];

// ─── Stats ──────────────────────────────────────────────────────────────────────
const stats = [
  { value: '50K+', label: 'Verified Users' },
  { value: '120+', label: 'Partner Events' },
  { value: '< 2min', label: 'Avg KYC Time' },
  { value: '0', label: 'Data on Chain' },
];

export default function Home() {
  const { isConnected } = useAccount();
  const { data: profile } = useRacePassProfile();

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-b from-amber-50 via-white to-white">
        {/* Subtle grid bg */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #f59e0b22 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-175 h-100 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-10 lg:pt-28 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <motion.div {...fadeUp(0)}>
              {/* Badge */}
              <motion.div {...fadeIn(0.1)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Universal Digital Identity
                </span>
              </motion.div>

              <motion.h1 {...fadeUp(0.05)} className="text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight">
                One KYC.{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-amber-500">Everywhere.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M0 6 Q100 0 200 6" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p {...fadeUp(0.1)} className="mt-5 text-lg text-gray-500 leading-relaxed max-w-md">
                RacePass creates a privacy-preserving digital identity that works across platforms and blockchains — complete verification once, done forever.
              </motion.p>

              <motion.div {...fadeUp(0.18)} className="mt-8 flex flex-wrap items-center gap-3">
                {isConnected && !profile?.identity?.isKycVerified ? (
                  <Link
                    href="/kyc"
                    className="rounded-xl bg-amber-400 hover:bg-amber-500 px-7 py-3 text-sm font-bold text-white shadow-md shadow-amber-200 hover:shadow-amber-300 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Complete KYC →
                  </Link>
                ) : isConnected && profile?.identity?.isKycVerified ? (
                  <Link
                    href="/dashboard"
                    className="rounded-xl bg-green-500 hover:bg-green-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-green-200 hover:shadow-green-300 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Go to Dashboard →
                  </Link>
                ) : (
                  <span className="rounded-xl bg-amber-400 px-7 py-3 text-sm font-bold text-white opacity-60 cursor-not-allowed">
                    Connect wallet to start
                  </span>
                )}
                <Link
                  href="/events"
                  className="rounded-xl border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-200 px-7 py-3 text-sm font-semibold text-gray-700 transition-all duration-200"
                >
                  Browse Events
                </Link>
              </motion.div>

              {/* Trust bar */}
              <motion.div {...fadeIn(0.3)} className="mt-8 flex items-center gap-3 text-xs text-gray-400">
                <div className="flex -space-x-2">
                  {['bg-amber-300', 'bg-yellow-400', 'bg-orange-300', 'bg-amber-500'].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white`} />
                  ))}
                </div>
                <span>Trusted by <strong className="text-gray-600">50,000+</strong> verified users</span>
              </motion.div>
            </motion.div>

            {/* Right: Identity Card mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Card */}
              <div className="relative w-full max-w-sm">
                {/* Shadow card behind */}
                <div className="absolute top-3 left-3 w-full h-full rounded-2xl bg-amber-200/60" />
                <div className="relative rounded-2xl bg-linear-to-br from-amber-400 to-amber-500 p-6 shadow-2xl shadow-amber-300/40 text-white">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-amber-100 mb-1">RacePass ID</p>
                      <p className="text-2xl font-black">#3</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏎️</div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-white/15 rounded-xl p-3">
                      <p className="text-xs text-amber-100 mb-0.5">Reputation</p>
                      <p className="text-2xl font-black">150</p>
                      <p className="text-xs text-amber-200 font-medium">EXCELLENT</p>
                    </div>
                    <div className="bg-white/15 rounded-xl p-3">
                      <p className="text-xs text-amber-100 mb-0.5">Status</p>
                      <p className="text-sm font-bold mt-1">✅ Verified</p>
                      <p className="text-xs text-amber-200">Age 18+</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-white/10 rounded-xl px-3 py-2">
                    <p className="text-xs text-amber-100 mb-0.5">Wallet</p>
                    <p className="text-xs font-mono font-semibold truncate">0x29a0...e95b</p>
                  </div>

                  {/* Credentials pills */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Formula E 2026', 'Tech Conf 2026'].map((c) => (
                      <span key={c} className="text-xs bg-white/20 rounded-full px-3 py-1 font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 260 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg shadow-gray-200/60 px-4 py-3 flex items-center gap-2 border border-amber-100"
              >
                <span className="text-lg">🔒</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Privacy First</p>
                  <p className="text-xs text-gray-400">ZK-proof verified</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
      <section className="border-y border-amber-100 bg-amber-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp()}>
                <p className="text-3xl font-black text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-sm text-gray-500 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <motion.div {...fadeUp()} viewport={{ once: true }} whileInView="animate" initial="initial" className="mb-12 text-center">
          <p className="text-xs uppercase tracking-widest font-bold text-amber-500 mb-2">Why RacePass</p>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900">Built for the decentralised world</h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp()}
              className="group relative rounded-2xl border border-gray-100 bg-white p-6 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/40 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon bg glow on hover */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 group-hover:bg-amber-100 text-2xl transition-colors duration-200">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-amber-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="bg-linear-to-b from-amber-50/60 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} initial="initial" whileInView="animate" viewport={{ once: true }} className="mb-12 text-center">
            <p className="text-xs uppercase tracking-widest font-bold text-amber-500 mb-2">Simple Process</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">Up and running in minutes</h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-5 relative"
          >
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-amber-100 z-0" />

            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp()}
                className="relative z-10 flex flex-col items-center text-center bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-200 hover:shadow-md hover:shadow-amber-50 transition-all duration-200"
              >
                <div className="mb-3 w-12 h-12 rounded-full bg-amber-400 text-white font-black text-lg flex items-center justify-center shadow-md shadow-amber-200">
                  {s.n}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── IMAGE / PLATFORM SHOWCASE ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <p className="text-xs uppercase tracking-widest font-bold text-amber-500 mb-2">Explore</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Access world-class events with a single pass
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-md">
              From Formula E championships to tech conferences — once verified, your RacePass credential unlocks access without re-submitting documents.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-200 transition-all duration-200 hover:-translate-y-0.5"
            >
              Browse Events →
            </Link>
          </motion.div>

          {/* Image placeholder grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { label: 'Formula E Championship', tag: 'Racing', color: 'from-amber-400 to-orange-500' },
              { label: 'Tech Conference 2026', tag: 'Technology', color: 'from-yellow-300 to-amber-400' },
              { label: 'Music Festival', tag: 'Entertainment', color: 'from-amber-300 to-yellow-400' },
              { label: 'Sports Summit', tag: 'Sports', color: 'from-orange-400 to-amber-500' },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${item.color} aspect-4/3 flex flex-col justify-end p-4 shadow-md`}
              >
                {/* Placeholder: replace with <Image src="..." fill alt={item.label} className="object-cover" /> */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'2\' fill=\'white\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider mb-0.5">{item.tag}</span>
                <span className="text-sm font-black text-white leading-tight">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-400 to-amber-500 p-10 md:p-14 text-center shadow-2xl shadow-amber-200/50"
        >
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to own your identity?
          </h2>
          <p className="text-amber-100 text-base mb-8 max-w-xl mx-auto">
            Join thousands of users who&apos;ve made KYC a one-time event. Connect your wallet and get verified today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/kyc"
              className="rounded-xl bg-white text-amber-600 hover:bg-amber-50 px-8 py-3 text-sm font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
            <Link
              href="/events"
              className="rounded-xl border-2 border-white/40 text-white hover:border-white/80 hover:bg-white/10 px-8 py-3 text-sm font-bold transition-all duration-200"
            >
              Browse Events
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-amber-100 bg-amber-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center">
              <span className="text-white font-black text-xs">R</span>
            </div>
            <span className="text-sm font-bold text-gray-700">Race<span className="text-amber-500">Pass</span></span>
          </div>
          <p className="text-xs text-gray-400">© 2026 RacePass. Your data never touches the chain.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="#" className="hover:text-amber-500 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-amber-500 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-amber-500 transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
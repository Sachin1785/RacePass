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
    icon: 'shield',
    title: 'Privacy-Preserving',
    desc: 'Zero-knowledge proofs verify eligibility without exposing sensitive personal data to the blockchain.',
  },
  {
    icon: 'repeat',
    title: 'Reusable Credentials',
    desc: 'Complete verification once, reuse across any platform. No more repetitive KYC friction.',
  },
  {
    icon: 'globe',
    title: 'Cross-Platform',
    desc: 'Portable identity that works across blockchains and platforms by design.',
  },
];

const FeatureIcon = ({ name }: { name: string }) => {
  return null;
};

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
      <section className="relative overflow-hidden bg-white">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #f5c51833 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-10 lg:pt-28 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <motion.div {...fadeUp(0)}>
              {/* Badge */}
              <motion.div {...fadeIn(0.1)} className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
                  Universal Digital Identity
                </span>
              </motion.div>

              <motion.h1 {...fadeUp(0.05)} className="text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight">
                One KYC.{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-yellow-500">Everywhere.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M0 6 Q100 0 200 6" stroke="#f5c518" strokeWidth="3" strokeLinecap="round" />
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
                    className="rounded-xl bg-yellow-400 hover:bg-yellow-300 px-7 py-3 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Complete KYC →
                  </Link>
                ) : isConnected && profile?.identity?.isKycVerified ? (
                  <Link
                    href="/dashboard"
                    className="rounded-xl bg-yellow-400 hover:bg-yellow-300 px-7 py-3 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Go to Dashboard →
                  </Link>
                ) : (
                  <span className="rounded-xl bg-yellow-400/50 px-7 py-3 text-sm font-bold text-black opacity-60 cursor-not-allowed">
                    Connect wallet to start
                  </span>
                )}
                <Link
                  href="/events"
                  className="rounded-xl border border-gray-200 bg-white hover:bg-yellow-50 hover:border-yellow-300 px-7 py-3 text-sm font-semibold text-gray-700 transition-all duration-200"
                >
                  Browse Events
                </Link>
              </motion.div>

              {/* Trust bar */}
              <motion.div {...fadeIn(0.3)} className="mt-8 flex items-center gap-3 text-xs text-gray-500">
                <div className="flex -space-x-2">
                  {['bg-yellow-400', 'bg-yellow-300', 'bg-yellow-500', 'bg-yellow-200'].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white`} />
                  ))}
                </div>
                <span>Trusted by <strong className="text-gray-800">50,000+</strong> verified users</span>
              </motion.div>
            </motion.div>

            {/* Right: Blockchain robot illustration */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-md">
                <div className="relative rounded-3xl border border-yellow-300/30 bg-white/80 p-8 shadow-2xl shadow-yellow-400/10 backdrop-blur">

                  <svg
                    viewBox="0 0 420 320"
                    className="w-full"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="cubeTop" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#fff4b0" />
                        <stop offset="100%" stopColor="#facc15" />
                      </linearGradient>
                      <linearGradient id="cubeLeft" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                      <linearGradient id="cubeRight" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>

                    {/* Connectors */}
                    <g fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
                      <path d="M170 84 L130 132" />
                      <path d="M210 84 L250 132" />
                      <path d="M130 156 L170 244" />
                      <path d="M250 156 L210 244" />
                    </g>

                    {/* Top cube */}
                    <g>
                      <polygon points="190,48 230,72 190,96 150,72" fill="url(#cubeTop)" />
                      <polygon points="150,72 190,96 190,140 150,116" fill="url(#cubeLeft)" />
                      <polygon points="230,72 190,96 190,140 230,116" fill="#ffffff" />
                    </g>

                    {/* Left cube */}
                    <g>
                      <polygon points="110,120 150,144 110,168 70,144" fill="url(#cubeTop)" />
                      <polygon points="70,144 110,168 110,212 70,188" fill="url(#cubeLeft)" />
                      <polygon points="150,144 110,168 110,212 150,188" fill="#ffffff" />
                    </g>

                    {/* Right cube */}
                    <g>
                      <polygon points="270,120 310,144 270,168 230,144" fill="url(#cubeTop)" />
                      <polygon points="230,144 270,168 270,212 230,188" fill="url(#cubeLeft)" />
                      <polygon points="310,144 270,168 270,212 310,188" fill="#ffffff" />
                    </g>

                    {/* Bottom cube */}
                    <g>
                      <polygon points="190,208 230,232 190,256 150,232" fill="url(#cubeTop)" />
                      <polygon points="150,232 190,256 190,300 150,276" fill="url(#cubeLeft)" />
                      <polygon points="230,232 190,256 190,300 230,276" fill="#ffffff" />
                    </g>
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50">
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
                <p className="text-3xl font-black text-yellow-500">{s.value}</p>
                <p className="mt-0.5 text-sm text-gray-500 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <motion.div {...fadeUp()} viewport={{ once: true }} whileInView="animate" initial="initial" className="mb-12 text-center">
          <p className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-2">Why RacePass</p>
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
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} initial="initial" whileInView="animate" viewport={{ once: true }} className="mb-12 text-center">
            <p className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-2">Simple Process</p>
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
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-yellow-300 z-0" />

            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp()}
                className="relative z-10 flex flex-col items-center text-center bg-white rounded-2xl border border-gray-200 p-5 hover:border-yellow-400 hover:shadow-md hover:shadow-yellow-400/10 transition-all duration-200"
              >
                <div className="mb-3 w-12 h-12 rounded-full bg-yellow-400 text-black font-black text-lg flex items-center justify-center shadow-md shadow-yellow-400/20">
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
            <p className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-2">Explore</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Access world-class events with a single pass
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-md">
              From Formula E championships to tech conferences — once verified, your RacePass credential unlocks access without re-submitting documents.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all duration-200 hover:-translate-y-0.5"
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
              { label: 'Formula E Championship', tag: 'Racing', color: 'from-yellow-400 to-yellow-600' },
              { label: 'Tech Conference 2026', tag: 'Technology', color: 'from-gray-800 to-gray-900 border border-yellow-400/20' },
              { label: 'Music Festival', tag: 'Entertainment', color: 'from-yellow-500/20 to-black border border-yellow-400/20' },
              { label: 'Sports Summit', tag: 'Sports', color: 'from-yellow-400 to-yellow-500' },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.color} aspect-4/3 flex flex-col justify-end p-4 shadow-md`}
              >
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
          className="relative overflow-hidden rounded-3xl bg-yellow-400 p-10 md:p-14 text-center shadow-2xl shadow-yellow-400/20"
        >
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.06) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
            Ready to own your identity?
          </h2>
          <p className="text-black/70 text-base mb-8 max-w-xl mx-auto">
            Join thousands of users who&apos;ve made KYC a one-time event. Connect your wallet and get verified today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/kyc"
              className="rounded-xl bg-black text-yellow-400 hover:bg-black/80 px-8 py-3 text-sm font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
            <Link
              href="/events"
              className="rounded-xl border-2 border-black/30 text-black hover:border-black/60 hover:bg-black/10 px-8 py-3 text-sm font-bold transition-all duration-200"
            >
              Browse Events
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-yellow-400 flex items-center justify-center">
              <span className="text-black font-black text-xs">R</span>
            </div>
            <span className="text-sm font-bold text-gray-700">Race<span className="text-yellow-500">Pass</span></span>
          </div>
          <p className="text-xs text-gray-400">© 2026 RacePass. Your data never touches the chain.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="#" className="hover:text-yellow-500 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-yellow-500 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-yellow-500 transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
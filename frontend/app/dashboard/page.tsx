"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRacePassProfile } from "@/hooks/useRacePassProfile";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";

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

export default function DashboardPage() {
  const { address, isConnected, isConnecting } = useAccount();
  const [isClient, setIsClient] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const router = useRouter();

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");

  // Fetch live on-chain profile data
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useRacePassProfile();

  // Wait for client-side hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Redirect unverified users to KYC
  useEffect(() => {
    if (isClient && !profileLoading && !profile?.identity?.isKycVerified) {
      router.push('/kyc');
    }
  }, [isClient, profileLoading, profile?.identity?.isKycVerified, router]);

  // No redirect logic - allow free navigation

  const handleTransferTicket = async () => {
    if (!selectedTicket || !transferRecipient || !address) return;

    if (!ethers.isAddress(transferRecipient)) {
      setTransferError("Invalid Ethereum address");
      return;
    }

    setIsTransferring(true);
    setTransferError("");

    try {
      if (!(window as any).ethereum) {
        throw new Error("MetaMask not installed");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const TICKET_ADDRESS = "0xb3BA57B6FEDb83030244e1fe6DB832dfC77B1c57";
      const ticketABI = [
        "function safeTransferFrom(address from, address to, uint256 tokenId)",
        "function ownerOf(uint256 tokenId) view returns (address)",
      ];

      const ticketContract = new ethers.Contract(
        TICKET_ADDRESS,
        ticketABI,
        signer,
      );
      const owner = await ticketContract.ownerOf(selectedTicket.onChainId);
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("You do not own this ticket");
      }

      const tx = await ticketContract.safeTransferFrom(
        address,
        transferRecipient,
        selectedTicket.onChainId,
      );

      await tx.wait();
      alert(
        `Ticket #${selectedTicket.onChainId} successfully transferred to ${transferRecipient}!`,
      );
      setShowTransferModal(false);
      setTransferRecipient("");
      setSelectedTicket(null);
      window.location.reload();
    } catch (error: any) {
      console.error("Transfer error:", error);
      setTransferError(error.message || "Failed to transfer ticket");
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isClient || isConnecting) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">
              Loading your ecosystem...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500 font-medium">Please connect your wallet to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <main className="relative overflow-hidden bg-white min-h-[calc(100vh-64px)] pb-20">
        {/* Grid Background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #f5c51833 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            {...fadeUp(0)}
            className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <div>
              <motion.div
                {...fadeIn(0.1)}
                className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-50 px-3 py-1 mb-3"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">
                  User Dashboard
                </span>
              </motion.div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                RacePass{" "}
                <span className="text-yellow-500 underline decoration-yellow-400/40 underline-offset-4">
                  Control
                </span>
              </h1>
              <p className="mt-2 text-gray-500 font-medium">
                Manage your digital identity, reputation, and racing assets.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-yellow-50 backdrop-blur-md border border-yellow-200 rounded-2xl px-4 py-2 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs font-bold">
                {address?.substring(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                  Connected Wallet
                </p>
                <p className="text-xs font-mono text-gray-700 font-semibold">
                  {address?.substring(0, 6)}...
                  {address?.substring(address.length - 4)}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ── LEFT: IDENTITY CARD ────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.1)} className="lg:col-span-8 space-y-6">
              {profileLoading ? (
                <div className="bg-white border border-yellow-100 rounded-3xl p-12 text-center shadow-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500 font-medium">
                    Syncing profile...
                  </p>
                </div>
              ) : profile?.identity ? (
                <div className="relative group overflow-hidden bg-yellow-400 rounded-3xl p-8 text-black shadow-2xl shadow-yellow-400/10">

                  <div className="relative flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase tracking-widest border border-white/30 backdrop-blur-md">
                            Universal Racing License
                          </span>
                          {profile.identity.isKycVerified && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-200">
                              <div className="w-1 h-1 bg-green-300 rounded-full animate-pulse" />
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter flex items-center gap-4">
                          RacePass ID
                          <span className="text-amber-200/50 text-3xl font-light">
                            #{profile.identity.tokenId}
                          </span>
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/10 backdrop-blur-md border border-black/10 rounded-2xl p-4 group/stat hover:bg-black/20 transition-colors">
                          <p className="text-xs font-bold text-black/60 uppercase tracking-widest mb-1">
                            Reputation Score
                          </p>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black">
                              {profile.identity.activeReputation}
                            </span>
                            <span className="text-xs mb-1 text-green-700 font-bold">
                              Good Standing
                            </span>
                          </div>
                        </div>
                        <div className="bg-black/10 backdrop-blur-md border border-black/10 rounded-2xl p-4">
                          <p className="text-xs font-bold text-black/60 uppercase tracking-widest mb-1">
                            Status
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className={`w-2 h-2 rounded-full ${profile.identity.isRevoked ? "bg-red-400" : "bg-green-400 animate-pulse"}`}
                            />
                            <span className="text-lg font-bold">
                              {profile.identity.isRevoked
                                ? "Revoked"
                                : "Active"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end">
                      <div className="text-right">
                        <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest">
                          Last Activity
                        </p>
                        <p className="text-sm font-semibold text-white/90">
                          {profile.identity.lastUpdate}
                        </p>
                      </div>

                      <div className="mt-8 md:mt-0 p-3 bg-white rounded-2xl shadow-inner shadow-black/5">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${address}&color=ea580c`}
                          alt="Identity QR"
                          className="w-20 h-20 grayscale brightness-90 hover:grayscale-0 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#111] border border-white/10 rounded-3xl p-12 text-center shadow-lg">
                  <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    No Racing Identity Found
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8">
                    Complete your KYC verification to mint your Soulbound
                    Universal Racing License and build your reputation.
                  </p>
                  <Link
                    href="/kyc"
                    className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-sm font-bold text-black shadow-xl shadow-yellow-400/20 hover:scale-105 transition-transform"
                  >
                    Start Verification Flow
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </div>
              )}

              {/* ── TICKETS GRID ────────────────────────────────────────── */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    Digital Event Passes
                    <span className="text-sm font-medium text-gray-400 ml-2">
                      {profile?.tickets?.length || 0} Assets
                    </span>
                  </h3>
                  <Link
                    href="/events"
                    className="text-xs font-bold text-yellow-600 hover:text-yellow-700 transition-colors uppercase tracking-widest"
                  >
                    Browse More →
                  </Link>
                </div>

                {profile?.tickets && profile.tickets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.tickets.map((ticket, idx) => (
                      <motion.div
                        key={ticket.dbId}
                        {...fadeUp(0.1 + idx * 0.05)}
                        className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:shadow-xl ${ticket.isCheckedIn
                          ? "bg-gray-50 border-gray-100 grayscale"
                          : "bg-white border-yellow-100 hover:border-yellow-300 shadow-md shadow-yellow-900/5"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest opacity-80">
                              Reserved Access
                            </p>
                            <h4 className="text-lg font-black text-gray-900 group-hover:text-yellow-600 transition-colors">
                              {ticket.eventName}
                            </h4>
                            <p className="text-xs font-mono text-gray-400">
                              TKT-ID: {ticket.onChainId}
                            </p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${ticket.isCheckedIn
                              ? "bg-gray-100 text-gray-400 border-gray-200"
                              : "bg-yellow-50 text-yellow-600 border-yellow-200 shadow-inner"
                              }`}
                          >
                            {ticket.isCheckedIn ? "✓ Used" : "Valid"}
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-yellow-200" />
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-yellow-100" />
                          </div>
                          <div className="flex gap-2">
                            {!ticket.isCheckedIn && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowQrModal(true);
                                  }}
                                  className="p-2 rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                                  title="Show Entry QR"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowTransferModal(true);
                                  }}
                                  className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                  title="Transfer Ticket"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                    />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Card Edge Cut-outs (Stylistic) */}
                        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white border border-transparent rounded-full -translate-y-1/2 shadow-inner" />
                        <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white border border-transparent rounded-full -translate-y-1/2 shadow-inner" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-yellow-200 rounded-3xl p-10 text-center">
                    <p className="text-gray-400 font-medium italic">
                      No active tickets found in your wallet.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── RIGHT: SIDEBAR (STATS & FEED) ───────────────────────────────── */}
            <motion.div {...fadeUp(0.2)} className="lg:col-span-4 space-y-6">
              {/* Quick Access Card */}
              <div className="bg-white border border-yellow-100 rounded-3xl p-6 shadow-xl shadow-yellow-900/5">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                  Quick Ecosystem
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/events"
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-yellow-50 hover:bg-yellow-100 transition-colors border border-yellow-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                      🎟️
                    </div>
                    <span className="text-[10px] font-black text-yellow-700 uppercase">
                      Buy Tickets
                    </span>
                  </Link>
                  <Link
                    href="/kyc"
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    </div>
                    <span className="text-[10px] font-black text-gray-600 uppercase">
                      Verify KYC
                    </span>
                  </Link>
                </div>
              </div>

              {/* Reputation Ledger */}
              <div className="bg-white border border-yellow-100 rounded-3xl overflow-hidden shadow-xl shadow-yellow-900/5">
                <div className="p-5 border-b border-yellow-50 flex items-center justify-between bg-yellow-50/50">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    Reputation Ledger
                  </h3>
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                </div>

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  {profile?.reputationHistory &&
                    profile.reputationHistory.length > 0 ? (
                    <div className="divide-y divide-yellow-50">
                      {profile.reputationHistory.map((log) => (
                        <div
                          key={log.id}
                          className="p-4 hover:bg-yellow-50/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className={`text-[10px] font-black uppercase tracking-widest ${log.type === "add" ? "text-green-600" : "text-red-600"}`}
                            >
                              {log.type === "add"
                                ? "Contribution"
                                : "Infraction"}
                            </p>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-700 leading-tight mb-2">
                            {log.reason}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-sm font-black ${log.type === "add" ? "text-green-500" : "text-red-500"}`}
                              >
                                {log.type === "add" ? "+" : "-"}
                                {log.amount}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">
                                REP
                              </span>
                            </div>
                            {log.tx_hash && (
                              <a
                                href={`https://testnet.monadscan.com/tx/${log.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-yellow-600 hover:underline"
                              >
                                TX →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-xs text-gray-400 italic">
                        No ledger entries yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── MODALS ────────────────────────────────────────── */}
        <AnimatePresence>
          {showQrModal && selectedTicket && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[40px] max-w-sm w-full p-8 shadow-2xl relative border border-yellow-100"
              >
                <button
                  onClick={() => {
                    setShowQrModal(false);
                    setSelectedTicket(null);
                  }}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="text-center mt-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 mb-4 border border-yellow-200">
                    <span className="h-1 w-1 rounded-full bg-yellow-500" />
                    <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">
                      Entry Pass
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">
                    {selectedTicket.eventName}
                  </h3>
                  <p className="text-xs font-mono text-gray-400 mb-8">
                    Ticket #{selectedTicket.onChainId}
                  </p>

                  <div className="bg-yellow-50 p-6 rounded-[32px] border-2 border-dashed border-yellow-200 mb-8">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${address}&color=ea580c`}
                      alt="QR Code"
                      className="mx-auto w-48 h-48 mix-blend-multiply transition-transform hover:scale-105 duration-500"
                    />
                  </div>

                  <div className="space-y-4 text-xs font-bold text-gray-500">
                    <div className="flex items-center gap-3 justify-center text-yellow-600">
                      <span className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center text-[10px]">
                        1
                      </span>
                      <span>Show at Entrance</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">
                        2
                      </span>
                      <span>Verified via Wallet</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTransferModal && selectedTicket && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] max-w-md w-full p-8 shadow-2xl relative border border-yellow-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Transfer <span className="text-yellow-500">Asset</span>
                  </h2>
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferRecipient("");
                      setTransferError("");
                      setSelectedTicket(null);
                    }}
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">
                      Asset Information
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {selectedTicket.eventName}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      # {selectedTicket.onChainId}
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-4">
                    <div className="text-2xl">⚠️</div>
                    <p className="text-[10px] font-bold text-orange-700 leading-relaxed uppercase">
                      Warning: Recipients must have a valid RacePass Identity to
                      accept this ticket. Non-compliant wallets will be rejected
                      on-chain.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={transferRecipient}
                      onChange={(e) => {
                        setTransferRecipient(e.target.value);
                        setTransferError("");
                      }}
                      placeholder="0x..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:border-yellow-400 focus:ring-yellow-400 font-mono text-xs p-4 outline-none"
                    />
                  </div>

                  {transferError && (
                    <div className="bg-red-50 text-red-600 text-[10px] font-bold p-3 rounded-xl border border-red-100 text-center">
                      {transferError}
                    </div>
                  )}

                  <button
                    onClick={handleTransferTicket}
                    disabled={isTransferring || !transferRecipient.trim()}
                    className={`w-full rounded-full py-4 text-sm font-black uppercase tracking-widest shadow-xl transition-all ${isTransferring || !transferRecipient.trim()
                      ? "bg-gray-100 cursor-not-allowed text-gray-400"
                      : "bg-yellow-400 text-black shadow-yellow-400/20 hover:scale-[1.02]"
                      }`}
                  >
                    {isTransferring ? "Processing..." : "Confirm Transfer"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RacePass Admin – Event Management Dashboard",
  description: "Manage events, verify credentials, and monitor attendance with the RacePass admin panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ── TOP NAV BAR ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between">

            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-md shadow-yellow-400/30 group-hover:shadow-yellow-400/50 transition-shadow">
                <span className="text-black font-black text-lg">R</span>
              </div>
              <div className="leading-tight">
                <span className="text-lg font-black text-gray-900">
                  Race<span className="text-yellow-500">Pass</span>
                </span>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] -mt-0.5">
                  Admin Panel
                </div>
              </div>
            </a>

            {/* Nav Links */}
            <nav className="hidden sm:flex items-center gap-2">
              <a
                href="/"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-yellow-50 hover:text-gray-900 transition-all duration-200"
              >
                Dashboard
              </a>
              <a
                href="/verify"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-yellow-50 hover:text-gray-900 transition-all duration-200"
              >
                Verify
              </a>
              <a
                href="/users"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-yellow-50 hover:text-gray-900 transition-all duration-200"
              >
                Users
              </a>
              <a
                href="/create-event"
                className="ml-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-yellow-400/25 transition-all duration-200 hover:-translate-y-0.5"
              >
                + Create Event
              </a>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
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
  title: "RacePass - Universal Identity & Reputation Layer",
  description: "Complete KYC once, use everywhere. Privacy-preserving digital identity for events and platforms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            {/* Desktop: Add left padding for sidebar */}
            {/* Mobile: Add bottom padding for bottom nav */}
            <main className="flex-1 overflow-y-auto lg:pl-72 pb-20 lg:pb-0">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

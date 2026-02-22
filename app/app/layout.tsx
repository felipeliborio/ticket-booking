import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SwitchUserButton } from "@/app/components/switch-user-button";
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
  title: "Ticked Booking System",
  description: "Ticket Booking System web app",
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
        <header className="fixed top-0 left-0 z-10 h-14 w-full border-b border-white/60 bg-white/55 backdrop-blur">
          <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between px-6">
            <Link
              href="/"
              className="text-sm font-semibold tracking-wide text-zinc-700 transition-colors hover:text-zinc-900"
            >
              Ticket booking
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/bookings"
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
              >
                My bookings
              </Link>
              <SwitchUserButton />
            </div>
          </div>
        </header>
        <div className="min-h-screen pt-14">
          {children}
          <footer className="mt-16 border-t border-white/60 bg-white/55">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-zinc-600">
              <div className="space-y-1">
                <p>Ticket booking system</p>
                <p>Built for events and bookings</p>
              </div>
              <div className="space-y-1 text-right">
                <p>Built by Felipe Libório</p>
                <a
                  href="https://github.com/felipeliborio/ticket-booking"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-zinc-700 transition-colors hover:text-zinc-900"
                >
                  github.com/felipeliborio/ticket-booking
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

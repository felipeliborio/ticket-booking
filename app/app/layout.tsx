import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        <header className="fixed top-0 left-0 z-10 w-full border-b border-white/60 bg-white/55 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
            <Link
              href="/"
              className="text-sm font-semibold tracking-wide text-zinc-700 transition-colors hover:text-zinc-900"
            >
              Ticket booking
            </Link>
            <Link
              href="/bookings"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              My bookings
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

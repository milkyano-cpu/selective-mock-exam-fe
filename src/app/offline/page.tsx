import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offline · Aspire',
  description: 'You are currently offline.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#0A9AE2] to-[#0659AA] flex items-center justify-center shadow-lg shadow-blue-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10"
          >
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <path d="M12 20h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          You are offline
        </h1>
        <p className="text-slate-500 mb-8">
          It looks like you have lost your internet connection. Please check
          your network and try again.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-br from-[#0A9AE2] to-[#0659AA] text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:opacity-90 transition"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

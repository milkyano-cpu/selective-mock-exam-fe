
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled production error:', error);
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50 p-6'>
      <div className='max-w-md w-full text-center'>
        <div className='w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center'>
          <svg className='w-10 h-10 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
          </svg>
        </div>
        <h2 className='text-2xl font-bold text-slate-900 mb-2'>Something went wrong</h2>
        <p className='text-slate-500 mb-8'>
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className='flex gap-4 justify-center'>
          <button
            onClick={() => reset()}
            className='px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition'
          >
            Try again
          </button>
          <Link
            href='/'
            className='px-6 py-2 bg-[#0A9AE2] text-white font-semibold rounded-xl hover:bg-[#0659AA] transition'
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}


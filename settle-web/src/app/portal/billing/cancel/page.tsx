'use client';

import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-black dark:text-white mb-2">Payment Cancelled</h1>
        <p className="text-zinc-500 mb-6">
          Your payment was cancelled and no charges were made. You can try again whenever you&rsquo;re ready.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/portal/billing"
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
          >
            Back to Billing
          </Link>
          <Link
            href="/portal"
            className="w-full py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Go to Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

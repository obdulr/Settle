import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Provider Billing & Credits | Settle In Peace',
  description: 'Manage provider credits and billing for your Settle In Peace account.',
  robots: { index: false, follow: false },
};

export default function BillingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

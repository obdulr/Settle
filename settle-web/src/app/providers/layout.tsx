import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Our Provider Network | Settle In Peace',
  description: 'Join the Settle In Peace provider network and connect with qualified debt relief leads.',
  alternates: { canonical: '/providers' },
};

export default function ProvidersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

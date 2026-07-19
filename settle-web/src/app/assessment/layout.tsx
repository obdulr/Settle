import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Debt Relief Assessment | Settle In Peace',
  description: 'Take a free, confidential debt relief assessment and see providers matched to your needs.',
  alternates: { canonical: '/assessment' },
};

export default function AssessmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

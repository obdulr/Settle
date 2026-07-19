import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Financial Coaching | Settle In Peace', description: 'Set budgets and goals to build a more confident financial future.', alternates: { canonical: '/coaching' } };
export default function CoachingLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

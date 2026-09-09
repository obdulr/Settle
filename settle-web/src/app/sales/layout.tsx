import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sales Dashboard | Settle In Peace', description: 'Sales agent dashboard for managing leads.', alternates: { canonical: '/sales' } };
export default function SalesLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard | Settle In Peace', description: 'View your Settle In Peace account dashboard.', alternates: { canonical: '/dashboard' } };
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

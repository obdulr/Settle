import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Admin | Settle In Peace', description: 'Settle In Peace administration portal.', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

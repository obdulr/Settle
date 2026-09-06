import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Admin — Sales Agents | Settle In Peace', description: 'Manage sales agents and lead assignments.', alternates: { canonical: '/admin/sales' } };
export default function AdminSalesLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

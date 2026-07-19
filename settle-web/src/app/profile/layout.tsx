import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Profile | Settle In Peace', description: 'Manage your Settle In Peace profile.', robots: { index: false, follow: false } };
export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

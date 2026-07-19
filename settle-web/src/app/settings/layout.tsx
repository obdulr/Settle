import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Settings | Settle In Peace', description: 'Manage your Settle In Peace account settings.', robots: { index: false, follow: false } };
export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

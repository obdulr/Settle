'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAuthenticated, getStoredUser } from '../lib/authUtils';

export default function Navigation() {
  const pathname = usePathname();
  const authenticated = isAuthenticated();
  const user = getStoredUser();

  // Public marketplace nav items (always visible)
  const publicItems = [
    { href: '/assessment', label: 'Free Assessment' },
    { href: '/calculators', label: 'Calculators' },
    { href: '/compare', label: 'Compare Providers' },
    { href: '/providers', label: 'For Providers' },
  ];

  // Auth-gated items
  const authItems = authenticated
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/debts', label: 'My Debts' },
        { href: '/settings', label: 'Settings' },
      ]
    : [
        { href: '/login', label: 'Login' },
        { href: '/register', label: 'Register' },
      ];

  // Role-gated items (provider portal + admin)
  const roleItems: { href: string; label: string }[] = [];
  if (authenticated && user) {
    if (user.role === 'provider') {
      roleItems.push({ href: '/portal', label: 'Provider Portal' });
    }
    if (user.role === 'admin') {
      roleItems.push({ href: '/admin', label: 'Admin' });
    }
  }

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + public links */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-black dark:text-white mr-8 flex-shrink-0">
              Settle<span className="text-blue-600">InPeace</span>
            </Link>
            <div className="hidden sm:flex sm:space-x-6">
              {publicItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'border-blue-500 text-black dark:text-white'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {item.href === '/assessment' ? (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.label}</span>
                  ) : item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth links + user info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              {roleItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {authItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {/* CTA button */}
            {!authenticated && (
              <Link
                href="/assessment"
                className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Free Help →
              </Link>
            )}
            {authenticated && user && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
                {user.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
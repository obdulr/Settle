'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAuthenticated, getStoredUser } from '../lib/authUtils';

export default function Navigation() {
  const pathname = usePathname();
  const authenticated = isAuthenticated();
  const user = getStoredUser();

  const navItems = [
    { href: '/', label: 'Home', show: true },
    { href: '/login', label: 'Login', show: !authenticated },
    { href: '/register', label: 'Register', show: !authenticated },
    { href: '/profile', label: 'Profile', show: authenticated },
    { href: '/dashboard', label: 'Dashboard', show: authenticated },
    { href: '/debts', label: 'Debts', show: authenticated },
    { href: '/settings', label: 'Settings', show: authenticated },
  ];

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-black dark:text-white">
                Settle
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                item.show && (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-zinc-600 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {authenticated && user && (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {user.email}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
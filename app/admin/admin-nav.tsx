'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/cars', label: 'Cars' },
  { href: '/admin/reservations', label: 'Reservations' },
  { href: '/admin/tolls', label: 'Tolls' },
  { href: '/admin/pricing', label: 'Pricing' },
  { href: '/admin/locations', label: 'Locations' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/expenses', label: 'Expenses' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-line bg-white px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-sm font-medium text-ink">
          {LINKS.find((l) => isActive(l.href))?.label ?? 'Admin'}
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm border border-line rounded px-3 py-1.5"
          aria-label="Toggle menu"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      <div className={`${open ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-3 sm:gap-6 mt-3 sm:mt-0 flex-wrap`}>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`text-sm transition-colors ${
              isActive(link.href) ? 'text-accent-dark font-medium' : 'text-neutral-500 hover:text-ink'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

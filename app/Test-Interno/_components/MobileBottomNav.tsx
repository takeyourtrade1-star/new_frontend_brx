'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Gavel,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home',   href: '/Test-Interno',        label: 'Home',    Icon: Home },
  { id: 'aste',   href: '/Test-Interno/aste',   label: 'Aste',    Icon: Gavel },
  { id: 'search', href: '/Test-Interno/search', label: 'Cerca',   Icon: Search },
  { id: 'cart',   href: '/Test-Interno/cart',   label: 'Carrello',Icon: ShoppingCart },
  { id: 'profilo',href: '/Test-Interno/profilo',label: 'Profilo', Icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 pb-[env(safe-area-inset-bottom)]"
      style={{ maxWidth: '430px' }}
    >
      {/* Glass pill container */}
      <div
        className="mx-3 mb-3 flex items-center justify-around rounded-[28px] px-2 py-2"
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {NAV_ITEMS.map(({ id, href, label, Icon }) => {
          const isActive = pathname === href || (href !== '/Test-Interno' && pathname.startsWith(href));
          return (
            <Link
              key={id}
              href={href}
              id={`bottom-nav-${id}`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-200 active:scale-90"
            >
              {/* Active pill background */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-[20px]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,115,0,0.20) 0%, rgba(255,115,0,0.08) 100%)',
                    border: '1px solid rgba(255,115,0,0.25)',
                  }}
                  aria-hidden
                />
              )}

              <span className="relative">
                <Icon
                  className="h-5 w-5 transition-colors duration-200"
                  style={{ color: isActive ? '#FF7300' : 'rgba(255,255,255,0.45)' }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {/* Orange dot indicator */}
                {isActive && (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#FF7300]"
                    aria-hidden
                  />
                )}
              </span>

              <span
                className="relative text-[9px] font-semibold uppercase tracking-wider transition-colors duration-200"
                style={{ color: isActive ? '#FF7300' : 'rgba(255,255,255,0.35)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

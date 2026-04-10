'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getCdnImageUrl } from '@/lib/config';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';

const ORANGE_GLASS_CART_CLASS =
  'absolute right-0 top-full z-[110] mt-2 w-[320px] rounded-2xl border border-primary/45 bg-primary/30 px-0 py-0 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-2xl ring-1 ring-white/20 animate-orange-menu-enter';

export function CartDropdown() {
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [badgeBounce, setBadgeBounce] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(0);

  const items = useCartStore((s) => s.items);
  const cartCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getTotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItem = useCartStore((s) => s.removeItem);

  // Animate badge when count increases
  useEffect(() => {
    if (cartCount > prevCountRef.current && cartCount > 0) {
      setBadgeBounce(true);
      const timer = setTimeout(() => setBadgeBounce(false), 400);
      prevCountRef.current = cartCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  const intlLocale = LOCALE_TO_INTL[locale as UiLocale] ?? 'it-IT';
  const formatEuro = (n: number) =>
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'EUR' }).format(n);

  // Last 3 items for preview
  const recentItems = items.slice(0, 3);
  const hasMoreItems = items.length > 3;

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cart Trigger Button */}
      <Link
        href="/cart"
        className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:px-2"
        aria-label={t('nav.cartAria', { total: formatEuro(cartTotal) })}
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5">
          <ShoppingCart className="h-5 w-5 text-primary" strokeWidth={2} />
          {cartCount > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-white px-0.5 text-[9px] font-bold text-primary transition-transform',
                badgeBounce && 'animate-cart-badge-bounce'
              )}
              aria-hidden
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </span>
        <span className="hidden text-sm text-white sm:inline">
          ({formatEuro(cartTotal)})
        </span>
      </Link>

      {/* Dropdown Preview */}
      {isOpen && items.length > 0 && (
        <div className={ORANGE_GLASS_CART_CLASS}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-white/80" />
              <span className="text-sm font-medium">
                {cartCount} {cartCount === 1 ? t('cart.item') : t('cart.items')}
              </span>
            </div>
            <button
              onClick={() => clearCart()}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
              aria-label={t('cart.clear')}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('cart.clear')}</span>
            </button>
          </div>

          {/* Items List */}
          <div className="max-h-[240px] overflow-y-auto py-2">
            {recentItems.map((item) => (
              <div
                key={item.productId}
                className="group flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/10"
              >
                {/* Product Image */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl.startsWith('http') ? item.product.imageUrl : getCdnImageUrl(item.product.imageUrl)}
                      alt={item.product?.name || 'Product'}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-white">
                    {item.product?.name || 'Product'}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span>Qty: {item.quantity}</span>
                    <span>×</span>
                    <span>{formatEuro(item.product?.price || 0)}</span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="shrink-0 rounded p-1 text-white/40 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  aria-label={t('cart.remove')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {hasMoreItems && (
              <div className="px-4 py-2 text-center text-xs text-white/60">
                +{items.length - 3} {t('cart.moreItems')}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/20 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/80">{t('cart.total')}</span>
              <span className="text-lg font-bold text-white">{formatEuro(cartTotal)}</span>
            </div>
            <Link
              href="/cart"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-white/90 hover:shadow-lg"
              onClick={() => setIsOpen(false)}
            >
              <span>{t('cart.goToCart')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Empty Cart State */}
      {isOpen && items.length === 0 && (
        <div className={cn(ORANGE_GLASS_CART_CLASS, 'py-6 text-center')}>
          <ShoppingCart className="mx-auto h-10 w-10 text-white/30 mb-3" />
          <p className="text-sm text-white/70">{t('cart.empty')}</p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm font-medium text-white underline hover:no-underline"
            onClick={() => setIsOpen(false)}
          >
            {t('cart.continueShopping')}
          </Link>
        </div>
      )}
    </div>
  );
}

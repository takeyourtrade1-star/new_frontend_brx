'use client';

/**
 * Condividi asta: su desktop copia il link; su mobile menu (WhatsApp, Telegram, …) o Web Share API.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Copy, MessageCircle, Send, Share2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const ORANGE = '#FF7300';

type Props = {
  auctionTitle: string;
};

export function AuctionShareButton({ auctionTitle }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [url, setUrl] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setUrl(`${window.location.origin}${pathname}`);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const shareText = useCallback(() => {
    return t('auctions.shareText', { title: auctionTitle });
  }, [auctionTitle, t]);

  const copyLink = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMenuOpen(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [url]);

  const openExternal = useCallback(
    (href: string) => {
      window.open(href, '_blank', 'noopener,noreferrer');
      setMenuOpen(false);
    },
    []
  );

  const handlePrimaryClick = useCallback(async () => {
    if (!url) return;

    const isDesktop =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
      await copyLink();
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: auctionTitle,
          text: shareText(),
          url,
        });
        return;
      } catch {
        /* user cancelled or error → menu */
      }
    }

    setMenuOpen((o) => !o);
  }, [url, auctionTitle, shareText, copyLink]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(shareText());

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={handlePrimaryClick}
        className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-sm transition hover:brightness-105"
        style={{ borderColor: ORANGE, color: ORANGE, backgroundColor: 'white' }}
      >
        <Share2 className="h-4 w-4" aria-hidden />
        {t('auctions.share')}
      </button>
      {copied && (
        <span className="absolute -bottom-8 right-0 z-10 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow">
          {t('auctions.shareCopied')}
        </span>
      )}

      {menuOpen && url && (
        <div
          className="absolute right-0 top-full z-20 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
          role="menu"
        >
          <p className="border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {t('auctions.shareMenuTitle')}
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-orange-50"
            onClick={() =>
              openExternal(`https://wa.me/?text=${encodeURIComponent(`${shareText()} ${url}`)}`)
            }
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
            WhatsApp
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-orange-50"
            onClick={() =>
              openExternal(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`)
            }
          >
            <Send className="h-4 w-4 text-sky-500" />
            Telegram
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-orange-50"
            onClick={() =>
              openExternal(
                `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
              )
            }
          >
            X / Twitter
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-orange-50"
            onClick={() =>
              openExternal(`mailto:?subject=${encodeURIComponent(auctionTitle)}&body=${encodedUrl}`)
            }
          >
            Email
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2.5 text-left text-sm font-semibold text-[#FF7300] hover:bg-orange-50"
            onClick={() => copyLink()}
          >
            <Copy className="h-4 w-4" />
            {t('auctions.shareCopyLink')}
          </button>
        </div>
      )}
    </div>
  );
}

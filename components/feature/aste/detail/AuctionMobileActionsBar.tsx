import Link from 'next/link';
import { Bookmark, PlusCircle } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { AuctionQrButton } from '@/components/feature/aste/AuctionQrButton';
import { AuctionShareButton } from '@/components/feature/aste/AuctionShareButton';

export interface AuctionMobileActionsBarProps {
  title: string;
  isOwner: boolean;
  isSaved: boolean;
  showStickyHeader: boolean;
  /** Offset verticale della barra fissa (header + nav). */
  mobileActionTop: number;
  onToggleSave: () => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

/** Barra azioni fissa mobile (titolo, salva/QR/condividi, crea) visibile in scroll. */
export function AuctionMobileActionsBar({
  title,
  isOwner,
  isSaved,
  showStickyHeader,
  mobileActionTop,
  onToggleSave,
  t,
}: AuctionMobileActionsBarProps) {
  return (
    <div
      className={`fixed left-0 right-0 z-50 transition-all duration-200 lg:hidden ${
        showStickyHeader
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-2 opacity-0'
      }`}
      style={{ top: mobileActionTop }}
    >
      <div className="container-content container-content-card-detail py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 max-w-[46vw] rounded-full border border-white/60 bg-white/70 px-3 py-2 shadow-[0_10px_24px_rgba(29,49,96,0.15)] backdrop-blur-xl backdrop-saturate-150">
            <h2 className="truncate text-[12px] font-bold uppercase tracking-wide text-[#1D3160]">
              {title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-1.5 py-1 shadow-[0_10px_24px_rgba(29,49,96,0.15)] backdrop-blur-xl backdrop-saturate-150">
              {!isOwner && (
                <button
                  type="button"
                  onClick={onToggleSave}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/70 ${isSaved ? 'text-[#FF7300]' : 'text-gray-600 hover:text-[#FF7300]'}`}
                  aria-label={t('auctions.detailSaveLater')}
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              )}
              <AuctionQrButton auctionTitle={title} compact />
              <AuctionShareButton auctionTitle={title} compact />
            </div>
            <Link
              href="/aste/nuova"
              className="flex h-10 items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-3 shadow-[0_10px_24px_rgba(29,49,96,0.15)] backdrop-blur-xl backdrop-saturate-150"
              aria-label={t('auctions.navCreate')}
            >
              <PlusCircle className="h-4 w-4 text-[#FF7300]" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

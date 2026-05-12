'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadNotificationsCount,
} from '@/lib/hooks/use-notifications';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { NotificationAPI } from '@/types/notification';

const TYPE_LABEL: Record<NotificationAPI['type'], string> = {
  AUCTION_WON: 'Asta vinta',
  AUCTION_SOLD: 'Asta aggiudicata',
  PAYMENT_RECEIVED: 'Pagamento',
  PAYMENT_OVERDUE: 'Pagamento in ritardo',
  DISPUTE_OPENED: 'Contestazione',
  DISPUTE_MESSAGE: 'Messaggio',
  AUCTION_REASSIGNED: 'Riassegnazione',
  AUCTION_CANCELLED: 'Asta annullata',
};

function getDeepLink(n: NotificationAPI): string | null {
  switch (n.related_kind) {
    case 'order':
      // Buyer-side notifications point to /ordini/acquisti, seller-side to
      // /ordini/vendite. We don't know the role from the notification alone,
      // so we link to the buyer view by default; the seller dashboard is one
      // click away from the bell-icon dropdown.
      switch (n.type) {
        case 'AUCTION_SOLD':
        case 'PAYMENT_RECEIVED':
          return n.related_id ? `/ordini/vendite` : null;
        default:
          return n.related_id ? `/ordini/acquisti` : null;
      }
    case 'auction':
      return n.related_id ? `/aste/${n.related_id}` : null;
    case 'dispute':
      return n.related_id ? `/ordini/contestazioni/${n.related_id}` : null;
    default:
      return null;
  }
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'ora';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min fa`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ore fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} giorni fa`;
  return new Date(iso).toLocaleDateString('it-IT');
}

export function NotificationBell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadQuery = useUnreadNotificationsCount({
    enabled: isAuthenticated,
  });
  const listQuery = useNotificationList(
    { limit: 20, offset: 0 },
    { enabled: isAuthenticated && open },
  );
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  if (!isAuthenticated) return null;

  const unread = unreadQuery.data?.data.unread ?? 0;
  const items = listQuery.data?.data ?? [];

  const handleMarkAll = () => {
    if (unread === 0) return;
    markAll.mutate();
  };

  const handleClickItem = (n: NotificationAPI) => {
    if (!n.read_at) markOne.mutate(n.id);
  };

  return (
    <div ref={containerRef} className="relative order-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifiche"
      >
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5" aria-hidden>
          <Bell className="h-4 w-4" stroke="#FF7300" strokeWidth={2} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[1.1rem] items-center justify-center rounded-full bg-[#FF3B3B] px-1 text-[10px] font-bold text-white shadow">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Lista notifiche"
          className="absolute right-0 top-full z-[120] mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-bold uppercase tracking-wide">Notifiche</span>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unread === 0 || markAll.isPending}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold text-[#FF7300] hover:underline disabled:cursor-default disabled:text-gray-400 disabled:no-underline',
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              {markAll.isPending ? 'Aggiornamento…' : 'Segna come letto'}
            </button>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center justify-center px-4 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#FF7300]" aria-hidden />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Nessuna notifica.
            </div>
          ) : (
            <ul className="max-h-[24rem] divide-y divide-gray-100 overflow-y-auto">
              {items.map((n) => {
                const href = getDeepLink(n);
                const Inner = (
                  <div
                    className={cn(
                      'flex flex-col gap-0.5 px-4 py-3 transition-colors',
                      !n.read_at ? 'bg-[#FFF7EC]' : 'bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#FF7300]">
                        {TYPE_LABEL[n.type] ?? n.type}
                      </span>
                      <span className="text-[10px] text-gray-500">{formatRelative(n.created_at)}</span>
                    </div>
                    <span className="line-clamp-2 text-sm font-semibold text-gray-900">{n.title}</span>
                    <span className="line-clamp-2 text-xs text-gray-600">{n.body}</span>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => {
                          handleClickItem(n);
                          setOpen(false);
                        }}
                        className="block w-full text-left hover:bg-gray-50"
                      >
                        {Inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClickItem(n)}
                        className="block w-full text-left hover:bg-gray-50"
                      >
                        {Inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-gray-100 px-4 py-3 text-right">
            <Link
              href="/account/messaggi"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[#FF7300] hover:underline"
            >
              Vedi tutto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

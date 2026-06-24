'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Tag, Trash2 } from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import {
  cancelListing,
  getMyListings,
  MarketplaceApiError,
  updateListing,
  type ListingResponse,
  type ListingStatus,
} from '@/lib/api/marketplace-client';
import { MarketplaceListingEditModal } from './MarketplaceListingEditModal';

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'ATTIVA',
  sold: 'VENDUTA',
  cancelled: 'ANNULLATA',
  pending_sync: 'SYNC IN CORSO',
  sync_failed: 'SYNC FALLITA',
};

type MarketplaceListingsPanelProps = {
  statusFilter?: ListingStatus;
};

export function MarketplaceListingsPanel({ statusFilter = 'active' }: MarketplaceListingsPanelProps) {
  const intlLocale = useIntlLocale();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<ListingResponse | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyListings({ page: 1, page_size: 50, status_filter: statusFilter });
      setListings(res.items);
      setTotal(res.total);
    } catch (e) {
      const msg =
        e instanceof MarketplaceApiError
          ? e.detail
          : e instanceof Error
            ? e.message
            : 'Impossibile caricare le inserzioni.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleEditSubmit = async (form: { price: number; quantity: number }) => {
    if (!editingListing) return;
    setSavingEdit(true);
    try {
      await updateListing(editingListing.id, {
        price: form.price,
        quantity: form.quantity,
      });
      setEditingListing(null);
      setToast({ message: 'Inserzione aggiornata.', type: 'success' });
      await loadListings();
    } catch (e) {
      const msg =
        e instanceof MarketplaceApiError
          ? e.detail
          : e instanceof Error
            ? e.message
            : 'Salvataggio non riuscito.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancel = async (listing: ListingResponse) => {
    if (
      !window.confirm(
        `Annullare l'inserzione «${listing.title}»? L'oggetto non sarà più visibile sul marketplace.`,
      )
    ) {
      return;
    }
    setCancellingId(listing.id);
    try {
      await cancelListing(listing.id);
      setToast({ message: 'Inserzione annullata.', type: 'success' });
      await loadListings();
    } catch (e) {
      const msg =
        e instanceof MarketplaceApiError
          ? e.detail
          : e instanceof Error
            ? e.message
            : 'Annullamento non riuscito.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center border border-gray-200 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
        <span className="sr-only">Caricamento inserzioni…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => void loadListings()}
          className="text-sm font-semibold text-[#FF7300] hover:underline"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 border border-gray-200 bg-white px-6 py-10">
        <Tag className="h-8 w-8 text-gray-300" aria-hidden />
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
          Nessuna inserzione marketplace attiva.
        </p>
        <Link href="/account/oggetti" className="text-sm font-medium text-[#FF7300] hover:underline">
          Vai al tuo inventario
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {listings.map((listing) => {
          const price = Number.parseFloat(listing.price);
          const productHref = listing.card_id ? `/products/${listing.card_id}` : null;
          return (
            <article
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                {productHref ? (
                  <Link
                    href={productHref}
                    className="block truncate font-bold text-gray-900 hover:text-[#FF7300] hover:underline"
                  >
                    {listing.title}
                  </Link>
                ) : (
                  <p className="truncate font-bold text-gray-900">{listing.title}</p>
                )}
                <p className="mt-1 text-sm text-gray-600">
                  {formatEuroNoSpace(price, intlLocale)} · Qtà {listing.quantity} ·{' '}
                  {STATUS_LABELS[listing.status] ?? listing.status}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(listing.created_at).toLocaleString(intlLocale)}
                </p>
              </div>
              {listing.status === 'active' && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingListing(listing)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCancel(listing)}
                    disabled={cancellingId === listing.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:bg-red-50 disabled:opacity-50',
                    )}
                  >
                    {cancellingId === listing.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Annulla
                  </button>
                </div>
              )}
            </article>
          );
        })}
        <p className="text-center text-xs text-gray-500">
          {total} inserzion{total === 1 ? 'e' : 'i'} totali
        </p>
      </div>

      {editingListing && (
        <MarketplaceListingEditModal
          listing={{
            id: editingListing.id,
            title: editingListing.title,
            price: editingListing.price,
            quantity: editingListing.quantity,
          }}
          onClose={() => setEditingListing(null)}
          onSubmit={handleEditSubmit}
          saving={savingEdit}
        />
      )}

      {toast && (
        <div className="fixed right-5 top-5 z-[60] flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500',
            )}
          />
          <span className="text-sm font-medium text-gray-800">{toast.message}</span>
        </div>
      )}
    </>
  );
}

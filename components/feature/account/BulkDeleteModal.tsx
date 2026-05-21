'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Trash2, X } from 'lucide-react';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import type { ConditionCode } from '@/components/ui/ConditionBadge';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { getCdnImageUrl } from '@/lib/config';
import { buildImageUrl, formatEurCents } from '@/lib/utils';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: InventoryItemWithCatalog[];
  syncStatus: 'active' | 'inactive' | 'syncing';
  onConfirm: (deleteFromPlatforms: boolean) => Promise<void>;
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  selectedItems,
  syncStatus,
  onConfirm,
}: BulkDeleteModalProps) {
  const [deleteFromPlatforms, setDeleteFromPlatforms] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultImage = getCdnImageUrl('Logo%20Principale%20EBARTEX.png');
  const syncActive = syncStatus === 'active' || syncStatus === 'syncing';

  useEffect(() => {
    if (!isOpen) {
      setDeleteFromPlatforms(false);
      setIsDeleting(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(deleteFromPlatforms);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-modal-title"
      onClick={() => { if (!isDeleting) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 opacity-100 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 id="bulk-delete-modal-title" className="text-base font-bold text-gray-900">
              Elimina {selectedItems.length} carte
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Sezione 1 — Riepilogo carte */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="max-h-48 divide-y divide-gray-100 overflow-y-auto">
              {selectedItems.map((item) => {
                const imgRaw = item.card?.image;
                const imgUrl = imgRaw ? buildImageUrl(imgRaw) ?? defaultImage : defaultImage;
                const name = item.card?.name ?? `Carta #${item.blueprint_id}`;
                const condition = item.properties?.condition as ConditionCode | undefined;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <Image src={imgUrl} alt="" fill className="object-cover" sizes="32px" unoptimized />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">{name}</span>
                    {condition && <ConditionBadge condition={condition} size="sm" />}
                    <span className="text-sm font-semibold text-gray-700 tabular-nums">
                      {formatEurCents(item.price_cents ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sezione 2 — Opzione sync */}
          {syncActive && (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span aria-hidden>⚠️</span>
                Sincronizzazione attiva rilevata
              </p>
              <p className="mb-3 text-xs text-gray-600">
                Vuoi eliminare queste carte anche sulle piattaforme collegate?
              </p>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="delete-scope"
                    checked={deleteFromPlatforms}
                    onChange={() => setDeleteFromPlatforms(true)}
                    className="h-4 w-4 accent-primary border-gray-300"
                  />
                  <span className="text-sm text-gray-800">
                    Sì, elimina ovunque{' '}
                    <span className="text-gray-500">(marketplace collegati…)</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="delete-scope"
                    checked={!deleteFromPlatforms}
                    onChange={() => setDeleteFromPlatforms(false)}
                    className="h-4 w-4 accent-primary border-gray-300"
                  />
                  <span className="text-sm text-gray-800">
                    No, elimina solo dall&apos;inventario locale
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-red-500/20 transition-all hover:bg-red-600 hover:shadow-md disabled:opacity-50 active:scale-95"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Elimina {selectedItems.length} carte
          </button>
        </div>
      </div>
    </div>
  );
}

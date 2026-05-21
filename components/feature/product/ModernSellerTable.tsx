'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, ShoppingCart, Plus, Minus, Pencil, Loader2, Clock, Gavel } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { ConditionBadge, type ConditionCode } from '@/components/ui/ConditionBadge';
import { BrxExpressIcon, BrxExpressBadge } from '@/components/ui/BrxExpressIcon';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';

// Mock data per BRX Express - da sostituire con logica reale
const MOCK_BRX_EXPRESS = new Set(['item_1']); // item_id che hanno BRX Express

// Mappa condizioni testuali a codici per ConditionBadge
const CONDITION_TEXT_TO_CODE: Record<string, ConditionCode> = {
  'Near Mint': 'NM',
  'near_mint': 'NM',
  'Lightly Played': 'SP',
  'lightly_played': 'SP',
  'Slightly Played': 'SP',
  'Moderately Played': 'MP',
  'moderately_played': 'MP',
  'Heavily Played': 'PL',
  'heavily_played': 'PL',
  'Played': 'PL',
  'Damaged': 'PO',
  'damaged': 'PO',
  'Poor': 'PO',
};

interface ListingItem {
  item_id: string;
  seller_display_name: string;
  seller_id?: string;
  condition?: string;
  price_cents: number;
  quantity: number;
  country?: string;
  mtg_language?: string;
  is_foil?: boolean;
  created_at?: string;
  // Mock fields per demo
  seller_type?: 'PRIVATE' | 'PROFESSIONAL' | 'POWERSELLER';
  is_auction?: boolean;
  auction_end_time?: string;
  is_signed?: boolean;
  has_brx_express?: boolean;
}

interface ModernSellerTableProps {
  listings: ListingItem[];
  loading?: boolean;
  error?: string | null;
  onAddToCart?: (item: ListingItem, event: React.MouseEvent<HTMLButtonElement>) => void;
  isOwnListing?: (item: ListingItem) => boolean;
  onOwnerEdit?: (item: ListingItem) => void;
  onOwnerQuantityChange?: (item: ListingItem, delta: number) => Promise<void>;
  busyItemId?: string | null;
}

export function ModernSellerTable({
  listings,
  loading = false,
  error = null,
  onAddToCart,
  isOwnListing = () => false,
  onOwnerEdit,
  onOwnerQuantityChange,
  busyItemId = null
}: ModernSellerTableProps) {
  
  // Utility function for formatting Euro currency
  const formatEuro = (n: number) => formatEuroNoSpace(n, 'it-IT');
  
  // Processa i listing aggiungendo i campi mock
  const processedListings = useMemo(() => {
    return listings.map((listing, index) => ({
      ...listing,
      // Mock data per demo - in produzione questi dati arriverebbero dall'API
      seller_type: index === 0 ? 'POWERSELLER' : index < 3 ? 'PROFESSIONAL' : 'PRIVATE',
      is_auction: Math.random() > 0.7,
      auction_end_time: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      is_signed: Math.random() > 0.8,
      has_brx_express: MOCK_BRX_EXPRESS.has(listing.item_id) || index === 0, // Primo risultato ha sempre BRX Express
    }));
  }, [listings]);

  // Funzione per ottenere il codice condizione
  const getConditionCode = (conditionText?: string): ConditionCode => {
    if (!conditionText) return 'NM';
    return CONDITION_TEXT_TO_CODE[conditionText] || 'NM';
  };

  // Funzione per calcolare il tempo rimanente per aste
  const getAuctionTimeLeft = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Terminata';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}g ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Render seller type badge
  const renderSellerTypeBadge = (type: string) => {
    switch (type) {
      case 'POWERSELLER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-sm">
            ⭐ PowerSeller
          </span>
        );
      case 'PROFESSIONAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            PRO
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-8 bg-gray-200 rounded"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-600">{error}</p>
      </div>
    );
  }

  if (processedListings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-600">Presto ci saranno articoli in vendita disponibili.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {processedListings.map((listing, index) => {
        const isOwn = isOwnListing(listing);
        const isBusy = busyItemId === listing.item_id;
        const conditionCode = getConditionCode(listing.condition);
        
        return (
          <div
            key={listing.item_id}
            className={cn(
              "group relative rounded-lg border transition-all duration-200 hover:shadow-md",
              listing.has_brx_express 
                ? "border-orange-200 bg-gradient-to-r from-orange-50/50 to-amber-50/30 hover:from-orange-50 hover:to-amber-50/50" 
                : "border-gray-200 bg-white hover:bg-gray-50",
              index === 0 && "ring-1 ring-orange-200" // Evidenzia il primo risultato
            )}
          >
            {/* BRX Express Badge */}
            {listing.has_brx_express && (
              <div className="absolute -top-2 -right-2 z-10">
                <BrxExpressBadge />
              </div>
            )}

            <div className="p-4">
              {/* Header: Seller Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Seller Name + Flag */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Link 
                      href={`/users/${listing.seller_display_name}`}
                      className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors truncate uppercase"
                    >
                      {listing.seller_display_name}
                    </Link>
                    {listing.country && (
                      <FlagIcon country={listing.country} size="sm" />
                    )}
                  </div>

                  {/* Seller Type Badge */}
                  {listing.seller_type && renderSellerTypeBadge(listing.seller_type)}

                  {/* Medal Icon */}
                  <Image 
                    src={getCdnImageUrl('medal.png')} 
                    alt="" 
                    width={20} 
                    height={20} 
                    className="h-5 w-5 shrink-0 object-contain" 
                    unoptimized 
                  />

                  {/* Signed Badge */}
                  {listing.is_signed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      ✍️ Firmata
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <div className={cn(
                    "text-lg font-bold tabular-nums",
                    listing.has_brx_express ? "text-orange-600" : "text-blue-600"
                  )}>
                    {formatEuro(listing.price_cents / 100)}
                  </div>
                  {listing.is_auction && (
                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <Gavel className="h-3 w-3" />
                      <span>{getAuctionTimeLeft(listing.auction_end_time!)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Row: Condition, Language, Quantity, Actions */}
              <div className="flex items-center justify-between">
                {/* Left: Condition + Language + Star */}
                <div className="flex items-center gap-3">
                  {/* Condition Badge */}
                  <ConditionBadge condition={conditionCode} size="md" />

                  {/* Language Badge */}
                  <span className="inline-flex items-center justify-center h-[22px] min-w-[44px] px-2.5 rounded-full text-xs font-bold text-white bg-[#1D3160]">
                    {listing.mtg_language || 'EN'}
                  </span>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    <Image 
                      src={getCdnImageUrl('star.png')} 
                      alt="" 
                      width={16} 
                      height={16} 
                      className="h-4 w-4 object-contain" 
                      unoptimized 
                    />
                    <span className="text-xs text-gray-500">4.9</span>
                  </div>

                  {/* Foil indicator */}
                  {listing.is_foil && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900">
                      Foil
                    </span>
                  )}

                  {/* Auction/Exchange indicator */}
                  {listing.is_auction ? (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <Gavel className="h-3 w-3" />
                      <span>Asta</span>
                    </div>
                  ) : null}
                </div>

                {/* Right: Quantity + Actions */}
                <div className="flex items-center gap-3">
                  {/* Quantity */}
                  <span className="text-sm text-gray-600">
                    Qty: <span className="font-medium tabular-nums">{listing.quantity}</span>
                  </span>

                  {/* Action Buttons */}
                  {isOwn ? (
                    /* Owner Controls */
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onOwnerQuantityChange?.(listing, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                        aria-label="Diminuisci quantità"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || listing.quantity >= 999}
                        onClick={() => onOwnerQuantityChange?.(listing, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        aria-label="Aumenta quantità"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOwnerEdit?.(listing)}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-gray-900 shadow-sm transition hover:bg-amber-500"
                        aria-label="Modifica inserzione"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    /* Buy Button */
                    <button
                      type="button"
                      onClick={(e) => onAddToCart?.(listing, e)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm",
                        listing.has_brx_express
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-200"
                          : "bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 hover:border-orange-300"
                      )}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {listing.has_brx_express && <BrxExpressIcon size="sm" />}
                      <span>Acquista</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
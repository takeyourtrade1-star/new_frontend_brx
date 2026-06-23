'use client';

import { Tag, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardDocument } from '@/lib/product-detail';
import type { ListingItem } from '@/lib/api/sync-client';
import type { MarketplaceRow } from '@/lib/product-detail/marketplace-rows';
import {
  CONDITION_FILTER_OPTIONS,
  MARKETPLACE_LANGUAGE_FILTER_OPTIONS,
  type MarketplaceSort,
} from '@/lib/product-detail/marketplace-rows';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { CountrySelect, type CountryOption } from '@/components/ui/CountrySelect';
import { ConditionBadge, type ConditionCode } from '@/components/ui/ConditionBadge';
import { ModernSellerTable } from '@/components/feature/product/ModernSellerTable';
import { ProductAuctionsPanel } from '@/components/feature/product/ProductAuctionsPanel';

export interface ProductDetailMarketplaceSectionProps {
  filtersOpen: boolean;
  onFiltersOpen: () => void;
  onFiltersClose: () => void;
  sellerSubTab: 'VENDITORI' | 'ASTE' | 'TCG_EXPRESS';
  onSellerSubTabChange: (tab: 'VENDITORI' | 'ASTE' | 'TCG_EXPRESS') => void;
  hideAuctions: boolean;
  onHideAuctionsChange: (value: boolean) => void;
  listingsSort: MarketplaceSort;
  onListingsSortChange: (sort: MarketplaceSort) => void;
  countryOptions: CountryOption[];
  posizioneVenditore: string;
  onPosizioneVenditoreChange: (value: string) => void;
  tipoVenditore: string | null;
  onTipoVenditoreChange: (value: string | null) => void;
  condizioneMinima: ConditionCode | null;
  onCondizioneMinimaChange: (value: ConditionCode | null) => void;
  linguaCarta: string | null;
  onLinguaCartaChange: (value: string | null) => void;
  firmata: 'SÌ' | 'NO' | 'ENTRAMBI';
  onFirmataChange: (value: 'SÌ' | 'NO' | 'ENTRAMBI') => void;
  alterata: 'SÌ' | 'NO' | 'ENTRAMBI';
  onAlterataChange: (value: 'SÌ' | 'NO' | 'ENTRAMBI') => void;
  quantita: number;
  onQuantitaChange: (value: number) => void;
  soloFoil: boolean;
  onSoloFoilChange: (value: boolean) => void;
  sortLabel: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortSeller: string;
  sortCondition: string;
  hideAuctionsLabel: string;
  minConditionLabel: string;
  anyFilterLabel: string;
  cardLanguageLabel: string;
  tabsAriaLabel: string;
  inVenditaLabel: string;
  asteLabel: string;
  brxExpressLabel: string;
  brxNewLabel: string;
  tabsHint: string;
  listingActionMessage: string | null;
  sortedMarketplaceRows: MarketplaceRow[];
  listingsLoading: boolean;
  auctionsLoading: boolean;
  listingsError: string | null;
  marketplaceEmptyMessage: string | undefined;
  card?: CardDocument;
  cardImageSrc: string;
  onAddToCart: (item: ListingItem, quantity: number, sourceEl: HTMLElement) => void;
  onBuyNow: (item: ListingItem, quantity: number) => void;
  onProposeTrade: (item: ListingItem) => void;
  isOwnListing: (item: ListingItem) => boolean;
  onOwnerEdit: (item: ListingItem) => void;
  onOwnerQuantityChange: (item: ListingItem, delta: -1 | 1) => Promise<void>;
  rowBusyId: string | null;
}

export function ProductDetailMarketplaceSection({
  filtersOpen,
  onFiltersOpen,
  onFiltersClose,
  sellerSubTab,
  onSellerSubTabChange,
  hideAuctions,
  onHideAuctionsChange,
  listingsSort,
  onListingsSortChange,
  countryOptions,
  posizioneVenditore,
  onPosizioneVenditoreChange,
  tipoVenditore,
  onTipoVenditoreChange,
  condizioneMinima,
  onCondizioneMinimaChange,
  linguaCarta,
  onLinguaCartaChange,
  firmata,
  onFirmataChange,
  alterata,
  onAlterataChange,
  quantita,
  onQuantitaChange,
  soloFoil,
  onSoloFoilChange,
  sortLabel,
  sortPriceAsc,
  sortPriceDesc,
  sortSeller,
  sortCondition,
  hideAuctionsLabel,
  minConditionLabel,
  anyFilterLabel,
  cardLanguageLabel,
  tabsAriaLabel,
  inVenditaLabel,
  asteLabel,
  brxExpressLabel,
  brxNewLabel,
  tabsHint,
  listingActionMessage,
  sortedMarketplaceRows,
  listingsLoading,
  auctionsLoading,
  listingsError,
  marketplaceEmptyMessage,
  card,
  cardImageSrc,
  onAddToCart,
  onBuyNow,
  onProposeTrade,
  isOwnListing,
  onOwnerEdit,
  onOwnerQuantityChange,
  rowBusyId,
}: ProductDetailMarketplaceSectionProps) {
  return (
    <section className="w-full bg-[#F0F0F0] border-t border-gray-300">
      <div className="container-content container-content-card-detail py-2.5 sm:py-3 lg:py-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch">
          <aside
            className={cn(
              'flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out',
              filtersOpen ? 'w-full lg:w-[280px] xl:w-[300px]' : 'w-full lg:w-14'
            )}
          >
            {!filtersOpen ? (
              <button
                type="button"
                onClick={onFiltersOpen}
                className="w-full lg:h-full lg:min-h-[200px] flex items-center justify-center gap-2 lg:flex-col lg:gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:bg-gray-50 transition-colors"
                aria-label="Apri filtri"
              >
                <svg className="h-4 w-4 text-gray-600 shrink-0 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-xs font-bold uppercase text-gray-600 lg:hidden">Filtri</span>
                <svg className="h-5 w-5 text-gray-600 shrink-0 hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-[10px] font-bold uppercase text-zinc-600 hidden lg:inline leading-none">FILTRI</span>
              </button>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm h-full min-w-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase text-gray-900">Filtri</span>
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={onFiltersClose}
                    className="flex items-center justify-center rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    aria-label="Chiudi filtri"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  {sellerSubTab === 'VENDITORI' && (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={hideAuctions}
                        onChange={(e) => onHideAuctionsChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                      />
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                        {hideAuctionsLabel}
                      </span>
                    </label>
                  )}
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-600">{sortLabel}</label>
                    <select
                      value={listingsSort}
                      onChange={(e) => onListingsSortChange(e.target.value as MarketplaceSort)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                    >
                      <option value="price_asc">{sortPriceAsc}</option>
                      <option value="price_desc">{sortPriceDesc}</option>
                      <option value="seller">{sortSeller}</option>
                      <option value="condition">{sortCondition}</option>
                    </select>
                  </div>
                  {sellerSubTab === 'VENDITORI' && (
                    <>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-gray-600">
                          Posizione venditore
                        </label>
                        <CountrySelect
                          options={countryOptions}
                          value={posizioneVenditore}
                          onChange={onPosizioneVenditoreChange}
                          size="sm"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase text-gray-600">Tipo venditore</label>
                        <div className="flex flex-wrap gap-2">
                          {(['PRIVATO', 'PROFESSIONALE', 'POWERSELLER'] as const).map((tipo) => (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => onTipoVenditoreChange(tipoVenditore === tipo ? null : tipo)}
                              className={cn(
                                'rounded-full px-3 py-1.5 text-xs font-bold uppercase',
                                tipoVenditore === tipo ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              )}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase text-gray-600">
                          {minConditionLabel}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => onCondizioneMinimaChange(null)}
                            className={cn(
                              'rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                              condizioneMinima === null
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            )}
                          >
                            {anyFilterLabel}
                          </button>
                          {CONDITION_FILTER_OPTIONS.map((code) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => onCondizioneMinimaChange(condizioneMinima === code ? null : code)}
                              className={cn(
                                'rounded ring-2 ring-offset-1 transition',
                                condizioneMinima === code ? 'ring-[#FF8800]' : 'ring-transparent opacity-80 hover:opacity-100'
                              )}
                              aria-pressed={condizioneMinima === code}
                            >
                              <ConditionBadge condition={code} size="md" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase text-gray-600">
                          {cardLanguageLabel}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => onLinguaCartaChange(null)}
                            className={cn(
                              'rounded-full px-2 py-1 text-[10px] font-bold',
                              linguaCarta === null ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'
                            )}
                          >
                            {anyFilterLabel}
                          </button>
                          {MARKETPLACE_LANGUAGE_FILTER_OPTIONS.map(({ code }) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => onLinguaCartaChange(linguaCarta === code ? null : code)}
                              className={cn(
                                'flex h-8 w-10 items-center justify-center rounded border transition',
                                linguaCarta === code
                                  ? 'border-[#FF8800] bg-orange-50 ring-1 ring-orange-300'
                                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                              )}
                              title={code}
                            >
                              <FlagIcon country={code} size="sm" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">Firmata</label>
                    <div className="flex flex-wrap gap-2">
                      {(['SÌ', 'NO', 'ENTRAMBI'] as const).map((v) => (
                        <button key={v} type="button" onClick={() => onFirmataChange(v)} className={cn('rounded-full px-3 py-1.5 text-xs font-bold', firmata === v ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">Alterata</label>
                    <div className="flex flex-wrap gap-2">
                      {(['SÌ', 'NO', 'ENTRAMBI'] as const).map((v) => (
                        <button key={v} type="button" onClick={() => onAlterataChange(v)} className={cn('rounded-full px-3 py-1.5 text-xs font-bold', alterata === v ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Quantità</label>
                    <input
                      type="number"
                      min={1}
                      value={quantita}
                      onChange={(e) => onQuantitaChange(Number(e.target.value) || 1)}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                      placeholder="Inserire quantità"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-gray-600">Solo foil?</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={soloFoil}
                      onClick={() => onSoloFoilChange(!soloFoil)}
                      className={cn(
                        'relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8800]/40',
                        soloFoil
                          ? 'bg-[#FF8800] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_0_12px_rgba(255,136,0,0.45)]'
                          : 'bg-gray-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-6 w-6 transform rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.22),0_0_2px_rgba(0,0,0,0.08)] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] will-change-transform',
                          soloFoil ? 'translate-x-6' : 'translate-x-0.5'
                        )}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div
              className="border-b border-gray-200 bg-white px-2 pt-2 sm:px-3 sm:pt-3"
              role="tablist"
              aria-label={tabsAriaLabel}
            >
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                <div
                  className="flex min-w-0 flex-1 rounded-xl bg-slate-100/80 p-1 ring-1 ring-inset ring-slate-200/70"
                  role="presentation"
                >
                  {(
                    [
                      { id: 'VENDITORI' as const, label: inVenditaLabel, icon: 'vendita' },
                      { id: 'ASTE' as const, label: asteLabel, icon: 'aste' },
                    ] as const
                  ).map((tab) => {
                    const iconClass = 'h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0';
                    const selected = sellerSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`pd-market-tab-${tab.id}`}
                        aria-selected={selected}
                        aria-controls={`pd-market-panel-${tab.id}`}
                        onClick={() => onSellerSubTabChange(tab.id)}
                        className={cn(
                          'group flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs',
                          selected
                            ? 'bg-white text-[#FF7300] shadow-sm ring-1 ring-slate-200/90'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {tab.icon === 'vendita' && (
                          <Tag className={iconClass} aria-hidden />
                        )}
                        {tab.icon === 'aste' && (
                          <AuctionGavelIcon className={iconClass} animated />
                        )}
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  role="tab"
                  id="pd-market-tab-TCG_EXPRESS"
                  aria-selected={sellerSubTab === 'TCG_EXPRESS'}
                  aria-controls="pd-market-panel-TCG_EXPRESS"
                  onClick={() => onSellerSubTabChange('TCG_EXPRESS')}
                  className={cn(
                    'relative flex shrink-0 items-center justify-center gap-1 self-center rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition-all',
                    sellerSubTab === 'TCG_EXPRESS'
                      ? 'bg-white text-[#FF7300] shadow-sm ring-2 ring-[#FF7300]/30'
                      : 'bg-white text-orange-600/90 ring-1 ring-gray-200 hover:bg-orange-50/60'
                  )}
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{brxExpressLabel}</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500 px-1 text-[7px] font-bold leading-[1.6] text-white">
                    {brxNewLabel}
                  </span>
                </button>
              </div>
              <p className="pb-2 text-[11px] text-gray-500 sm:text-xs">{tabsHint}</p>
            </div>
            {sellerSubTab === 'VENDITORI' && (
              <div
                id="pd-market-panel-VENDITORI"
                role="tabpanel"
                aria-labelledby="pd-market-tab-VENDITORI"
                className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {listingActionMessage && (
                  <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{listingActionMessage}</div>
                )}
                <ModernSellerTable
                  rows={sortedMarketplaceRows}
                  loading={listingsLoading}
                  auctionsLoading={auctionsLoading}
                  error={listingsError}
                  emptyMessage={marketplaceEmptyMessage}
                  cardImageSrc={cardImageSrc}
                  cardName={card?.name}
                  cardLanguage={card?.available_languages?.[0] ?? null}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                  onProposeTrade={onProposeTrade}
                  isOwnListing={isOwnListing}
                  onOwnerEdit={onOwnerEdit}
                  onOwnerQuantityChange={onOwnerQuantityChange}
                  busyItemId={rowBusyId}
                />
              </div>
            )}
            {sellerSubTab === 'ASTE' && card && (
              <div
                id="pd-market-panel-ASTE"
                role="tabpanel"
                aria-labelledby="pd-market-tab-ASTE"
              >
                <ProductAuctionsPanel card={card} />
              </div>
            )}
            {sellerSubTab === 'TCG_EXPRESS' && (
              <div
                id="pd-market-panel-TCG_EXPRESS"
                role="tabpanel"
                aria-labelledby="pd-market-tab-TCG_EXPRESS"
                className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/60 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-500/20">
                    <Zap className="h-6 w-6 text-white" aria-hidden />
                  </div>
                  <p className="text-sm font-extrabold uppercase tracking-wide text-orange-700">BRX Express</p>
                  <p className="mt-1 text-sm text-orange-600/80">Spedizione ultra-rapida per le tue carte. Presto disponibile.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

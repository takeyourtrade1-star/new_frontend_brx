'use client';

import { useMemo, useState } from 'react';
import { Filter, ChevronDown, MapPin, Shield } from 'lucide-react';
import { CountrySelect, type CountryOption } from '@/components/ui/CountrySelect';
import { COUNTRIES } from '@/lib/registrati/schema';
import { BrxExpressIcon } from '@/components/ui/BrxExpressIcon';
import { cn } from '@/lib/utils';

interface ModernSellerFiltersProps {
  // Sort options
  sortBy: string;
  setSortBy: (value: string) => void;
  
  // Location filter  
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  
  // Seller type filters
  showPrivate: boolean;
  setShowPrivate: (value: boolean) => void;
  showProfessional: boolean;
  setShowProfessional: (value: boolean) => void;
  showPowerSeller: boolean;
  setShowPowerSeller: (value: boolean) => void;
  
  // Other filters
  onlyFoil: boolean;
  setOnlyFoil: (value: boolean) => void;
  onlyBrxExpress: boolean;
  setOnlyBrxExpress: (value: boolean) => void;
  onlySignedCards: boolean;
  setOnlySignedCards: (value: boolean) => void;
  minCondition: string;
  setMinCondition: (value: string) => void;
}

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Prezzo crescente' },
  { value: 'price_desc', label: 'Prezzo decrescente' },
  { value: 'seller_name', label: 'Nome venditore' },
  { value: 'condition', label: 'Condizione' },
  { value: 'quantity', label: 'Quantità disponibile' },
];

const CONDITION_OPTIONS = [
  { value: 'any', label: 'Qualsiasi condizione' },
  { value: 'NM', label: 'Near Mint o migliore' },
  { value: 'SP', label: 'Slightly Played o migliore' },
  { value: 'MP', label: 'Moderately Played o migliore' },
  { value: 'PL', label: 'Played o migliore' },
];

export function ModernSellerFilters({
  sortBy,
  setSortBy,
  selectedCountry,
  setSelectedCountry,
  showPrivate,
  setShowPrivate,
  showProfessional,
  setShowProfessional,
  showPowerSeller,
  setShowPowerSeller,
  onlyFoil,
  setOnlyFoil,
  onlyBrxExpress,
  setOnlyBrxExpress,
  onlySignedCards,
  setOnlySignedCards,
  minCondition,
  setMinCondition,
}: ModernSellerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const countryOptions: CountryOption[] = useMemo(
    () => [
      { code: 'all', label: 'Tutti i paesi', flagCode: 'all' },
      ...COUNTRIES.map((c) => ({
        code: c.code,
        label: c.label,
        flagCode: c.code,
      })),
    ],
    []
  );

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Main Filter Bar */}
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Ordina per</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Country Filter */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Posizione venditore</label>
            <div className="relative">
              <CountrySelect
                options={countryOptions}
                value={selectedCountry}
                onChange={setSelectedCountry}
                placeholder="Tutti i paesi"
                className="w-[200px]"
                size="sm"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 ml-auto">
            {/* BRX Express Filter */}
            <button
              onClick={() => setOnlyBrxExpress(!onlyBrxExpress)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                onlyBrxExpress
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <BrxExpressIcon />
              <span>BRX Express</span>
            </button>

            {/* Expand Filters Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                isExpanded
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Filter className="h-4 w-4" />
              <span>Filtri</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>

      {/* Extended Filters */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Seller Types */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Tipo venditore
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPowerSeller}
                    onChange={(e) => setShowPowerSeller(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm">PowerSeller</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showProfessional}
                    onChange={(e) => setShowProfessional(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm">Professionali</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPrivate}
                    onChange={(e) => setShowPrivate(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm">Privati</span>
                </label>
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Condizione minima</label>
              <select
                value={minCondition}
                onChange={(e) => setMinCondition(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {CONDITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Special Options */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Opzioni speciali</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyFoil}
                    onChange={(e) => setOnlyFoil(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm">Solo Foil</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlySignedCards}
                    onChange={(e) => setOnlySignedCards(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm">Solo carte firmate</span>
                </label>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Filtri attivi</label>
              <div className="flex flex-wrap gap-1">
                {onlyBrxExpress && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    <BrxExpressIcon size="sm" />
                    BRX Express
                  </span>
                )}
                {onlyFoil && (
                  <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Foil
                  </span>
                )}
                {onlySignedCards && (
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Firmate
                  </span>
                )}
                {selectedCountry && selectedCountry !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <MapPin className="h-3 w-3" />
                    {selectedCountry}
                  </span>
                )}
                {minCondition && minCondition !== 'any' && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Min: {minCondition}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
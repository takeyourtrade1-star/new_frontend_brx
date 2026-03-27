'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X, ChevronDown, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

// Opzioni per i filtri
const RARITIES = [
  { value: 'common', label: 'Common', color: '#1a1a1a' },
  { value: 'uncommon', label: 'Uncommon', color: '#707883' },
  { value: 'rare', label: 'Rare', color: '#d7b03e' },
  { value: 'mythic', label: 'Mythic Rare', color: '#e85f1c' },
  { value: 'special', label: 'Special', color: '#c25ae6' },
];

const CONDITIONS = [
  { value: 'mt', label: 'Mint (MT)' },
  { value: 'nm', label: 'Near Mint (NM)' },
  { value: 'ex', label: 'Excellent (EX)' },
  { value: 'gd', label: 'Good (GD)' },
  { value: 'lp', label: 'Light Played (LP)' },
  { value: 'pl', label: 'Played (PL)' },
  { value: 'po', label: 'Poor (PO)' },
];

const COLORS = [
  { value: 'white', label: 'Bianco', mana: 'W', bg: '#f9f7eb', border: '#e6d788' },
  { value: 'blue', label: 'Blu', mana: 'U', bg: '#d4e4f4', border: '#7eb8e6' },
  { value: 'black', label: 'Nero', mana: 'B', bg: '#d6d3d3', border: '#8a8a8a' },
  { value: 'red', label: 'Rosso', mana: 'R', bg: '#f4d4d4', border: '#e67e7e' },
  { value: 'green', label: 'Verde', mana: 'G', bg: '#d4f4d4', border: '#7ee67e' },
  { value: 'colorless', label: 'Incolore', mana: 'C', bg: '#e8e8e8', border: '#b8b8b8' },
  { value: 'multicolor', label: 'Multicolore', mana: 'M', bg: 'linear-gradient(135deg, #d4e4f4 25%, #f4d4d4 50%, #d4f4d4 75%)', border: '#d7b03e' },
];

const CARD_TYPES = [
  { value: 'creature', label: 'Creatura' },
  { value: 'instant', label: 'Istantaneo' },
  { value: 'sorcery', label: 'Stregoneria' },
  { value: 'enchantment', label: 'Incantesimo' },
  { value: 'artifact', label: 'Artefatto' },
  { value: 'planeswalker', label: 'Planeswalker' },
  { value: 'land', label: 'Terra' },
  { value: 'battle', label: 'Battaglia' },
];

const LANGUAGES = [
  { value: 'en', label: 'Inglese' },
  { value: 'de', label: 'Tedesco' },
  { value: 'es', label: 'Spagnolo' },
  { value: 'fr', label: 'Francese' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Portoghese' },
];

const PRINTINGS = [
  { value: 'foil', label: 'Foil' },
  { value: 'nonfoil', label: 'Non-Foil' },
  { value: 'etched', label: 'Foil Etched' },
  { value: 'glossy', label: 'Glossy' },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1D3160]">
          {title}
        </h3>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      {isOpen && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdvancedSearchPage() {
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedPrintings, setSelectedPrintings] = useState<string[]>([]);
  const [colorMatchMode, setColorMatchMode] = useState<'exactly' | 'including' | 'at-most'>('including');

  const toggleSelection = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedRarities([]);
    setSelectedConditions([]);
    setSelectedColors([]);
    setSelectedTypes([]);
    setSelectedLanguages([]);
    setSelectedPrintings([]);
  };

  const hasActiveFilters = 
    selectedRarities.length > 0 ||
    selectedConditions.length > 0 ||
    selectedColors.length > 0 ||
    selectedTypes.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedPrintings.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f0f4f8]">
      <Header />
      
      <div className="container-content py-6 lg:py-10">
        {/* Banner presto in arrivo */}
        <div className="pointer-events-none mb-6 flex justify-center">
          <PrestoInArrivoBanner />
        </div>
        {/* Header pagina */}
        <div className="mb-8 text-center lg:mb-10">
          <h1 className="text-2xl font-bold text-[#1D3160] lg:text-4xl">
            Ricerca Avanzata <span className="text-[#FF7300]">Singole</span>
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 lg:text-base">
            Trova carte singole precise con filtri dettagliati per espansione, rarità, condizione e altro.
          </p>
        </div>

        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar filtri - Mobile: sopra, Desktop: sinistra */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-4 space-y-4">
              {/* Pannello filtri */}
              <div className="rounded-2xl border border-white/50 bg-white/80 shadow-xl shadow-gray-200/30 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#FF7300]" />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-[#1D3160]">
                      Filtri
                    </h2>
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                      Azzera
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {/* Ricerca testuale */}
                  <FilterSection title="Nome carta" defaultOpen={true}>
                    <Input
                      type="text"
                      placeholder="Cerca per nome..."
                      className="h-10 rounded-xl border-gray-200 bg-white text-sm placeholder:text-gray-400 focus-visible:ring-[#FF7300]"
                    />
                  </FilterSection>

                  {/* Espansione */}
                  <FilterSection title="Espansione" defaultOpen={true}>
                    <Input
                      type="text"
                      placeholder="Cerca espansione..."
                      className="h-10 rounded-xl border-gray-200 bg-white text-sm placeholder:text-gray-400 focus-visible:ring-[#FF7300]"
                    />
                  </FilterSection>

                  {/* Rarità */}
                  <FilterSection title="Rarità" defaultOpen={true}>
                    <div className="space-y-2">
                      {RARITIES.map((rarity) => (
                        <label
                          key={rarity.value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedRarities.includes(rarity.value)}
                            onCheckedChange={() => toggleSelection(rarity.value, selectedRarities, setSelectedRarities)}
                          />
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: rarity.color }}
                            />
                            <span className="text-sm text-gray-700">{rarity.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Condizione */}
                  <FilterSection title="Condizione" defaultOpen={false}>
                    <div className="space-y-2">
                      {CONDITIONS.map((condition) => (
                        <label
                          key={condition.value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedConditions.includes(condition.value)}
                            onCheckedChange={() => toggleSelection(condition.value, selectedConditions, setSelectedConditions)}
                          />
                          <span className="text-sm text-gray-700">{condition.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Colore */}
                  <FilterSection title="Colore" defaultOpen={false}>
                    <div className="mb-3 flex gap-1 rounded-lg bg-gray-50 p-1">
                      {[
                        { value: 'including', label: 'Inclusi' },
                        { value: 'exactly', label: 'Esatti' },
                        { value: 'at-most', label: 'Max' },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setColorMatchMode(mode.value as typeof colorMatchMode)}
                          className={cn(
                            "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                            colorMatchMode === mode.value
                              ? "bg-white text-[#FF7300] shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => toggleSelection(color.value, selectedColors, setSelectedColors)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-2.5 transition-all",
                            selectedColors.includes(color.value)
                              ? "border-[#FF7300] bg-[#FF7300]/5 ring-1 ring-[#FF7300]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          )}
                        >
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                            style={{
                              background: color.bg,
                              border: `2px solid ${color.border}`,
                              color: color.value === 'white' ? '#666' : color.value === 'multicolor' ? '#333' : '#333',
                            }}
                          >
                            {color.mana}
                          </span>
                          <span className="text-xs font-medium text-gray-700">{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Tipo */}
                  <FilterSection title="Tipo carta" defaultOpen={false}>
                    <div className="space-y-2">
                      {CARD_TYPES.map((type) => (
                        <label
                          key={type.value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedTypes.includes(type.value)}
                            onCheckedChange={() => toggleSelection(type.value, selectedTypes, setSelectedTypes)}
                          />
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Lingua */}
                  <FilterSection title="Lingua" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => toggleSelection(lang.value, selectedLanguages, setSelectedLanguages)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                            selectedLanguages.includes(lang.value)
                              ? "border-[#FF7300] bg-[#FF7300]/5 text-[#FF7300]"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Finitura */}
                  <FilterSection title="Finitura" defaultOpen={false}>
                    <div className="space-y-2">
                      {PRINTINGS.map((printing) => (
                        <label
                          key={printing.value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedPrintings.includes(printing.value)}
                            onCheckedChange={() => toggleSelection(printing.value, selectedPrintings, setSelectedPrintings)}
                          />
                          <span className="text-sm text-gray-700">{printing.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Prezzo */}
                  <FilterSection title="Prezzo" defaultOpen={false}>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                        <Input
                          type="number"
                          placeholder="Min"
                          className="h-10 pl-7 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#FF7300]"
                        />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          className="h-10 pl-7 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#FF7300]"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  {/* Disponibilità */}
                  <FilterSection title="Disponibilità" defaultOpen={false}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                      <Checkbox />
                      <span className="text-sm text-gray-700">Solo carte disponibili</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                      <Checkbox />
                      <span className="text-sm text-gray-700">Solo con foto</span>
                    </label>
                  </FilterSection>
                </div>
              </div>

              {/* Bottone cerca mobile */}
              <Button
                className="w-full bg-[#FF7300] font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/20 hover:bg-[#FF7300]/90 lg:hidden"
                size="lg"
              >
                <Search className="mr-2 h-4 w-4" />
                Cerca carte
              </Button>
            </div>
          </div>

          {/* Area risultati - non cliccabile */}
          <div className="pointer-events-none mt-6 lg:col-span-7 lg:mt-0 xl:col-span-8">
            {/* Barra azioni desktop */}
            <div className="mb-4 hidden items-center justify-between lg:flex">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Package className="h-4 w-4" />
                <span>Inserisci i filtri e clicca Cerca per vedere i risultati</span>
              </div>
              <Button
                className="bg-[#FF7300] font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/20 hover:bg-[#FF7300]/90"
                size="lg"
              >
                <Search className="mr-2 h-4 w-4" />
                Cerca carte
              </Button>
            </div>

            {/* Placeholder risultati */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#1D3160]">
                Inizia la ricerca
              </h3>
              <p className="mx-auto max-w-sm text-sm text-gray-500">
                Usa i filtri a sinistra per definire i criteri di ricerca, poi clicca "Cerca carte" per trovare le singole che fanno al caso tuo.
              </p>
            </div>

            {/* Badge filtri attivi */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedRarities.map((r) => {
                  const rarity = RARITIES.find(x => x.value === r);
                  return (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 rounded-full bg-[#FF7300]/10 px-3 py-1 text-xs font-medium text-[#FF7300]"
                    >
                      {rarity?.label}
                      <button
                        type="button"
                        onClick={() => toggleSelection(r, selectedRarities, setSelectedRarities)}
                        className="ml-1 rounded-full hover:bg-[#FF7300]/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedConditions.map((c) => {
                  const cond = CONDITIONS.find(x => x.value === c);
                  return (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                    >
                      {cond?.label}
                      <button
                        type="button"
                        onClick={() => toggleSelection(c, selectedConditions, setSelectedConditions)}
                        className="ml-1 rounded-full hover:bg-blue-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedColors.map((c) => {
                  const color = COLORS.find(x => x.value === c);
                  return (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {color?.label}
                      <button
                        type="button"
                        onClick={() => toggleSelection(c, selectedColors, setSelectedColors)}
                        className="ml-1 rounded-full hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

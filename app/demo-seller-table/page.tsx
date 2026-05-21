'use client';

import { useState } from 'react';
import { ModernSellerTable } from '@/components/feature/product/ModernSellerTable';
import { ModernSellerFilters } from '@/components/feature/product/ModernSellerFilters';

// Mock data per testare la tabella
const MOCK_LISTINGS = [
  {
    item_id: 'item_1',
    seller_display_name: 'LCDT14',
    seller_id: 'user_1',
    condition: 'Near Mint',
    price_cents: 30000, // 300€
    quantity: 5,
    country: 'IT',
    mtg_language: 'EN',
    is_foil: false,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    item_id: 'item_2', 
    seller_display_name: 'JULIAN',
    seller_id: 'user_2',
    condition: 'Lightly Played',
    price_cents: 30000, // 300€
    quantity: 1,
    country: 'FR',
    mtg_language: 'EN',
    is_foil: true,
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    item_id: 'item_3',
    seller_display_name: 'LCDT',
    seller_id: 'user_3', 
    condition: 'Near Mint',
    price_cents: 30000, // 300€
    quantity: 5,
    country: 'IT',
    mtg_language: 'EN',
    is_foil: false,
    created_at: '2024-01-03T00:00:00Z',
  },
];

export default function DemoSellerTablePage() {
  // Filter states
  const [sortBy, setSortBy] = useState('price_asc');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [showPrivate, setShowPrivate] = useState(true);
  const [showProfessional, setShowProfessional] = useState(true);
  const [showPowerSeller, setShowPowerSeller] = useState(true);
  const [onlyFoil, setOnlyFoil] = useState(false);
  const [onlyBrxExpress, setOnlyBrxExpress] = useState(false);
  const [onlySignedCards, setOnlySignedCards] = useState(false);
  const [minCondition, setMinCondition] = useState('any');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Demo Tabella Venditori Moderna
        </h1>
        
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Modern Filters */}
          <ModernSellerFilters
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            showPrivate={showPrivate}
            setShowPrivate={setShowPrivate}
            showProfessional={showProfessional}
            setShowProfessional={setShowProfessional}
            showPowerSeller={showPowerSeller}
            setShowPowerSeller={setShowPowerSeller}
            onlyFoil={onlyFoil}
            setOnlyFoil={setOnlyFoil}
            onlyBrxExpress={onlyBrxExpress}
            setOnlyBrxExpress={setOnlyBrxExpress}
            onlySignedCards={onlySignedCards}
            setOnlySignedCards={setOnlySignedCards}
            minCondition={minCondition}
            setMinCondition={setMinCondition}
          />
          
          {/* Modern Seller Table */}
          <div className="p-4">
            <ModernSellerTable
              listings={MOCK_LISTINGS}
              loading={false}
              error={null}
              onAddToCart={(item, event) => {
                console.log('Add to cart:', item);
                alert(`Aggiungendo ${item.seller_display_name} al carrello!`);
              }}
              isOwnListing={() => false}
              onOwnerEdit={(item) => console.log('Edit:', item)}
              onOwnerQuantityChange={async (item, delta) => {
                console.log('Quantity change:', item, delta);
              }}
              busyItemId={null}
            />
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Questa è una demo della nuova tabella venditori moderna per EBARTEX.</p>
          <p>I dati sono mock e includono BRX Express sul primo elemento.</p>
        </div>
      </div>
    </div>
  );
}
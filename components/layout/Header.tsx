'use client';

import { TopBar } from './TopBar';
import GlobalSearchBar from './GlobalSearchBar';
import { ProdottiMenu } from './ProdottiMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full font-sans text-white bg-[#1D3160]" style={{ borderTop: '2px solid #1D3160' }}>
      <div className="w-full" style={{ backgroundColor: '#1D3160' }}>
        <div className="w-full px-1 sm:px-2">
          <TopBar />
        </div>
      </div>

      {/* Barra ricerca globale Meilisearch: gioco + lingua + input + suggerimenti (stesso stile di frontend-vecchio) */}
      <div className="w-full bg-white border-b border-gray-100 overflow-visible">
        <div className="w-full px-1 sm:px-2 overflow-visible">
          <div className="flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-4 sm:pl-3 pb-3 pt-2 overflow-visible">
            <div className="sm:order-1 flex-shrink-0">
              <ProdottiMenu />
            </div>
            <div className="order-1 w-full sm:order-2 sm:min-w-0 sm:flex-1 sm:pr-4">
              <GlobalSearchBar />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import { TopBar } from './TopBar';
import GlobalSearchBar from './GlobalSearchBar';
import { ProdottiMenu } from './ProdottiMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full font-sans text-white bg-[#1D3160]" style={{ borderTop: '2px solid #1D3160' }}>
      {/* Top bar con z-index più alto così i dropdown (Account, Acquisti) appaiono sopra la barra di ricerca */}
      <div className="relative z-20 w-full" style={{ backgroundColor: '#1D3160' }}>
        <div className="container-content">
          <TopBar />
        </div>
      </div>

      {/* Barra ricerca globale Meilisearch: gioco + lingua + input + suggerimenti — sfondo blu, senza bordo sotto */}
      <div className="relative z-10 w-full overflow-visible" style={{ backgroundColor: '#1D3160' }}>
        <div className="container-content overflow-visible">
          <div className="middle-bar flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-2 py-1.5 overflow-visible">
            <div className="sm:order-1 flex-shrink-0">
              <ProdottiMenu />
            </div>
            <div className="order-1 w-full sm:order-2 sm:min-w-0 sm:flex-1">
              <GlobalSearchBar />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

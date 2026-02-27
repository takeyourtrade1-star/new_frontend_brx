'use client';

import { TopBar } from './TopBar';
import GlobalSearchBar from './GlobalSearchBar';
import { ProdottiMenu } from './ProdottiMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full font-sans text-white bg-[#1D3160]">
      {/* Top bar */}
      <div className="relative z-20 w-full" style={{ backgroundColor: '#1D3160' }}>
        <div className="container-content container-header">
          <TopBar />
        </div>
      </div>

      {/* Barra ricerca: attaccata alla top bar, nessun gap */}
      <div className="relative z-10 w-full overflow-visible" style={{ backgroundColor: '#1D3160' }}>
        <div className="container-content container-header overflow-visible">
          <div className="middle-bar flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-3 overflow-visible" style={{ paddingTop: '3px', paddingBottom: '3px' }}>
            <div className="sm:order-1 flex-shrink-0 flex items-stretch">
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

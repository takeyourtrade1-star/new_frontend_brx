'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { TopBar } from './TopBar';
import GlobalSearchBar from './GlobalSearchBar';
import { ProdottiMenu } from './ProdottiMenu';

export function Header({ transparent = false }: { transparent?: boolean }) {
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  // Per `position: fixed` serve uno spacer per non coprire il contenuto sotto.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderHeight(el.getBoundingClientRect().height);
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <header
        ref={(n) => {
          headerRef.current = n;
        }}
        className={`fixed top-0 left-0 right-0 z-[100] w-full font-sans text-white ${transparent ? 'bg-transparent' : 'bg-[#1D3160]'}`}
      >
      {/* Top bar */}
      <div className={`relative z-20 w-full pb-0 ${transparent ? 'bg-transparent' : ''}`} style={transparent ? {} : { backgroundColor: '#1D3160' }}>
        <div className="container-content container-header">
          <TopBar />
        </div>
      </div>

      {/* Barra ricerca: stessa fascia, minimo spazio rispetto alla riga logo/menu */}
      <div className={`relative z-10 w-full overflow-visible pt-0 ${transparent ? 'bg-transparent' : ''}`} style={transparent ? {} : { backgroundColor: '#1D3160' }}>
        <div className="container-content container-header overflow-visible">
          <div className="middle-bar flex flex-row items-stretch gap-2 overflow-visible py-0 pb-1.5 md:gap-3 md:py-1">
            <div className="flex shrink-0 items-stretch md:min-h-11">
              <ProdottiMenu isSquared={searchOpen} />
            </div>
            <div className="flex min-h-[2.75rem] min-w-0 flex-1 items-stretch md:min-h-0">
              <GlobalSearchBar onOpenChange={setSearchOpen} />
            </div>
          </div>
        </div>
      </div>
      </header>
      {/* Spacer per compensare l'header fixed */}
      {headerHeight > 0 ? <div style={{ height: headerHeight }} aria-hidden /> : null}
    </>
  );
}

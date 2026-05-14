'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { TopBar } from './TopBar';
import { ProdottiMenu } from './ProdottiMenu';
import { DemoBanner } from './DemoBanner';
import { AuthToast } from './AuthToast';

// Import dinamico (ssr:false) per togliere react-instantsearch / instant-meilisearch
// dal bundle iniziale. Il fallback replica ESATTAMENTE le classi del wrapper più
// esterno di GlobalSearchBar (vedi `components/layout/GlobalSearchBar.tsx`,
// blocco `return ( <div className="flex w-full justify-center py-0 z-[99] font-sans h-full min-h-0" ...> )`)
// così lo spazio occupato durante l'idratazione è identico e non c'è layout shift.
const GlobalSearchBar = dynamic(() => import('./GlobalSearchBar'), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full justify-center py-0 z-[99] font-sans h-full min-h-0"
      style={{ overflow: 'visible' }}
      aria-hidden
    />
  ),
});

export function Header({
  transparent = false,
  reserveSpace = true,
}: {
  transparent?: boolean;
  reserveSpace?: boolean;
}) {
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
        className={`fixed top-0 left-0 right-0 z-[100] w-full font-display text-white ${transparent ? 'bg-transparent' : 'header-gradient'}`}
      >
      {/* Demo Banner - parte sopra dell'header */}
      <DemoBanner />

      {/* Top bar */}
      <div className="relative z-20 w-full pb-0">
        <div className="container-content container-header">
          <TopBar />
        </div>
      </div>

      {/* Barra ricerca: stessa fascia, minimo spazio rispetto alla riga logo/menu */}
      <div className="relative z-10 w-full overflow-visible pt-0">
        <div className="container-content container-header overflow-visible">
          <div className="middle-bar flex flex-row items-stretch gap-3 overflow-visible py-0 pb-1.5 md:gap-3 md:py-1">
            <div className={`shrink-0 items-stretch md:min-h-11 ${searchOpen ? 'hidden md:flex' : 'flex'}`}>
              <ProdottiMenu />
            </div>
            <div className="flex min-h-[2.75rem] min-w-0 flex-1 items-stretch md:min-h-0">
              <GlobalSearchBar onOpenChange={setSearchOpen} />
            </div>
          </div>
        </div>
      </div>
      </header>
      {/* Auth toast: appare subito sotto l'header, non sovrapposto al contenuto */}
      <AuthToast headerHeight={headerHeight} />
      {/* Spacer per compensare l'header fixed */}
      {reserveSpace && headerHeight > 0 ? <div style={{ height: headerHeight }} aria-hidden /> : null}
    </>
  );
}

'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { FixedPanelRect, SetResult } from '@/lib/search/global-search-types';
import { getSuggestionsPanelPosition } from '@/lib/search/global-search-panel-layout';
import { SetSearchResultRow } from '@/components/layout/search/SetSearchResultRow';

export function SetsResultsDropdown({
  suggestionsAnchorRef,
  jointRef,
  containerRef,
  setResults,
  setResultsLoading,
  onClose,
  layout = 'standalone',
}: {
  suggestionsAnchorRef: React.RefObject<HTMLDivElement | null>;
  jointRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setResults: SetResult[];
  setResultsLoading: boolean;
  onClose: () => void;
  layout?: 'standalone' | 'composite';
}) {
  const router = useRouter();
  const [position, setPosition] = useState<FixedPanelRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (layout === 'composite') return;
    if (!suggestionsAnchorRef.current) return;
    const anchorEl = suggestionsAnchorRef.current;
    const jointEl = jointRef.current;
    const update = () => {
      setPosition(getSuggestionsPanelPosition(anchorEl, jointEl));
    };
    update();
    const rafId = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(anchorEl);
    if (jointEl) resizeObserver.observe(jointEl);
    anchorEl.addEventListener('transitionend', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      anchorEl.removeEventListener('transitionend', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [layout, suggestionsAnchorRef, jointRef]);

  const setsBody = (
    <div
      ref={layout === 'composite' ? undefined : (containerRef as React.Ref<HTMLDivElement>)}
      className={`search-suggestions-panel__body flex flex-col ${
        layout === 'composite'
          ? 'max-h-[min(400px,calc(100vh-8rem))] min-h-[80px]'
          : 'max-h-[400px] min-h-[80px]'
      }`}
      role="listbox"
      aria-label="Suggerimenti set"
    >
      {setResultsLoading ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Ricerca...</span>
        </div>
      ) : setResults.length > 0 ? (
        <div className="overflow-y-auto flex-1">
          {setResults.map((r) => (
            <SetSearchResultRow
              key={r.set_name}
              result={r}
              onNavigate={() => {
                onClose();
                router.push(`/set?game=${r.game_slug}&set=${encodeURIComponent(r.set_name)}`);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-4 text-sm text-gray-500">Nessun set trovato.</div>
      )}
    </div>
  );

  if (layout === 'composite') {
    return setsBody;
  }

  if (!mounted || !position) return null;

  const content = (
    <div
      className="search-suggestions-panel !rounded-t-none !rounded-b-[20px] md:!rounded-b-[24px]"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 1001,
      }}
    >
      {setsBody}
    </div>
  );

  return createPortal(content, document.body);
}

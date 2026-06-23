'use client';

import { useEffect, useState, type RefObject } from 'react';

const FOOTER_SELECTOR = 'footer';
const FOOTER_GAP_PX = 16;
const MIN_PANEL_HEIGHT_PX = 120;

export interface FixedSidebarClampStyle {
  top: number;
  maxHeight: number;
}

/**
 * Sidebar fissa sotto l'header: resta visibile durante lo scroll ma non supera il footer.
 */
export function useFixedSidebarFooterClamp(
  panelRef: RefObject<HTMLElement | null>,
  defaultTop: number,
  footerGap = FOOTER_GAP_PX
): FixedSidebarClampStyle {
  // Init deterministico (no window): evita hydration mismatch; effect sotto corregge a mount.
  const [style, setStyle] = useState<FixedSidebarClampStyle>({
    top: defaultTop,
    maxHeight: 600,
  });

  useEffect(() => {
    setStyle((prev) => ({
      ...prev,
      top: defaultTop,
      maxHeight: window.innerHeight - defaultTop,
    }));
  }, [defaultTop]);

  useEffect(() => {
    // FE-REV-019: ogni scroll/resize legge il layout (getBoundingClientRect) e fa setStyle.
    // Coalesciamo gli eventi in un singolo update per frame con requestAnimationFrame per evitare jank.
    let rafId: number | null = null;

    const update = () => {
      const panel = panelRef.current;
      const viewportMax = window.innerHeight - defaultTop;

      if (!panel) {
        setStyle({ top: defaultTop, maxHeight: viewportMax });
        return;
      }

      const footer = document.querySelector(FOOTER_SELECTOR);
      if (!footer) {
        setStyle({ top: defaultTop, maxHeight: viewportMax });
        return;
      }

      const footerTop = footer.getBoundingClientRect().top;
      const limitBottom = footerTop - footerGap;

      let top = defaultTop;
      let maxHeight = viewportMax;

      if (top + maxHeight > limitBottom) {
        maxHeight = Math.max(MIN_PANEL_HEIGHT_PX, limitBottom - top);
      }

      const panelHeight = panel.getBoundingClientRect().height;
      if (top + panelHeight > limitBottom) {
        top = Math.max(0, limitBottom - panelHeight);
      }

      if (footerTop > window.innerHeight + 50) {
        top = defaultTop;
        maxHeight = viewportMax;
      }

      setStyle({ top, maxHeight });
    };

    const scheduleUpdate = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    const ro = new ResizeObserver(scheduleUpdate);
    const panel = panelRef.current;
    if (panel) ro.observe(panel);
    const footer = document.querySelector(FOOTER_SELECTOR);
    if (footer) ro.observe(footer);

    return () => {
      if (rafId != null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      ro.disconnect();
    };
  }, [defaultTop, footerGap, panelRef]);

  return style;
}

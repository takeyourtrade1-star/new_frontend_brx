import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Piano 1.3 — seam "galleria immagine" estratto da ProductDetailView.
 * Gestisce lightbox, anteprima hover (desktop), swipe touch, condivisione,
 * navigazione tra immagini, e la misura dell'altezza dell'header (per offset
 * di lightbox/hover). Comportamento identico all'inline precedente.
 */
export function useProductImageGallery({
  effectiveImageSrc,
  title,
}: {
  effectiveImageSrc: string;
  title: string;
}) {
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.getBoundingClientRect().height);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const [hoverPreviewOpen, setHoverPreviewOpen] = useState(false);
  const hoverPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FE-REV-010: il timeout di chiusura hover preview va pulito allo smontaggio
  // per evitare setState post-unmount.
  useEffect(() => {
    return () => {
      if (hoverPreviewTimeoutRef.current) clearTimeout(hoverPreviewTimeoutRef.current);
    };
  }, []);

  const cardImages = useMemo(() => [effectiveImageSrc], [effectiveImageSrc]);

  const handleLightboxOpen = useCallback(() => setIsLightboxOpen(true), []);
  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleHoverPreviewOpen = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return;
    if (hoverPreviewTimeoutRef.current) {
      clearTimeout(hoverPreviewTimeoutRef.current);
      hoverPreviewTimeoutRef.current = null;
    }
    setHoverPreviewOpen(true);
  }, []);

  const handleHoverPreviewClose = useCallback(() => {
    hoverPreviewTimeoutRef.current = setTimeout(() => {
      setHoverPreviewOpen(false);
    }, 250);
  }, []);

  const handleHoverPreviewCancelClose = useCallback(() => {
    if (hoverPreviewTimeoutRef.current) {
      clearTimeout(hoverPreviewTimeoutRef.current);
      hoverPreviewTimeoutRef.current = null;
    }
    setHoverPreviewOpen(true);
  }, []);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev: number) => (prev === 0 ? cardImages.length - 1 : prev - 1));
  }, [cardImages.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev: number) => (prev === cardImages.length - 1 ? 0 : prev + 1));
  }, [cardImages.length]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: title,
      text: `Check out ${title} on Ebartex!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copiato negli appunti!');
      } catch {
        // Clipboard failed
      }
    }
  }, [title]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // FE-REV-011: usa null-check esplicito così uno swipe che parte dal bordo
    // (clientX === 0) non viene scartato.
    if (touchStartX == null || touchEndX == null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNextImage();
    } else if (distance < -minSwipeDistance) {
      handlePrevImage();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  }, [touchStartX, touchEndX, handleNextImage, handlePrevImage]);

  return {
    headerHeight,
    isLightboxOpen,
    lightboxRef,
    currentImageIndex,
    cardImages,
    hoverPreviewOpen,
    handleLightboxOpen,
    handleLightboxClose,
    handleHoverPreviewOpen,
    handleHoverPreviewClose,
    handleHoverPreviewCancelClose,
    handlePrevImage,
    handleNextImage,
    handleShare,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

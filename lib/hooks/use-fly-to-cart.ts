'use client';

import { useCallback } from 'react';

interface FlyToCartOptions {
  /** Immagine da far volare (src). Se non fornita, usa un cerchio arancione */
  imageSrc?: string;
  /** Durata dell'animazione in ms */
  duration?: number;
}

function getVisibleCartIcon(): HTMLElement | null {
  const icons = document.querySelectorAll('[data-cart-icon="true"]');
  for (const el of icons) {
    const node = el as HTMLElement;
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

/**
 * Animazione "fly to cart" quando si aggiunge un prodotto.
 * Su mobile punta al FAB in basso a destra; su desktop all'icona in header.
 */
export function useFlyToCart() {
  const fly = useCallback((startElement: HTMLElement, options: FlyToCartOptions = {}) => {
    const { imageSrc, duration = 750 } = options;

    const cartIcon = getVisibleCartIcon();
    if (!cartIcon) return;

    const startRect = startElement.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    const flyer = document.createElement('div');
    flyer.style.position = 'fixed';
    flyer.style.zIndex = '9999';
    flyer.style.pointerEvents = 'none';
    flyer.style.left = `${startRect.left + startRect.width / 2}px`;
    flyer.style.top = `${startRect.top + startRect.height / 2}px`;
    flyer.style.width = '44px';
    flyer.style.height = '44px';
    flyer.style.marginLeft = '-22px';
    flyer.style.marginTop = '-22px';
    flyer.style.borderRadius = '50%';
    flyer.style.overflow = 'hidden';
    flyer.style.boxShadow = '0 6px 16px rgba(255,115,0,0.5)';
    flyer.style.transition = 'none';

    if (imageSrc) {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      flyer.appendChild(img);
    } else {
      flyer.style.background = 'linear-gradient(135deg, #FF7300, #FF8800)';
    }

    document.body.appendChild(flyer);
    flyer.getBoundingClientRect();

    const deltaX = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
    const deltaY = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
    const arcLift = Math.min(120, Math.abs(deltaY) * 0.35 + 40);

    const animation = flyer.animate(
      [
        {
          transform: 'translate(0, 0) scale(1)',
          opacity: 1,
        },
        {
          transform: `translate(${deltaX * 0.45}px, ${deltaY * 0.25 - arcLift}px) scale(0.85) rotate(8deg)`,
          opacity: 1,
          offset: 0.45,
        },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(0.15) rotate(0deg)`,
          opacity: 0.5,
        },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.15, 0.85, 0.25, 1)',
        fill: 'forwards',
      },
    );

    animation.onfinish = () => {
      cartIcon.classList.add('animate-cart-fab-land');
      const pop = cartIcon.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.2)' },
          { transform: 'scale(1)' },
        ],
        { duration: 280, easing: 'ease-out' },
      );

      pop.onfinish = () => {
        flyer.remove();
        window.setTimeout(() => {
          cartIcon.classList.remove('animate-cart-fab-land');
        }, 500);
      };
    };
  }, []);

  return fly;
}

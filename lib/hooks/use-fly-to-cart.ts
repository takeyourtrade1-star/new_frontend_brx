'use client';

import { useCallback } from 'react';

interface FlyToCartOptions {
  /** Immagine da far volare (src). Se non fornita, usa un cerchio arancione */
  imageSrc?: string;
  /** Durata dell'animazione in ms */
  duration?: number;
}

/**
 * Crea un'animazione "fly to cart" quando si aggiunge un prodotto.
 * L'elemento volante parte dal punto cliccato e arriva all'icona del carrello in header.
 */
export function useFlyToCart() {
  const fly = useCallback((startElement: HTMLElement, options: FlyToCartOptions = {}) => {
    const { imageSrc, duration = 700 } = options;

    // Trova l'icona del carrello nel DOM
    const cartIcon = document.querySelector('[data-cart-icon="true"]') as HTMLElement | null;
    if (!cartIcon) return;

    const startRect = startElement.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    // Crea l'elemento volante
    const flyer = document.createElement('div');
    flyer.style.position = 'fixed';
    flyer.style.zIndex = '9999';
    flyer.style.pointerEvents = 'none';
    flyer.style.left = `${startRect.left + startRect.width / 2}px`;
    flyer.style.top = `${startRect.top + startRect.height / 2}px`;
    flyer.style.width = '40px';
    flyer.style.height = '40px';
    flyer.style.marginLeft = '-20px';
    flyer.style.marginTop = '-20px';
    flyer.style.borderRadius = '50%';
    flyer.style.overflow = 'hidden';
    flyer.style.boxShadow = '0 4px 12px rgba(255,115,0,0.4)';
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

    // Forza reflow
    flyer.getBoundingClientRect();

    // Calcola la traiettoria con una curva (arco)
    const deltaX = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
    const deltaY = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

    // Applica l'animazione via WAAPI (Web Animations API)
    const animation = flyer.animate(
      [
        {
          transform: 'translate(0, 0) scale(1)',
          opacity: 1,
        },
        {
          transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.2 - 60}px) scale(0.8) rotate(10deg)`,
          opacity: 1,
          offset: 0.5,
        },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2) rotate(0deg)`,
          opacity: 0.6,
        },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      // Piccolo effetto "pop" sull'icona del carrello
      const pop = cartIcon.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.25)' },
          { transform: 'scale(1)' },
        ],
        { duration: 250, easing: 'ease-out' }
      );

      pop.onfinish = () => {
        flyer.remove();
      };
    };
  }, []);

  return fly;
}

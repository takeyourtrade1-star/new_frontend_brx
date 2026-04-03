'use client';

import { cn } from '@/lib/utils';

export interface GridCardTitleProps {
  label: string;
  labelLine2?: string;
  className?: string;
  /** Colore del glow in hover (default: bianco) */
  glowColor?: string;
  /** Abilita animazione stagger - delay in secondi */
  staggerDelay?: number;
}

/**
 * Titolo riutilizzabile per card grid (Categories, Ebartex Boutique)
 * Include: zoom, glow colorato, blur, animazione stagger
 */
export function GridCardTitle({
  label,
  labelLine2,
  className = '',
  glowColor = '255,255,255',
  staggerDelay,
}: GridCardTitleProps) {
  const animationDelay = staggerDelay !== undefined ? `${staggerDelay}s` : undefined;
  
  return (
    <span
      className={cn(
        'relative z-10 text-center font-display text-lg font-bold uppercase leading-none tracking-[0.04em] text-white transition-all duration-300 ease-out md:text-2xl',
        staggerDelay !== undefined && 'opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]',
        className
      )}
      style={{ 
        textShadow: '0 2px 12px rgba(0,0,0,0.45)',
        animationDelay,
      }}
    >
      <span 
        className="inline-block px-4 py-2 transition-all duration-300 group-hover:scale-110 group-hover:text-white"
        style={{
          ['--glow-color' as string]: glowColor,
        }}
      >
        <span 
          className="block transition-all duration-300 group-hover:[text-shadow:0_0_20px_rgba(var(--glow-color),0.9),0_0_40px_rgba(var(--glow-color),0.6),0_2px_12px_rgba(0,0,0,0.45)]"
        >
          {labelLine2 ? (
            <>
              <span className="block">{label}</span>
              <span className="block">{labelLine2}</span>
            </>
          ) : (
            label
          )}
        </span>
      </span>
    </span>
  );
}

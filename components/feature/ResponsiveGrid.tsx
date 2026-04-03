'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type GridItem = {
  id: string;
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

type ResponsiveCols = {
  mobile: number;  // default: 2
  sm?: number;     // sm breakpoint
  md?: number;     // md breakpoint  
  lg?: number;     // lg breakpoint
  xl?: number;     // xl breakpoint
};

type ResponsiveGridProps = {
  items: GridItem[];
  cols: ResponsiveCols;
  className?: string;
  itemClassName?: string;
  borderColor?: string;
  staggerAnimation?: boolean;
};

/**
 * ResponsiveGrid - Componente riutilizzabile per griglie con bordi divisori
 * 
 * Supporta layout responsivi (mobile → sm → md → lg → xl) con bordi
 * verticali e orizzontali che si adattano automaticamente al numero di colonne.
 */
export function ResponsiveGrid({
  items,
  cols,
  className,
  itemClassName,
  borderColor = 'border-white/90',
  staggerAnimation = true,
}: ResponsiveGridProps) {
  const {
    mobile = 2,
    sm = cols.mobile,
    md = cols.sm ?? cols.mobile,
    lg = cols.md ?? cols.sm ?? cols.mobile,
    xl = cols.lg ?? cols.md ?? cols.sm ?? cols.mobile,
  } = cols;

  // Build grid classes
  const gridClasses = cn(
    'grid w-full',
    `grid-cols-${mobile}`,
    sm !== mobile && `sm:grid-cols-${sm}`,
    md !== sm && `md:grid-cols-${md}`,
    lg !== md && `lg:grid-cols-${lg}`,
    xl !== lg && `xl:grid-cols-${xl}`,
    className
  );

  // Calculate last row for horizontal borders
  const maxCols = xl;
  const rowCount = Math.ceil(items.length / maxCols);

  return (
    <div className={gridClasses}>
      {items.map((item, index) => {
        const currentRowLg = Math.floor(index / lg);
        const isLastRowLg = currentRowLg === rowCount - 1;
        
        // For each breakpoint, determine if this is the last column
        const isLastColMobile = (index + 1) % mobile === 0;
        const isLastColSm = sm ? (index + 1) % sm === 0 : isLastColMobile;
        const isLastColLg = (index + 1) % lg === 0;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'group relative flex items-center justify-center overflow-hidden transition-all duration-300',
              // Vertical borders - visible on all except last column per breakpoint
              !isLastColMobile && `border-r-2 ${borderColor}`,
              sm && !isLastColSm && `sm:border-r-2 sm:${borderColor}`,
              !isLastColLg && `lg:border-r-2 lg:${borderColor}`,
              // Horizontal borders - visible except on last row
              !isLastRowLg && 'border-b-2 border-white',
              // Override: remove right border on actual last items
              index % mobile === mobile - 1 && 'max-sm:border-r-0',
              sm && index % sm === sm - 1 && 'sm:border-r-0',
              itemClassName
            )}
            style={{
              ...item.style,
              animation: staggerAnimation
                ? `categoryEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 120}ms both`
                : undefined,
            }}
          >
            {item.children}
          </Link>
        );
      })}
      <style jsx>{`
        @keyframes categoryEnter {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface MascotteLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string | null;
  showText?: boolean;
  variant?: 'default' | 'minimal';
  className?: string;
}

export function MascotteLoader({ 
  size = 'md', 
  text = null,
  showText = true,
  variant = 'default',
  className = '' 
}: MascotteLoaderProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState(0);
  const [neonIndex, setNeonIndex] = useState(0);

  // Faster animation cycle
  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % 4), 600);
    return () => clearInterval(timer);
  }, []);

  // Dots animation
  useEffect(() => {
    const timer = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(timer);
  }, []);

  // Fast neon color cycle for text
  useEffect(() => {
    const timer = setInterval(() => setNeonIndex(n => (n + 1) % 3), 600);
    return () => clearInterval(timer);
  }, []);

  // Card dimensions based on size
  const cardW = size === 'sm' ? 44 : size === 'md' ? 60 : 80;
  const cardH = size === 'sm' ? 62 : size === 'md' ? 84 : 112;
  const containerH = size === 'sm' ? 100 : size === 'md' ? 140 : 180;

  // Card positions based on animation step
  const getCardStyle = (index: number) => {
    const base = {
      position: 'absolute' as const,
      width: cardW,
      height: cardH,
      borderRadius: 10,
      background: 'linear-gradient(145deg, #1a1a1f 0%, #0d0d10 50%, #141418 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      transformOrigin: 'center bottom',
      left: '50%',
      bottom: 0,
      marginLeft: -cardW / 2,
    };

    // Define animations for each step
    const positions = variant === 'minimal' 
      ? [
        // Minimal: Just subtle breathing/pulsing, no big movements
        [
          { transform: `translateX(-4px) rotate(-3deg) translateY(-2px)`, zIndex: 3, borderColor: '#FF7300', boxShadow: '0 0 25px rgba(255,115,0,0.5), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(0px) rotate(0deg)`, zIndex: 2, borderColor: '#818CF8', boxShadow: '0 0 25px rgba(129,140,248,0.5), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(4px) rotate(3deg) translateY(-2px)`, zIndex: 1, borderColor: '#34D399', boxShadow: '0 0 25px rgba(52,211,153,0.5), 0 4px 12px rgba(0,0,0,0.5)' },
        ],
        [
          { transform: `translateX(-4px) rotate(-3deg) translateY(-4px)`, zIndex: 3, borderColor: '#FF7300', boxShadow: '0 0 30px rgba(255,115,0,0.6), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(0px) rotate(0deg) translateY(-2px)`, zIndex: 2, borderColor: '#818CF8', boxShadow: '0 0 30px rgba(129,140,248,0.6), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(4px) rotate(3deg) translateY(-4px)`, zIndex: 1, borderColor: '#34D399', boxShadow: '0 0 30px rgba(52,211,153,0.6), 0 4px 12px rgba(0,0,0,0.5)' },
        ],
        [
          { transform: `translateX(-4px) rotate(-3deg) translateY(-2px)`, zIndex: 3, borderColor: '#FF7300', boxShadow: '0 0 25px rgba(255,115,0,0.5), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(0px) rotate(0deg)`, zIndex: 2, borderColor: '#818CF8', boxShadow: '0 0 25px rgba(129,140,248,0.5), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(4px) rotate(3deg) translateY(-2px)`, zIndex: 1, borderColor: '#34D399', boxShadow: '0 0 25px rgba(52,211,153,0.5), 0 4px 12px rgba(0,0,0,0.5)' },
        ],
        [
          { transform: `translateX(-4px) rotate(-3deg) translateY(-4px)`, zIndex: 3, borderColor: '#FF7300', boxShadow: '0 0 30px rgba(255,115,0,0.6), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(0px) rotate(0deg) translateY(-2px)`, zIndex: 2, borderColor: '#818CF8', boxShadow: '0 0 30px rgba(129,140,248,0.6), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(4px) rotate(3deg) translateY(-4px)`, zIndex: 1, borderColor: '#34D399', boxShadow: '0 0 30px rgba(52,211,153,0.6), 0 4px 12px rgba(0,0,0,0.5)' },
        ],
      ]
      : [
        // Default: Full animation
        // Step 0: Stacked
        [
          { transform: `translateX(-8px) rotate(-6deg) translateY(-4px)`, zIndex: 3, borderColor: '#FF7300', boxShadow: '0 0 20px rgba(255,115,0,0.4), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(0px) rotate(0deg)`, zIndex: 2, borderColor: '#818CF8', boxShadow: '0 0 20px rgba(129,140,248,0.4), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(8px) rotate(6deg) translateY(-4px)`, zIndex: 1, borderColor: '#34D399', boxShadow: '0 0 20px rgba(52,211,153,0.4), 0 4px 12px rgba(0,0,0,0.5)' },
        ],
        // Step 1: Fan out
        [
          { transform: `translateX(-${cardW * 0.7}px) rotate(-25deg) translateY(-20px)`, zIndex: 1, borderColor: '#FF7300', boxShadow: '0 0 25px rgba(255,115,0,0.5), 0 8px 20px rgba(0,0,0,0.4)' },
          { transform: `translateX(0px) rotate(0deg) translateY(-30px)`, zIndex: 3, borderColor: '#818CF8', boxShadow: '0 0 30px rgba(129,140,248,0.6), 0 12px 24px rgba(0,0,0,0.4)' },
          { transform: `translateX(${cardW * 0.7}px) rotate(25deg) translateY(-20px)`, zIndex: 1, borderColor: '#34D399', boxShadow: '0 0 25px rgba(52,211,153,0.5), 0 8px 20px rgba(0,0,0,0.4)' },
        ],
        // Step 2: Shuffle up
        [
          { transform: `translateX(-${cardW * 0.5}px) rotate(-15deg) translateY(-50px)`, zIndex: 2, borderColor: '#FF7300', boxShadow: '0 0 25px rgba(255,115,0,0.5), 0 8px 20px rgba(0,0,0,0.4)' },
          { transform: `translateX(${cardW * 0.5}px) rotate(15deg) translateY(-50px)`, zIndex: 1, borderColor: '#818CF8', boxShadow: '0 0 25px rgba(129,140,248,0.5), 0 8px 20px rgba(0,0,0,0.4)' },
          { transform: `translateX(0px) rotate(0deg) translateY(-10px)`, zIndex: 3, borderColor: '#34D399', boxShadow: '0 0 35px rgba(52,211,153,0.7), 0 12px 24px rgba(0,0,0,0.4)' },
        ],
        // Step 3: Return
        [
          { transform: `translateX(-6px) rotate(-4deg) translateY(-2px)`, zIndex: 2, borderColor: '#FF7300', boxShadow: '0 0 15px rgba(255,115,0,0.3), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(6px) rotate(4deg) translateY(-2px)`, zIndex: 1, borderColor: '#818CF8', boxShadow: '0 0 15px rgba(129,140,248,0.3), 0 4px 12px rgba(0,0,0,0.5)' },
          { transform: `translateX(0px) rotate(0deg)`, zIndex: 3, borderColor: '#34D399', boxShadow: '0 0 20px rgba(52,211,153,0.4), 0 4px 12px rgba(0,0,0,0.5)' },
        ],
      ];

    const pos = positions[step][index];
    return {
      ...base,
      transform: pos.transform,
      zIndex: pos.zIndex,
      border: `2px solid ${pos.borderColor}`,
      boxShadow: pos.boxShadow,
    };
  };

  const cardColors = ['#FF7300', '#818CF8', '#34D399'];
  const cardRGB = ['255,115,0', '129,140,248', '52,211,153'];

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Cards container */}
      <div 
        className="relative"
        style={{ 
          width: cardW * 3,
          height: containerH,
        }}
      >
        {[0, 1, 2].map((index) => (
          <div key={index} style={getCardStyle(index)}>
            {/* Card inner content */}
            <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
              {/* Shimmer light sweep effect */}
              <div 
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(105deg, 
                    transparent 30%, 
                    rgba(${cardRGB[index]}, 0.4) 45%, 
                    rgba(255,255,255,0.6) 50%, 
                    rgba(${cardRGB[index]}, 0.4) 55%, 
                    transparent 70%)`,
                  backgroundSize: '250% 100%',
                  animation: `shimmerSweep 1.8s ease-in-out infinite ${index * 0.3}s`,
                }}
              />
              {/* Secondary slower shimmer */}
              <div 
                className="absolute inset-0 z-10 pointer-events-none opacity-50"
                style={{
                  background: `linear-gradient(180deg, 
                    transparent 20%, 
                    rgba(${cardRGB[index]}, 0.2) 40%, 
                    rgba(${cardRGB[index]}, 0.2) 60%, 
                    transparent 80%)`,
                  backgroundSize: '100% 200%',
                  animation: `shimmerVertical 2.5s ease-in-out infinite ${index * 0.2}s`,
                }}
              />
              
              {/* BRX text */}
              <span 
                className="relative font-comodo font-black text-sm tracking-wider"
                style={{ 
                  color: cardColors[index],
                  textShadow: `0 0 10px rgba(${cardRGB[index]}, 0.8), 0 0 20px rgba(${cardRGB[index]}, 0.4)`,
                }}
              >
                BRX
              </span>
              
              {/* Corner markers */}
              <div 
                className="absolute top-2 left-2 w-2 h-2 rotate-45 border"
                style={{ borderColor: cardColors[index], opacity: 0.6 }}
              />
              <div 
                className="absolute bottom-2 right-2 w-2 h-2 rotate-45 border"
                style={{ borderColor: cardColors[index], opacity: 0.6 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Neon loading text - fast color change, no glow, high readability */}
      {showText && (
        <div className="flex items-center justify-center h-7">
          <span 
            className="text-base font-bold tracking-wide uppercase transition-colors duration-300"
            style={{
              color: cardColors[neonIndex],
            }}
          >
            {text || t('common.loading.shufflingCards')}
          </span>
          <span 
            className="ml-1 text-base font-bold"
            style={{ 
              color: cardColors[neonIndex],
              minWidth: '24px',
              transition: 'color 0.3s',
            }}
          >
            {'.'.repeat(dots)}
          </span>
        </div>
      )}

      {/* Keyframes */}
      <style jsx>{`
        @keyframes shimmerSweep {
          0% { background-position: 250% 0; }
          100% { background-position: -250% 0; }
        }
        @keyframes shimmerVertical {
          0%, 100% { background-position: 0 200%; }
          50% { background-position: 0 -200%; }
        }
      `}</style>
    </div>
  );
}

// Convenience export for inline usage
export function InlineMascotteLoader({ 
  text,
  className = '' 
}: { 
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex min-h-[40vh] items-center justify-center ${className}`}>
      <MascotteLoader size="md" text={text} showText={true} />
    </div>
  );
}

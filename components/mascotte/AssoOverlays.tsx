// Overlay effimeri della mascotte: flash screenshot, anteprima, badge unlock,
// bolle sonno, particelle flip, sparkles guardaroba. (Album/achievement/combo/
// confetti rimossi — PLAN/13.7.)

import type { CSSProperties, ReactNode } from 'react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { Z_INDEX, type DressingSparkle, type FlipParticle } from './constants';

export interface AssoOverlaysProps {
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  isStickyBarVisible: boolean;
  showFlash: boolean;
  showScreenshotPreview: boolean;
  screenshot: string | null;
  newUnlock: string | null;
  isSleeping: boolean;
  showSleepBubbles: boolean;
  flipParticles: FlipParticle[];
  dressingSparkles: DressingSparkle[];
  hintBubble?: ReactNode;
  wardrobePanel?: ReactNode;
}

export function AssoOverlays({
  t,
  isStickyBarVisible,
  showFlash,
  showScreenshotPreview,
  screenshot,
  newUnlock,
  isSleeping,
  showSleepBubbles,
  flipParticles,
  dressingSparkles,
  hintBubble,
  wardrobePanel,
}: AssoOverlaysProps) {
  return (
    <>
      {/* Flash screenshot */}
      {showFlash && (
        <div
          className="fixed inset-0 pointer-events-none bg-white"
          style={{ zIndex: Z_INDEX.flash, animation: 'flashFade 300ms ease-out forwards' }}
        />
      )}

      {/* Anteprima screenshot */}
      {showScreenshotPreview && screenshot && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.screenshotPreview,
            bottom: '200px',
            right: '20px',
            animation: 'previewSlideIn 0.3s ease-out, previewFadeOut 0.3s ease-in 1.7s forwards',
          }}
        >
          <div className="rounded-lg border-2 border-[#C4A35A] bg-zinc-900 p-2 shadow-2xl">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL screenshot preview */}
              <img src={screenshot} alt={t('asso.bugReport.screenshotAlt')} className="h-32 w-48 rounded object-cover" />
              <div className="absolute bottom-1 right-1 rounded bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
                {t('asso.bugReport.previewLabel')}
              </div>
            </div>
          </div>
        </div>
      )}

      {hintBubble}
      {wardrobePanel}

      {/* Badge nuovo retro sbloccato */}
      {newUnlock && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 2,
            bottom: isStickyBarVisible ? '220px' : '160px',
            right: '10px',
            animation: 'unlockFlash 3s ease-out forwards',
          }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-zinc-900/80 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="white" /></svg>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-white">{t('asso.unlockBadge')}</p>
              <p className="text-[8px] font-bold text-white/80">{newUnlock}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bolle Zzz */}
      {isSleeping && showSleepBubbles && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '175px' : '115px',
            right: '70px',
          }}
        >
          <div className="sleep-bubbles-container">
            <div className="sleep-bubble sleep-bubble-large"><span className="sleep-bubble-text">Zzz</span></div>
            <div className="sleep-bubble sleep-bubble-small"><span className="sleep-bubble-text">z</span></div>
          </div>
        </div>
      )}

      {/* Particelle flip */}
      {flipParticles.length > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip,
            bottom: isStickyBarVisible ? '80px' : '20px',
            right: '48px',
            width: '96px',
            height: '128px',
          }}
        >
          {flipParticles.map((p) => (
            <div
              key={p.id}
              className="flip-particle absolute"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                '--particle-dx': `${p.dx}px`,
                '--particle-dy': `${p.dy}px`,
                backgroundColor: p.color,
              } as CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Sparkles apertura guardaroba */}
      {dressingSparkles.length > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '80px' : '20px',
            right: '48px',
            width: '96px',
            height: '128px',
          }}
          aria-hidden="true"
        >
          {dressingSparkles.map((s) => (
            <svg
              key={s.id}
              className="dressing-sparkle absolute"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animationDelay: `${s.delay}ms`,
                color: s.color,
              }}
            >
              <path d="M12 2 L13.7 10.3 L22 12 L13.7 13.7 L12 22 L10.3 13.7 L2 12 L10.3 10.3 Z" />
            </svg>
          ))}
        </div>
      )}
    </>
  );
}

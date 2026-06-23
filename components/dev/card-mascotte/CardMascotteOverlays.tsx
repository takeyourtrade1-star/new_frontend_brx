'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import {
  Z_INDEX,
  type BackVariant,
  type DressingSparkle,
  type FlipParticle,
  type GoldenConfettiPiece,
} from './constants';

export interface CardMascotteOverlaysProps {
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  isStickyBarVisible: boolean;
  showFlash: boolean;
  showScreenshotPreview: boolean;
  screenshot: string | null;
  newUnlock: string | null;
  showAlbum: boolean;
  isFlipped: boolean;
  backVariants: BackVariant[];
  flipCount: number;
  showAchievement: string | null;
  showCombo: boolean;
  comboCount: number;
  isSleeping: boolean;
  isOverlayVisible: boolean;
  isMobileView: boolean;
  flipParticles: FlipParticle[];
  dressingSparkles: DressingSparkle[];
  goldenConfetti: GoldenConfettiPiece[];
  afterScreenshot?: ReactNode;
  afterAlbum?: ReactNode;
}

export function CardMascotteOverlays({
  t,
  isStickyBarVisible,
  showFlash,
  showScreenshotPreview,
  screenshot,
  newUnlock,
  showAlbum,
  isFlipped,
  backVariants,
  flipCount,
  showAchievement,
  showCombo,
  comboCount,
  isSleeping,
  isOverlayVisible,
  isMobileView,
  flipParticles,
  dressingSparkles,
  goldenConfetti,
  afterScreenshot,
  afterAlbum,
}: CardMascotteOverlaysProps) {
  return (
    <>
      {/* Flash overlay for screenshot capture */}
      {showFlash && (
        <div
          className="fixed inset-0 pointer-events-none bg-white"
          style={{
            zIndex: Z_INDEX.flash,
            animation: 'flashFade 300ms ease-out forwards',
          }}
        />
      )}

      {/* Screenshot preview thumbnail */}
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
              <img
                src={screenshot}
                alt={t('asso.bugReport.screenshotAlt')}
                className="h-32 w-48 rounded object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
                {t('asso.bugReport.previewLabel')}
              </div>
            </div>
          </div>
        </div>
      )}

      {afterScreenshot}

      {/* Unlock Notification */}
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
          <div className="unlock-badge flex items-center gap-2 rounded-xl border border-amber-500/30 bg-zinc-900/80 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="white" /></svg>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-white">{t('asso.unlockBadge')}</p>
              <p className="text-[8px] font-bold text-white/80">{newUnlock}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mini Album Panel */}
      {showAlbum && isFlipped && (
        <div
          className="fixed"
          style={{
            zIndex: Z_INDEX.tooltip + 3,
            bottom: isStickyBarVisible ? '215px' : '155px',
            right: '16px',
            animation: 'albumSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="w-[140px] rounded-xl border border-zinc-700/60 bg-zinc-900/95 p-2.5 shadow-2xl backdrop-blur-md">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">{t('asso.album.title')}</span>
              <span className="text-[8px] font-bold text-primary">{backVariants.filter(v => flipCount >= v.unlock).length}/{backVariants.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {backVariants.map((v, i) => {
                const unlocked = flipCount >= v.unlock;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors"
                    style={{ background: unlocked ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                  >
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded"
                      style={{
                        background: unlocked ? v.gradient : 'rgba(255,255,255,0.08)',
                        border: unlocked ? 'none' : '1px dashed rgba(255,255,255,0.15)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-[8px] font-bold ${unlocked ? 'text-white' : 'text-zinc-600'}`}>
                        {unlocked ? v.label : '???'}
                      </p>
                      <p className="text-[6px] text-zinc-500">
                        {unlocked ? v.sub : `${v.unlock} flip`}
                      </p>
                    </div>
                    {unlocked ? (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                    ) : (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {afterAlbum}

      {/* Achievement Badge */}
      {showAchievement && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '220px' : '160px',
            right: '20px',
            animation: 'achievementIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, achievementOut 400ms ease-in 2s forwards',
          }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-zinc-600/40 bg-zinc-900/80 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md">
            <span className="text-base">&#11088;</span>
            <div>
              <p className="text-[10px] font-bold text-zinc-200">{showAchievement}</p>
              <p className="text-[8px] text-zinc-400">{t('asso.flipTotal', { count: flipCount })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Combo Badge */}
      {showCombo && comboCount >= 2 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '155px' : '95px',
            right: '30px',
            animation: 'comboPopIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-zinc-900/80 px-2.5 py-1 shadow-md shadow-black/20 backdrop-blur-md">
            <span className="text-[10px] font-black text-white">{comboCount}x</span>
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/80">COMBO</span>
          </div>
        </div>
      )}

      {/* Sleep Bubbles - Floating when sleeping */}
      {isSleeping && !isOverlayVisible && !isFlipped && !isMobileView && (
        <div
          className="fixed pointer-events-none sleep-bubbles-wrapper"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '175px' : '115px',
            right: '70px',
          }}
        >
          <div className="sleep-bubbles-container">
            <div className="sleep-bubble sleep-bubble-large">
              <span className="sleep-bubble-text">Zzz</span>
            </div>
            <div className="sleep-bubble sleep-bubble-small">
              <span className="sleep-bubble-text">z</span>
            </div>
          </div>
        </div>
      )}

      {/* Flip Particles */}
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

      {/* Dressing Sparkles — shown when opening wardrobe (front view) */}
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

      {/* Golden Confetti — Easter Egg at 100 flips */}
      {goldenConfetti.length > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 5,
            bottom: isStickyBarVisible ? '80px' : '20px',
            right: '48px',
            width: '96px',
            height: '200px',
          }}
        >
          {goldenConfetti.map((c) => (
            <div
              key={c.id}
              className="golden-confetti absolute"
              style={{
                left: `${c.x}px`,
                top: '100%',
                width: `${c.size}px`,
                height: `${c.size * 0.6}px`,
                backgroundColor: c.color,
                borderRadius: c.size > 7 ? '1px' : '50%',
                transform: `rotate(${c.rotation}deg)`,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                boxShadow: `0 0 ${c.size}px ${c.color}60`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

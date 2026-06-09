'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Globe, Shield, Gift, Users, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { TournamentVideoOverlay } from '@/components/feature/tournaments/TournamentVideoOverlay';
import { cn } from '@/lib/utils';
import { TOURNAMENTS_PORTAL_URL } from '@/lib/config/tournaments';

const SECTIONS = [
  {
    key: 'playLive',
    icon: Globe,
    color: 'from-[#3D65C6] to-[#1D3160]',
  },
  {
    key: 'transparency',
    icon: Shield,
    color: 'from-[#6732A8] to-[#291442]',
  },
  {
    key: 'prizes',
    icon: Gift,
    color: 'from-[#A83269] to-[#291442]',
  },
  {
    key: 'organizers',
    icon: Users,
    color: 'from-[#CC7E4A] to-[#291442]',
  },
] as const;

export default function TorneiPage() {
  const { t } = useTranslation();
  const [videoDone, setVideoDone] = useState(false);

  return (
    <>
      <TournamentVideoOverlay onEnded={() => setVideoDone(true)} />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: videoDone ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className={cn(
          'flex-1 flex flex-col',
          !videoDone && 'pointer-events-none select-none'
        )}
      >
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-global-bg-start to-global-bg-end py-20 md:py-28">
          <div className="container-content mx-auto px-4 text-center">
            <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full bg-primary/15 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-primary">
              <Trophy className="mr-2 h-4 w-4" />
              Ebartex
            </div>
            <h1 className="font-display mb-4 text-4xl font-bold text-white md:text-6xl">
              {t('tournaments.heroTitle')}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/80 md:text-xl">
              {t('tournaments.heroSubtitle')}
            </p>
          </div>
        </section>

        {/* Sections */}
        <section className="bg-gradient-to-b from-global-bg-end to-[#0F172A] py-16 md:py-24">
          <div className="container-content mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2">
              {SECTIONS.map(({ key, icon: Icon, color }, idx) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border border-white/10 p-8 md:p-10',
                    'bg-gradient-to-br',
                    color
                  )}
                >
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="font-display mb-3 text-xl font-bold text-white md:text-2xl">
                      {t(`tournaments.${key}.title` as const)}
                    </h2>
                    <p className="text-sm leading-relaxed text-white/80 md:text-base">
                      {t(`tournaments.${key}.desc` as const)}
                    </p>
                  </div>
                  {/* subtle glow */}
                  <div
                    className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(255,115,0,0.6) 0%, transparent 70%)' }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0F172A] py-16 md:py-24">
          <div className="container-content mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-gradient-to-br from-[#1D3160] to-[#0F172A] p-10 md:p-14"
            >
              <h2 className="font-display mb-4 text-2xl font-bold text-white md:text-3xl">
                {t('tournaments.heroTitle')}
              </h2>
              <p className="mb-8 text-white/70">
                {t('tournaments.heroSubtitle')}
              </p>
              <a
                href={TOURNAMENTS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5',
                  'text-sm font-bold uppercase tracking-wide text-white transition-transform',
                  'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                )}
              >
                {t('tournaments.ctaButton')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </section>
      </motion.main>
    </>
  );
}

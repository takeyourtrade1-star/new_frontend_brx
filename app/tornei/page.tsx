'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Globe, Shield, Gift, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { TournamentVideoOverlay } from '@/components/feature/tournaments/TournamentVideoOverlay';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { TOURNAMENTS_PORTAL_URL } from '@/lib/config/tournaments';

const SECTIONS = [
  {
    key: 'playLive',
    icon: Globe,
    gradient: 'bg-gradient-to-br from-[#3D65C6]/40 to-[#1D3160]/40',
    glow: 'rgba(61,101,198,0.4)',
  },
  {
    key: 'transparency',
    icon: Shield,
    gradient: 'bg-gradient-to-br from-[#6732A8]/40 to-[#291442]/40',
    glow: 'rgba(103,50,168,0.4)',
  },
  {
    key: 'prizes',
    icon: Gift,
    gradient: 'bg-gradient-to-br from-[#A83269]/40 to-[#291442]/40',
    glow: 'rgba(168,50,105,0.4)',
  },
  {
    key: 'organizers',
    icon: Users,
    gradient: 'bg-gradient-to-br from-[#CC7E4A]/40 to-[#291442]/40',
    glow: 'rgba(204,126,74,0.4)',
  },
] as const;

export default function TorneiPage() {
  const { t } = useTranslation();
  const [videoDone, setVideoDone] = useState(false);

  return (
    <>
      <TournamentVideoOverlay onEnded={() => setVideoDone(true)} />

      <Header />

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
        <section className="relative overflow-hidden bg-gradient-to-b from-global-bg-start via-global-bg-end to-[#0F172A] py-24 md:py-32">
          {/* Background pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'var(--brx-bg-url)', backgroundSize: '200px' }}
          />
          
          {/* Ambient glows */}
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-[#3D65C6]/20 blur-[80px]" />

          <div className="container-content relative mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mb-8 inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/15 px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary backdrop-blur-sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ebartex
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="font-display mb-6 text-5xl font-black text-white drop-shadow-lg md:text-7xl"
            >
              {t('tournaments.heroTitle')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mx-auto max-w-2xl text-xl font-medium text-white/70 md:text-2xl"
            >
              {t('tournaments.heroSubtitle')}
            </motion.p>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mx-auto mt-10 h-px w-32 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
          </div>
        </section>

        {/* Sections */}
        <section className="relative bg-gradient-to-b from-[#0F172A] via-[#0F172A] to-[#0F172A] py-20 md:py-28">
          <div className="container-content mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2">
              {SECTIONS.map(({ key, icon: Icon, gradient, glow }, idx) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: idx * 0.12 }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border border-white/10 p-8 md:p-10',
                    'backdrop-blur-xl backdrop-saturate-150',
                    gradient
                  )}
                >
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                  
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(600px circle at 50% 50%, ${glow}, transparent 60%)` }}
                  />

                  <div className="relative z-10">
                    <div className="mb-5 inline-flex rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                      <Icon className="h-7 w-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                    </div>
                    <h2 className="font-display mb-4 text-2xl font-bold text-white md:text-3xl">
                      {t(`tournaments.${key}.title` as const)}
                    </h2>
                    <p className="text-base leading-relaxed text-white/70 md:text-lg">
                      {t(`tournaments.${key}.desc` as const)}
                    </p>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full border border-primary/20 bg-primary/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-30" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-gradient-to-b from-[#0F172A] to-[#0a0f1e] py-20 md:py-28">
          {/* Ambient background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
          </div>

          <div className="container-content relative mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-[#1D3160]/60 to-[#0F172A]/60 p-10 backdrop-blur-2xl backdrop-saturate-150 md:p-16"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-primary">
                <Trophy className="h-4 w-4" />
                {t('nav.tournamentsPortal')}
              </div>

              <h2 className="font-display mb-4 text-3xl font-bold text-white md:text-4xl">
                {t('tournaments.heroTitle')}
              </h2>
              
              <p className="mb-10 text-lg text-white/60">
                {t('tournaments.heroSubtitle')}
              </p>

              <a
                href={TOURNAMENTS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-3 rounded-full bg-primary px-10 py-4',
                  'text-sm font-bold uppercase tracking-wider text-white',
                  'shadow-lg shadow-primary/25',
                  'transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                )}
              >
                {t('tournaments.ctaButton')}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>
        </section>
      </motion.main>
    </>
  );
}

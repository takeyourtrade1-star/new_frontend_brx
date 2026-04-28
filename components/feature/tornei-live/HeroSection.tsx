"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/feature/tornei-live/i18n/LanguageProvider";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden px-6 pt-12 pb-18 sm:px-10 lg:px-16">
      <div className="mx-auto grid min-h-[calc(100vh-5.25rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs tracking-wide text-zinc-700 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            {t.hero.eyebrow}
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-600 sm:text-lg">
            {t.hero.subtitle}
          </p>
          <div className="mt-10">
            <button
              type="button"
              className="group relative inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:border-emerald-500/80 hover:bg-emerald-500/15"
            >
              <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 shadow-[0_0_35px_6px_rgba(16,185,129,0.35)] transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10">{t.hero.cta}</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -top-10 -right-6 h-44 w-44 rounded-full bg-blue-300/45 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-emerald-300/45 blur-3xl" />
          <div className="glass-panel relative rounded-3xl p-5 shadow-[0_25px_90px_rgba(15,23,42,0.18)]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-500">API Sync Uptime</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">99.98%</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-500">24h</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-900">Shipping</p>
                </div>
                <div className="col-span-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                  <p className="text-xs text-emerald-700">Cardmarket Partner Vault</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-900">Live Inventory Synced</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

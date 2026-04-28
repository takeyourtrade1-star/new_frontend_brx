"use client";

import { motion } from "framer-motion";
import { Gauge, HeartHandshake, ShieldCheck, Sparkles, TimerReset, Truck, Users, Trophy, Layers, TrendingUp, Zap, Globe } from "lucide-react";
import { NeoTactileMockup } from "./NeoTactileMockup";
import { HeroLiveSectionAdapted } from "./HeroLiveSectionAdapted";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay } }),
};

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
      {children}
    </span>
  );
}

function MetricCard({ label, current, legacy, suffix, betterLower }: {
  label: string; current: number; legacy: number; suffix: string; betterLower: boolean;
}) {
  const improvement = betterLower ? ((legacy - current) / legacy) * 100 : ((current - legacy) / legacy) * 100;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-zinc-900">{current}{suffix}</span>
        <span className="text-sm text-zinc-400 line-through">{legacy}{suffix}</span>
      </div>
      <div className="mt-1 text-xs font-semibold text-emerald-600">
        {improvement.toFixed(0)}% {betterLower ? "in meno" : "in più"}
      </div>
    </div>
  );
}

export function TcgExpressLandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
      {/* SLIDE 1 — Hero */}
      <motion.section
        className="py-8 md:py-14"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Ecosistema Phygital</SectionKicker>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-3xl font-extrabold leading-tight text-zinc-900 sm:text-4xl lg:text-5xl"
        >
          Più di un Marketplace — <br className="hidden sm:block" />
          La Casa della Community
        </motion.h1>
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg"
        >
          Il cuore della nostra piattaforma non è il semplice e-commerce, ma la creazione di un vero
          ecosistema digitale. Abbiamo sviluppato una sofisticata infrastruttura di live streaming in cui
          gli utenti possono giocare tornei ufficiali tramite webcam.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Interazione Live</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Chat dal vivo integrata, modalità spettatore e possibilità per i membri della community di
              diventare arbitri (judges) ufficiali.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Dall'Intrattenimento all'Acquisto</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Durante un torneo trasmesso in diretta, gli spettatori possono ispezionare i mazzi giocati e,
              con un clic, acquistare istantaneamente le carte necessarie.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Tornei Ufficiali</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Partecipa a tornei settimanali MTG, Pokémon e altri giochi con premi in denaro e carte
              esclusive.
            </p>
          </div>
        </motion.div>
      </motion.section>

      <HeroLiveSectionAdapted />

      {/* SLIDE 2 — Acquisition Funnel */}
      <motion.section
        className="py-10 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Funnel di Acquisizione</SectionKicker>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          I Tornei come Motore di Acquisizione Clienti
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base"
        >
          Il sistema di live-play funge da enorme funnel di acquisizione. I giocatori e gli spettatori
          attratti dai tornei sono naturalmente spinti a sincronizzare il proprio inventario con la nostra
          piattaforma.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50">
              <Users className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Acquisizione</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Migliaia di utenti altamente profilati entrano per giocare o guardare.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
              <Layers className="h-5 w-5 text-cyan-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Sincronizzazione API</h3>
            <p className="mt-1 text-xs text-zinc-500">
              I venditori sincronizzano tutto il loro stock tramite la nostra connessione API.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Vetrina Ready</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Le carte inviate al Vault appaiono in un catalogo pronto per la spedizione immediata.
            </p>
          </div>
        </motion.div>
      </motion.section>

      {/* SLIDE 3 — Solution */}
      <motion.section
        className="py-10 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Soluzione Logistica</SectionKicker>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          Consolidamento Europeo tramite Hub Locali
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base"
        >
          Per aggirare le normative postali UPU del 2026, offriamo il servizio esclusivo{" "}
          <strong>"I Sell For You"</strong>.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Truck className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Invio all'Hub</h3>
            <p className="mt-1 text-xs text-zinc-500">
              I clienti inviano le carte ai centri di smistamento decentralizzati in tutta Europa.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <ShieldCheck className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Grading & Upload</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Valutiamo condizioni, fotografiamo e carichiamo a solo 0,30€ a carta.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
              <Globe className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Account Ufficiale</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Le carte appaiono sul sito sotto un Account Ufficiale Sponsorizzato.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
              <TimerReset className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Spedizione 24h</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Acquisti multipli da venditori diversi in un'unica spedizione evasa in 24 ore.
            </p>
          </div>
        </motion.div>
      </motion.section>

      {/* SLIDE 4 — Competitive Analysis */}
      <motion.section
        className="py-10 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Analisi Competitiva</SectionKicker>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          Un Sistema Progettato per Distruggere lo Status Quo
        </motion.h2>

        <motion.div variants={fadeUp} custom={0.2} className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm font-bold text-zinc-900">vs CardTrader Zero</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              Il loro modello a magazzino unico causa una latenza estrema (9-14 giorni). I nostri hub
              decentralizzati garantiscono la spedizione in <strong>24 ore</strong>.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-bold text-zinc-900">vs TCGplayer Direct</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              TCGplayer ha inserito un floor price di 0,40$ e alzato i cap. Il nostro sistema rimane
              iper-competitivo senza penalizzare l'inventario di fascia media.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900">Eliminazione Doppie Vendite</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              Poiché l'asset è fisicamente nel nostro hub, fungiamo da "Single Source of Truth".
              Addio doppie vendite e ban punitivi per i venditori professionali.
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Velocità di dispatch"
            current={24}
            legacy={72}
            suffix="h"
            betterLower
          />
          <MetricCard
            label="Rischio doppia vendita"
            current={0}
            legacy={15}
            suffix="%"
            betterLower
          />
        </motion.div>
      </motion.section>

      {/* SLIDE 5 — Margins & Model */}
      <motion.section
        className="py-10 md:pb-20 md:pt-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Modello di Business</SectionKicker>
        </motion.div>
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          Profitto Garantito a Costo Zero
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base"
        >
          Il modello finanziario non impone un guadagno fisso, ma offre flessibilità per massimizzare le
          entrate con zero investimento in infrastrutture.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Commissione Wholesale</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Tratteniamo solo il 10% del valore della carta, con un tetto massimo protettivo di 100€ per
              incentivare il deposito di carte ultra-rare.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Ricarico Retail Flessibile</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Il controllo totale sul ricarico: potete rivendere il servizio al 15%, 16% o alla percentuale
              ottimale per i testi di mercato.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <HeartHandshake className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Margine Netto Puro</h3>
            <p className="mt-1 text-xs text-zinc-500">
              La differenza (es. 5% o 6%) è puro margine netto — senza gestire magazzini o dipendenti.
            </p>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}

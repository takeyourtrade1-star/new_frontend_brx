"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Users, Trophy, Layers, Zap, ListPlus, Play } from "lucide-react";
import { NeoTactileMockup } from "./NeoTactileMockup";
import { HeroLiveSection } from "./HeroLiveSectionOriginal";

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

export function TcgExpressLandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
      {/* SLIDE 1 — Hero Tornei Live */}
      <motion.section
        className="py-8 md:py-14"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Tornei Live Webcam</SectionKicker>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-3xl font-extrabold leading-tight text-zinc-900 sm:text-4xl lg:text-5xl"
        >
          Partecipa ai Tornei Ufficiali <br className="hidden sm:block" />
          dalla tua Webcam
        </motion.h1>
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg"
        >
          Gioca tornei settimanali MTG, Pokemon e altri giochi di carte con premi in denaro.
          Iscriviti in 3 semplici passi, verifica la tua identità via webcam e competi con giocatori da tutta Europa.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <ListPlus className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">1. Iscrizione Rapida</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Scegli il torneo (Standard, Pioneer, Modern, Commander), inserisci il tuo nickname
              di gioco, seleziona il decklist e conferma l'accettazione delle regole anti-cheat.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">2. Verifica Webcam</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Attiva la tua webcam per il controllo identità da parte dei giudici verificati.
              Decklist bloccata prima dell'inizio, webcam obbligatoria durante tutto il match.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50">
              <Play className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">3. Gioca Live</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Accedi al Match Center, segui le pairing pubblicate in tempo reale.
              Round Swiss con top cut, tabellone visibile a tutti gli spettatori con streaming integrato.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Premi e Classifiche</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Montepremi in denaro fino a 2.000 EUR + Store Credit. Scoreboard live con aggiornamenti
              automatici, classifica Top 8 e tracking punteggi in tempo reale.
            </p>
          </div>
        </motion.div>
      </motion.section>

      <HeroLiveSection />

      {/* SLIDE 2 — Acquisition Funnel (ultima slide) */}
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

    </div>
  );
}

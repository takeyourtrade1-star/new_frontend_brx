"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Truck,
  Timer,
  Globe,
  Warehouse,
  PackageCheck,
  Zap,
  TrendingUp,
  HeartHandshake,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { ReadyOneDayMockup } from "./ReadyOneDayMockup";

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

function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = "emerald",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent?: "emerald" | "blue" | "indigo" | "amber" | "rose" | "violet";
}) {
  const accentClasses = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${accentClasses[accent]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {step}
        </div>
        {step < 4 && <div className="mt-2 h-full w-px bg-zinc-200" />}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-600" />
          <h4 className="text-sm font-bold text-zinc-900">{title}</h4>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function MetricBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <span className="text-2xl font-extrabold text-emerald-600">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

export function BrxExpressLandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
      {/* HERO SECTION */}
      <motion.section
        className="py-8 md:py-14"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Logistica Decentralizzata</SectionKicker>
        </motion.div>
        
        <motion.h1
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-3xl font-extrabold leading-tight text-zinc-900 sm:text-4xl lg:text-5xl"
        >
          BRX Express: La Rivoluzione della
          <br className="hidden sm:block" />
          <span className="text-emerald-600"> Spedizione Carte 24h</span>
        </motion.h1>
        
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg"
        >
          Un network di hub europei dove spedisci le tue carte una sola volta. 
          Noi le gradiamo, le proteggiamo e le spediamo ai compratori in tutta Europa in 24 ore.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
            <Timer className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Consegna in 24h</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Zero doppie vendite</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
            <Warehouse className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Hub in tutta Europa</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={0.4} className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-5">
          <MetricBadge value="24h" label="Consegna" />
          <MetricBadge value="0%" label="Doppie vendite" />
          <MetricBadge value="€0,30" label="A carta" />
          <MetricBadge value="10%" label="Commissione" />
          <MetricBadge value="100€" label="Cap max" />
        </motion.div>
      </motion.section>

      {/* READY ONE DAY MOCKUP */}
      <motion.section
        className="py-10 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Simulazione Live</SectionKicker>
        </motion.div>
        
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          Esplora la Control Tower
        </motion.h2>
        
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base mb-8"
        >
          Prova l'interfaccia usata dai venditori per instradare lo stock e gestire il routing europeo.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3}>
          <ReadyOneDayMockup />
        </motion.div>
      </motion.section>

      {/* PERCHÉ BRX EXPRESS */}
      <motion.section
        className="py-10 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>I Vantaggi</SectionKicker>
        </motion.div>
        
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          Perché Scegliere BRX Express?
        </motion.h2>
        
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base"
        >
          Dimentica le spedizioni singole, i ritardi internazionali e le doppie vendite. 
          Con BRX Express, le tue carte sono sempre pronte per essere spedite.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Truck}
            title="Spedizione in 24 Ore"
            description="Le carte vengono spedite dagli hub locali, riducendo i tempi di consegna da giorni a sole 24 ore in tutta Europa."
            accent="emerald"
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Sicurezza Garantita"
            description="Zero rischio di doppie vendite. Le carte sono fisicamente nei nostri hub, fungiamo da 'Single Source of Truth'."
            accent="blue"
          />
          <FeatureCard
            icon={Warehouse}
            title="Hub Locali"
            description="Rete di hub distribuiti in Italia, Germania, Francia, Spagna e Benelux per coprire tutto il mercato europeo."
            accent="amber"
          />
          <FeatureCard
            icon={PackageCheck}
            title="Grading Professionale"
            description="Ogni carta viene valutata, fotografata in HD e protetta prima di essere messa in vendita sul marketplace."
            accent="indigo"
          />
          <FeatureCard
            icon={Zap}
            title="Sync Automatico"
            description="Integrazione API completa: il tuo stock viene sincronizzato in tempo reale con tutti i marketplace partner."
            accent="violet"
          />
          <FeatureCard
            icon={Globe}
            title="Copertura Europea"
            description="Spedizioni nazionali e internazionali gestite automaticamente dal sistema di routing intelligente."
            accent="rose"
          />
        </motion.div>
      </motion.section>

      {/* COME FUNZIONA */}
      <motion.section
        className="py-10 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <motion.div variants={fadeUp} custom={0}>
              <SectionKicker>Il Processo</SectionKicker>
            </motion.div>
            
            <motion.h2
              variants={fadeUp}
              custom={0.1}
              className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
            >
              Come Funziona BRX Express
            </motion.h2>
            
            <motion.p
              variants={fadeUp}
              custom={0.2}
              className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base"
            >
              Il servizio "I Sell For You" semplifica la vendita delle tue carte in 4 passaggi.
            </motion.p>

            <motion.div variants={fadeUp} custom={0.3} className="mt-8">
              <StepCard
                step={1}
                icon={Truck}
                title="Invio all'Hub"
                description="Spedisci le tue carte al hub BRX Express più vicino a te. I centri di smistamento sono distribuiti in tutta Europa per minimizzare i tempi di spedizione."
              />
              <StepCard
                step={2}
                icon={ShieldCheck}
                title="Grading & Upload"
                description="Il nostro team di esperti valuta le condizioni di ogni carta, scatta foto in alta risoluzione e le carica sul marketplace a soli 0,30€ a carta."
              />
              <StepCard
                step={3}
                icon={Globe}
                title="Account Ufficiale"
                description="Le tue carte appaiono sul sito sotto un Account Ufficiale Sponsorizzato, garantendo massima visibilità e affidabilità agli acquirenti."
              />
              <StepCard
                step={4}
                icon={Timer}
                title="Spedizione 24h"
                description="Quando un acquirente acquista, la carta viene spedita direttamente dall'hub locale in 24 ore, anche per ordini multipli da venditori diversi."
              />
            </motion.div>
          </div>

          <motion.div variants={fadeUp} custom={0.4} className="lg:pl-8">
            <div className="sticky top-8 rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-lg">
              <h3 className="text-lg font-bold text-zinc-900">Servizio I Sell For You</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Il modello esclusivo per aggirare le normative postali UPU del 2026.
              </p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-zinc-700">Riduzione esposizione spedizioni UPU</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-zinc-700">Ready One Day: dispatch 24h da hub locali</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-zinc-700">Zero CAPEX: margine extra con fulfillment gestito</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Hub Attivi in Europa
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Italia", "Germania", "Francia", "Spagna", "Benelux"].map((country) => (
                    <span
                      key={country}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* CONFRONTO COMPETITIVO */}
      <motion.section
        className="py-10 md:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Analisi Competitiva</SectionKicker>
        </motion.div>
        
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          BRX Express vs La Concorrenza
        </motion.h2>

        <motion.div variants={fadeUp} custom={0.2} className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm font-bold text-zinc-900">vs CardTrader Zero</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              Il loro modello a magazzino unico causa una latenza estrema (9-14 giorni). I nostri hub
              decentralizzati garantiscono la spedizione in <strong>24 ore</strong>.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-bold text-zinc-900">vs TCGplayer Direct</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              TCGplayer ha inserito un floor price di 0,40$ e alzato i cap. Il nostro sistema rimane
              iper-competitivo senza penalizzare l&apos;inventario di fascia media.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900">Eliminazione Doppie Vendite</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              Poiché l&apos;asset è fisicamente nel nostro hub, fungiamo da &quot;Single Source of Truth&quot;.
              Addio doppie vendite e ban punitivi per i venditori professionali.
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Velocità di dispatch</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-900">24h</span>
              <span className="text-sm text-zinc-400 line-through">72h</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-emerald-600">67% più veloce</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Rischio doppia vendita</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-900">0%</span>
              <span className="text-sm text-zinc-400 line-through">15%</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-emerald-600">100% eliminato</div>
          </div>
        </motion.div>
      </motion.section>

      {/* MODELLO DI BUSINESS */}
      <motion.section
        className="py-10 md:pb-20 md:pt-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <SectionKicker>Modello Economico</SectionKicker>
        </motion.div>
        
        <motion.h2
          variants={fadeUp}
          custom={0.1}
          className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl"
        >
          Costi Trasparenti, Margini Chiari
        </motion.h2>
        
        <motion.p
          variants={fadeUp}
          custom={0.2}
          className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base"
        >
          Commissioni competitive e nessun costo nascosto. Tu controlli il prezzo di vendita finale.
        </motion.p>

        <motion.div variants={fadeUp} custom={0.3} className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <span className="text-lg font-bold text-emerald-600">10%</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Commissione BRX</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Solo il 10% sul valore di vendita, con un tetto massimo di 100€ per carta.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <span className="text-lg font-bold text-violet-600">€0,30</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Costo Upload</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Grading, fotografie HD e caricamento sul marketplace a soli 0,30€ a carta.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <ArrowRight className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Margine Netto</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Tu imposti il prezzo finale. La differenza tra il tuo ricarico e la nostra commissione è margine puro.
            </p>
          </div>
        </motion.div>
      </motion.section>


    </div>
  );
}

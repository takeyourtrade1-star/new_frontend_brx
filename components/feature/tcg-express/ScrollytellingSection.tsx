"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleCheckBig,
  Network,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/components/feature/tcg-express/i18n/LanguageProvider";

type ViewId = 0 | 1 | 2;

type Hub = {
  city: string;
  country: string;
  lon: number;
  lat: number;
  eta: string;
};

const EUROPE_BOUNDS = {
  minLon: -11,
  maxLon: 32,
  minLat: 35,
  maxLat: 61,
};

const HUBS: Hub[] = [
  { city: "Milano", country: "IT", lon: 9.19, lat: 45.46, eta: "24h" },
  { city: "Parigi", country: "FR", lon: 2.35, lat: 48.86, eta: "24h" },
  { city: "Berlino", country: "DE", lon: 13.4, lat: 52.52, eta: "24h" },
  { city: "Amsterdam", country: "NL", lon: 4.9, lat: 52.37, eta: "24h" },
  { city: "Madrid", country: "ES", lon: -3.7, lat: 40.42, eta: "48h" },
  { city: "Varsavia", country: "PL", lon: 21.01, lat: 52.23, eta: "48h" },
];

function projectToMap(lon: number, lat: number) {
  const x =
    ((lon - EUROPE_BOUNDS.minLon) / (EUROPE_BOUNDS.maxLon - EUROPE_BOUNDS.minLon)) * 100;
  const y =
    (1 - (lat - EUROPE_BOUNDS.minLat) / (EUROPE_BOUNDS.maxLat - EUROPE_BOUNDS.minLat)) * 100;
  return { x, y };
}

function DemoViewport({ activeView, language }: { activeView: ViewId; language: "de" | "en" | "it" }) {
  const ui = {
    de: {
      crisisTitle: "Realer Kostendruck heute",
      crisisRows: [
        { label: "Internationaler Einzelversand", value: "15€ - 40€" },
        { label: "Durchschnittliche Lieferzeit", value: "9-14 Tage" },
        { label: "Risiko Doppelverkauf", value: "Hoch" },
      ],
      hubsTitle: "Europäische Hub-Karte (reale Geokoordinaten)",
      hubsSubtitle: "Routing-Vorschau mit lokalen Knotenpunkten und konsolidiertem Versand.",
      syncTitle: "Automatische API-Synchronisierung",
      syncSubtitle: "Jede geprüfte Karte wird sofort im offiziellen Konto publiziert.",
    },
    en: {
      crisisTitle: "Current real cost pressure",
      crisisRows: [
        { label: "International single shipment", value: "15€ - 40€" },
        { label: "Average delivery time", value: "9-14 days" },
        { label: "Double-sale risk", value: "High" },
      ],
      hubsTitle: "European hub map (real geo coordinates)",
      hubsSubtitle: "Routing preview with local nodes and consolidated shipping.",
      syncTitle: "Automatic API synchronization",
      syncSubtitle: "Each graded card is instantly published on the official account.",
    },
    it: {
      crisisTitle: "Pressione costi reali oggi",
      crisisRows: [
        { label: "Spedizione singola internazionale", value: "15€ - 40€" },
        { label: "Tempo medio consegna", value: "9-14 giorni" },
        { label: "Rischio doppia vendita", value: "Alto" },
      ],
      hubsTitle: "Mappa hub europei (coordinate geografiche reali)",
      hubsSubtitle: "Anteprima routing con nodi locali e spedizione consolidata.",
      syncTitle: "Sincronizzazione API automatica",
      syncSubtitle: "Ogni carta gradedata viene pubblicata subito sull'account ufficiale.",
    },
  } as const;

  if (activeView === 0) {
    return (
      <motion.div
        key="inventory-view"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="space-y-3"
      >
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{ui[language].crisisTitle}</p>
          <div className="mt-3 space-y-2">
            {ui[language].crisisRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                <p className="text-xs text-zinc-600">{row.label}</p>
                <p className="text-sm font-semibold text-zinc-900">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "PSA 10 Charizard", state: "Listed", price: "EUR 2.400" },
            { name: "Umbreon VMAX", state: "Queued", price: "EUR 620" },
            { name: "Blue-Eyes 1st", state: "Blocked", price: "40EUR Ship" },
          ].map((item) => (
            <div key={item.name} className="rounded-lg border border-zinc-200 bg-white p-3">
              <p className="truncate text-xs text-zinc-500">{item.name}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">{item.price}</p>
              <p className="mt-1 text-[11px] text-zinc-600">{item.state}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          UPU Alert: 12 SKUs flagged with high international shipping (up to 40EUR)
        </div>
      </motion.div>
    );
  }

  if (activeView === 1) {
    return (
      <motion.div
        key="hub-view"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
      >
        <p className="text-xs uppercase tracking-wide text-zinc-500">{ui[language].hubsTitle}</p>
        <p className="mt-1 text-xs text-zinc-600">{ui[language].hubsSubtitle}</p>
        <svg
          viewBox="0 0 420 300"
          className="mt-3 h-64 w-full rounded-xl border border-zinc-200 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.15),transparent_42%),radial-gradient(circle_at_80%_75%,rgba(37,99,235,0.12),transparent_40%),#fafafa]"
        >
          {[55, 95, 135, 175, 215, 255].map((row) => (
            <line
              key={`row-${row}`}
              x1="24"
              y1={row}
              x2="396"
              y2={row}
              stroke="#d4d4d8"
              strokeDasharray="3 4"
              strokeOpacity="0.7"
            />
          ))}
          {[70, 120, 170, 220, 270, 320, 370].map((col) => (
            <line
              key={`col-${col}`}
              x1={col}
              y1="30"
              x2={col}
              y2="275"
              stroke="#d4d4d8"
              strokeDasharray="3 4"
              strokeOpacity="0.7"
            />
          ))}
          {HUBS.slice(1).map((hub, idx) => {
            const milan = projectToMap(HUBS[0].lon, HUBS[0].lat);
            const point = projectToMap(hub.lon, hub.lat);
            return (
              <motion.line
                key={`route-${hub.city}`}
                x1={24 + (milan.x / 100) * 372}
                y1={30 + (milan.y / 100) * 245}
                x2={24 + (point.x / 100) * 372}
                y2={30 + (point.y / 100) * 245}
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="8 8"
                initial={{ pathLength: 0, opacity: 0.5 }}
                animate={{ pathLength: 1, opacity: [0.25, 0.75, 0.25] }}
                transition={{
                  duration: 2.8,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "mirror",
                  delay: idx * 0.18,
                }}
              />
            );
          })}
          {HUBS.map((hub) => {
            const point = projectToMap(hub.lon, hub.lat);
            const isMain = hub.city === "Milano";
            const cx = 24 + (point.x / 100) * 372;
            const cy = 30 + (point.y / 100) * 245;
            return (
              <g key={hub.city}>
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={isMain ? 7 : 5}
                  fill={isMain ? "#2563eb" : "#059669"}
                  stroke="white"
                  strokeWidth="1.5"
                  animate={{ scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{
                    duration: 2.4,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "mirror",
                    delay: isMain ? 0 : 0.2,
                  }}
                />
                <text x={cx + 10} y={cy - 8} fontSize="10.5" fill="#3f3f46">
                  {hub.city}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {HUBS.map((hub) => (
            <div key={hub.city} className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-600">
              <span className="font-medium text-zinc-800">{hub.city}</span> ({hub.country}) · SLA {hub.eta}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {language === "it"
            ? "Consolidamento multi-venditore attivo: un solo pacco, una sola spedizione."
            : language === "de"
              ? "Multi-Seller-Konsolidierung aktiv: ein Paket, eine Lieferung."
              : "Multi-seller consolidation active: one parcel, one shipment."}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="api-sync-view"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        <p className="font-medium">{ui[language].syncTitle}</p>
        <p>{ui[language].syncSubtitle}</p>
      </div>
      <motion.div
        animate={{ y: [0, -3, 0], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
        className="glass-panel flex items-center justify-between rounded-xl bg-white/85 p-4"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Card Scanned</p>
          <p className="mt-1 text-sm text-zinc-700">Real-time grading and API listing</p>
        </div>
        <ScanLine className="h-5 w-5 text-emerald-600" />
      </motion.div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Our Vault", value: 12489 },
          { label: "Cardmarket Official Account", value: 12489 },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            className="rounded-xl border border-emerald-300/50 bg-emerald-50 p-4"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.02, 1] }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "mirror",
              delay: idx * 0.2,
            }}
          >
            <p className="text-xs text-zinc-600">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-emerald-700">
              {item.value.toLocaleString("de-DE")}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ScrollytellingSection() {
  const { t, language } = useLanguage();
  const copy = {
    de: {
      helper: "Interaktive Mini-Demo: klicke die Steps, um zwischen den Ansichten zu wechseln.",
      platformPreview: "Plattform-Vorschau",
      liveDemo: "Live-Demo",
      tabs: { inventory: "Inventar", hubs: "Hubs", apiSync: "API-Sync" },
      flowLabels: ["Problem", "Lösung", "Ergebnis"] as const,
      microSummary: "Klicke jeden Step: zuerst sehen wir das Problem, dann das operative Setup, dann den messbaren Output.",
    },
    en: {
      helper: "Interactive mini demo: click steps to navigate between views.",
      platformPreview: "Platform Preview",
      liveDemo: "Live Demo",
      tabs: { inventory: "Inventory", hubs: "Hubs", apiSync: "API Sync" },
      flowLabels: ["Problem", "Solution", "Result"] as const,
      microSummary:
        "Click each step: first we show the pain, then the operational setup, then the measurable output.",
    },
    it: {
      helper: "Mini demo interattiva: clicca gli step per navigare tra le viste.",
      platformPreview: "Anteprima piattaforma",
      liveDemo: "Demo live",
      tabs: { inventory: "Inventario", hubs: "Hub", apiSync: "Sync API" },
      flowLabels: ["Problema", "Soluzione", "Risultato"] as const,
      microSummary:
        "Clicca ogni step: prima mostriamo il problema, poi il setup operativo, infine il risultato misurabile.",
    },
  } as const;
  const [activeView, setActiveView] = useState<ViewId>(0);

  const steps = [
    {
      title: t.scroll.step1Title,
      description: t.scroll.step1Desc,
      icon: AlertTriangle,
      label: copy[language].flowLabels[0],
    },
    {
      title: t.scroll.step2Title,
      description: t.scroll.step2Desc,
      icon: Network,
      label: copy[language].flowLabels[1],
    },
    {
      title: t.scroll.step3Title,
      description: t.scroll.step3Desc,
      icon: ScanLine,
      label: copy[language].flowLabels[2],
    },
  ] as const;

  return (
    <section id="features" className="relative px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="glass-panel h-full rounded-3xl p-6 sm:p-8">
            <p className="text-sm tracking-wide text-zinc-500">{t.scroll.sectionLabel}</p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900 sm:text-3xl">
              {t.scroll.sectionTitle}
            </h2>
            <div className="mt-8 space-y-4">
              {steps.map((item, idx) => {
                const isActive = activeView === idx;
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => setActiveView(idx as 0 | 1 | 2)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all duration-400 ease-out ${
                      isActive
                        ? "border-emerald-300/80 bg-emerald-100/70 text-zinc-900 shadow-[0_0_28px_rgba(16,185,129,0.2)]"
                        : "border-zinc-200 bg-white text-zinc-500"
                    }`}
                    style={{ opacity: isActive ? 1 : 0.45 }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-5 w-5 ${isActive ? "text-emerald-700" : "text-zinc-400"}`} />
                      <div>
                        <p className={`text-[11px] uppercase tracking-wide ${isActive ? "text-emerald-700" : "text-zinc-400"}`}>
                          {item.label}
                        </p>
                        <p className="text-sm leading-6 font-medium">{item.title}</p>
                        <p className="mt-1 text-xs leading-5">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                {copy[language].helper}
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <div className="flex items-start gap-2">
                <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{copy[language].microSummary}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="glass-panel h-full rounded-3xl p-5 sm:p-6">
            <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{copy[language].platformPreview}</p>
                <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                  {copy[language].liveDemo}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {[
                  { label: copy[language].tabs.inventory, id: 0 },
                  { label: copy[language].tabs.hubs, id: 1 },
                  { label: copy[language].tabs.apiSync, id: 2 },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveView(tab.id as 0 | 1 | 2)}
                    className={`rounded-md px-3 py-1.5 text-xs transition-all duration-300 ease-out ${
                      activeView === tab.id
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <DemoViewport activeView={activeView} language={language} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

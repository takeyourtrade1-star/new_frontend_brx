"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarPlus2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
  Warehouse,
} from "lucide-react";
import { useLanguage } from "@/components/feature/tornei-live/i18n/LanguageProvider";
import type { Language } from "@/components/feature/tornei-live/i18n/translations";

const judgeCameraVideo = "/giudice.mp4";
const playerWebcamVideo = "/player.mp4";
const opponentTableImage = "/main-table.png";
const myTableImage = "/table-player.png";

type FlowStep = {
  id: "audience" | "sync" | "vault" | "operations";
  icon: typeof Users;
  accent: string;
  metric: string;
};

type FeaturePanel = {
  id: "match-center" | "create-tournament" | "live-board" | "vault-sync";
  icon: typeof Users;
  chip: string;
  title: string;
  description: string;
  points: [string, string, string];
};

const flowByLanguage: Record<
  Language,
  {
    heading: string;
    stream: string;
    table: string;
    labels: { liveFeed: string; apiSync: string; vaultReady: string; guided: string };
    event: string;
    round: string;
    watching: string;
    statusLive: string;
    statusSyncing: string;
    statusReady: string;
    workflowsTitle: string;
    workflowsSubtitle: string;
    panelTags: [string, string, string, string];
    panelTitles: [string, string, string, string];
    panelDescriptions: [string, string, string, string];
    panelPoints: [
      [string, string, string],
      [string, string, string],
      [string, string, string],
      [string, string, string],
    ];
    controls: {
      previous: string;
      next: string;
      createDraft: string;
      createReady: string;
      publish: string;
      published: string;
      format: string;
      slots: string;
      ruleSet: string;
    };
  }
> = {
  de: {
    heading: "Automatischer Funnel in Echtzeit",
    stream: "Turnier-Stream",
    table: "Aktiver Match-Tisch",
    labels: { liveFeed: "Live Feed", apiSync: "API Sync", vaultReady: "Vault Ready", guided: "Geführte Demo" },
    event: "Weekend Modern Clash",
    round: "Runde 4",
    watching: "sehen zu",
    statusLive: "Live traffic spikes",
    statusSyncing: "Syncing inventory",
    statusReady: "Cards ready for shipping",
    workflowsTitle: "Produkt-Flow live erklärt",
    workflowsSubtitle: "Naviga i passaggi chiave del ciclo torneo con un flusso semplice e chiaro.",
    panelTags: ["Match Center", "Create Tournament", "Live Board", "Vault Sync"],
    panelTitles: [
      "Spieler- und Zuschauerraum",
      "Turnier in 30 Sekunden erstellen",
      "Pairings, Runden und Moderation",
      "Inventar sofort für den Vault bereit",
    ],
    panelDescriptions: [
      "Webcam-Tische, Chat und Judge-Status laufen parallel im Match Center.",
      "Format, Slots und Regeln werden als Vorlage gespeichert und direkt publiziert.",
      "Judge aktualisiert Ergebnisse, Auto-Pairing startet die nächste Runde ohne Wartezeit.",
      "Karten aus laufenden Matches werden markiert, geprüft und in den Versand-Ready Pool verschoben.",
    ],
    panelPoints: [
      ["Dual camera + table feed", "Spectator chat con moderazione", "Live status per player e judge"],
      ["Template BO3 + Swiss precompilato", "Check-in automatico giocatori", "Start torneo con un click"],
      ["Classifica Top 8 aggiornata live", "Notifiche round e timeout", "Controllo completo dal desk judge"],
      ["Sync API con disponibilita in tempo reale", "No doppie vendite durante il live", "Carte pronte alla spedizione in 24h"],
    ],
    controls: {
      previous: "Indietro",
      next: "Avanti",
      createDraft: "Bozza torneo",
      createReady: "Preset pronto",
      publish: "Pubblica torneo",
      published: "Pubblicato",
      format: "Formato",
      slots: "Slot",
      ruleSet: "Regole",
    },
  },
  en: {
    heading: "Automatic real-time funnel",
    stream: "Tournament stream",
    table: "Active match table",
    labels: { liveFeed: "Live Feed", apiSync: "API Sync", vaultReady: "Vault Ready", guided: "Guided demo" },
    event: "Weekend Modern Clash",
    round: "Round 4",
    watching: "watching",
    statusLive: "Live traffic spikes",
    statusSyncing: "Syncing inventory",
    statusReady: "Cards ready for shipping",
    workflowsTitle: "Live product walkthrough",
    workflowsSubtitle: "Navigate key tournament steps with a clear and simple flow.",
    panelTags: ["Match Center", "Create Tournament", "Live Board", "Vault Sync"],
    panelTitles: [
      "Player and spectator room",
      "Create a tournament in 30 seconds",
      "Pairings, rounds and moderation",
      "Inventory instantly ready for vault",
    ],
    panelDescriptions: [
      "Webcam tables, chat and judge status run in parallel inside Match Center.",
      "Format, slots and rules are saved as templates and published instantly.",
      "Judge updates results while auto-pairing launches the next round with no delay.",
      "Cards seen in live matches are flagged, verified and moved to ready-to-ship stock.",
    ],
    panelPoints: [
      ["Dual camera + table feed", "Spectator chat with moderation", "Live status for player and judge"],
      ["Pre-filled BO3 + Swiss template", "Automatic player check-in", "Launch tournament in one click"],
      ["Top 8 board updates live", "Round and timeout notifications", "Full control from judge desk"],
      ["API sync with real-time availability", "No double-selling during live", "Cards ready for shipment in 24h"],
    ],
    controls: {
      previous: "Previous",
      next: "Next",
      createDraft: "Tournament draft",
      createReady: "Preset ready",
      publish: "Publish tournament",
      published: "Published",
      format: "Format",
      slots: "Slots",
      ruleSet: "Rules",
    },
  },
  it: {
    heading: "Funnel automatico in tempo reale",
    stream: "Stream torneo",
    table: "Tavolo match attivo",
    labels: { liveFeed: "Live Feed", apiSync: "Sync API", vaultReady: "Vault Ready", guided: "Demo guidata" },
    event: "Weekend Modern Clash",
    round: "Round 4",
    watching: "in visione",
    statusLive: "Picco utenti live",
    statusSyncing: "Sincronizzazione stock",
    statusReady: "Carte pronte alla spedizione",
    workflowsTitle: "Flusso prodotto spiegato in tempo reale",
    workflowsSubtitle: "Naviga i passaggi principali del ciclo torneo in modo chiaro e lineare.",
    panelTags: ["Match Center", "Crea Torneo", "Live Board", "Sync Vault"],
    panelTitles: [
      "Stanza giocatori e spettatori",
      "Creazione torneo in 30 secondi",
      "Pairing, round e moderazione",
      "Inventario subito pronto per il vault",
    ],
    panelDescriptions: [
      "Tavoli webcam, chat e stato judge convivono nel Match Center.",
      "Formato, slot e regole vengono salvati come preset e pubblicati subito.",
      "Il judge aggiorna i risultati mentre l'auto-pairing avvia il round successivo senza attese.",
      "Le carte viste nel live vengono validate e spostate nel pool pronto spedizione.",
    ],
    panelPoints: [
      ["Doppia camera + table feed", "Chat spettatori con moderazione", "Stato live di player e judge"],
      ["Preset BO3 + Swiss precompilato", "Check-in automatico giocatori", "Avvio torneo con un click"],
      ["Top 8 aggiornato in diretta", "Notifiche round e timeout", "Controllo totale dal desk judge"],
      ["Sync API con stock in tempo reale", "No doppie vendite durante il live", "Carte pronte in 24h"],
    ],
    controls: {
      previous: "Precedente",
      next: "Successivo",
      createDraft: "Bozza torneo",
      createReady: "Preset pronto",
      publish: "Pubblica torneo",
      published: "Pubblicato",
      format: "Formato",
      slots: "Slot",
      ruleSet: "Regole",
    },
  },
};

const steps: FlowStep[] = [
  { id: "audience", icon: Eye, accent: "text-blue-600", metric: "+2,340" },
  { id: "sync", icon: RefreshCw, accent: "text-emerald-600", metric: "99.98%" },
  { id: "vault", icon: Warehouse, accent: "text-emerald-700", metric: "24h" },
  { id: "operations", icon: Trophy, accent: "text-indigo-600", metric: "64 slot" },
];

export function TournamentAcquisitionSection() {
  const { language, t } = useLanguage();
  const [activePanel, setActivePanel] = useState(0);
  const [createPhase, setCreatePhase] = useState(0);
  const copy = flowByLanguage[language];
  const slide = t.slides.s2;

  const featurePanels = useMemo<FeaturePanel[]>(
    () => [
      {
        id: "match-center",
        icon: Eye,
        chip: copy.panelTags[0],
        title: copy.panelTitles[0],
        description: copy.panelDescriptions[0],
        points: copy.panelPoints[0],
      },
      {
        id: "create-tournament",
        icon: CalendarPlus2,
        chip: copy.panelTags[1],
        title: copy.panelTitles[1],
        description: copy.panelDescriptions[1],
        points: copy.panelPoints[1],
      },
      {
        id: "live-board",
        icon: Trophy,
        chip: copy.panelTags[2],
        title: copy.panelTitles[2],
        description: copy.panelDescriptions[2],
        points: copy.panelPoints[2],
      },
      {
        id: "vault-sync",
        icon: Warehouse,
        chip: copy.panelTags[3],
        title: copy.panelTitles[3],
        description: copy.panelDescriptions[3],
        points: copy.panelPoints[3],
      },
    ],
    [
      copy.panelDescriptions,
      copy.panelPoints,
      copy.panelTags,
      copy.panelTitles,
    ],
  );

  const currentPanel = featurePanels[activePanel];
  const activeStep = activePanel;
  const statusText = activeStep === 0 ? copy.statusLive : activeStep === 1 ? copy.statusSyncing : copy.statusReady;
  const primaryVideo = activePanel % 2 === 0 ? judgeCameraVideo : playerWebcamVideo;
  const secondaryImage = activePanel % 2 === 0 ? myTableImage : opponentTableImage;

  return (
    <section className="px-6 py-8 sm:px-10 lg:px-16 md:snap-start md:min-h-[calc(100vh-72px)]">
      <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">{slide.title}</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">{slide.description}</p>
          <div className="mt-7 rounded-[28px] border border-white/55 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <p className="text-xs font-semibold tracking-wide text-zinc-500">{copy.heading}</p>
            <div className="mt-4 space-y-3">
              {slide.bullets.map((bullet, index) => {
                const current = steps[index];
                const isActive = index === activeStep;
                const Icon = current.icon;

                return (
                  <motion.div
                    key={bullet}
                    animate={{
                      borderColor: isActive ? "rgba(16,185,129,0.42)" : "rgba(228,228,231,0.9)",
                      backgroundColor: isActive ? "rgba(236,253,245,0.72)" : "rgba(255,255,255,0.56)",
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-start gap-3 rounded-2xl border p-3.5 backdrop-blur-xl"
                  >
                    <div
                      className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white ${current.accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-6 text-zinc-700">{bullet}</p>
                      <AnimatePresence initial={false}>
                        {isActive ? (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-1.5 text-xs text-zinc-500"
                          >
                            {index === 0
                              ? currentPanel.points[0]
                              : index === 1
                                ? currentPanel.points[1]
                                : currentPanel.points[2]}
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </div>
                    <span className="text-xs font-semibold text-zinc-500">{current.metric}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/60 bg-white/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-1 text-xs text-zinc-600 backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              {copy.labels.guided}
            </div>
            <span className="text-xs font-medium text-emerald-700">{statusText}</span>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                setActivePanel((current) => (current + 3) % 4);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/70 px-2 py-1.5 text-[11px] font-medium text-zinc-700 backdrop-blur-xl"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {copy.controls.previous}
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePanel((current) => (current + 1) % 4);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/70 px-2 py-1.5 text-[11px] font-medium text-zinc-700 backdrop-blur-xl"
            >
              {copy.controls.next}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePanel(1);
                setCreatePhase(0);
              }}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50/75 px-2 py-1.5 text-[11px] font-medium text-emerald-700 backdrop-blur-xl sm:col-span-1"
            >
              <CalendarPlus2 className="h-3.5 w-3.5" />
              {copy.panelTags[1]}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/55 p-2 backdrop-blur-xl sm:grid-cols-4">
            {featurePanels.map((panel, index) => (
              <motion.button
                key={panel.id}
                type="button"
                onClick={() => {
                  setActivePanel(index);
                }}
                animate={{
                  backgroundColor: index === activePanel ? "rgba(240,253,250,0.95)" : "rgba(255,255,255,0.75)",
                  borderColor: index === activePanel ? "rgba(16,185,129,0.5)" : "rgba(228,228,231,0.9)",
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="rounded-xl border px-2 py-1.5 text-center text-[11px] font-medium text-zinc-700"
              >
                {panel.chip}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPanel.id}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mt-3 rounded-2xl border border-white/80 bg-white/75 p-3.5 backdrop-blur-xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[11px] text-zinc-700">
                  <currentPanel.icon className="h-3.5 w-3.5 text-emerald-600" />
                  {currentPanel.chip}
                </span>
                <span className="text-[11px] text-zinc-500">{copy.workflowsTitle}</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">{currentPanel.title}</h3>
              <p className="mt-1 text-xs leading-5 text-zinc-600">{currentPanel.description}</p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1.15fr_0.85fr]">
                <div
                  className="overflow-hidden rounded-xl border border-white/80 bg-white/70"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200/70 bg-white/80 px-2 py-1 text-[10px] text-zinc-600">
                    <span>{copy.stream}</span>
                    <span>{copy.event}</span>
                  </div>
                  <video autoPlay muted loop playsInline src={primaryVideo} className="h-28 w-full object-cover" />
                </div>
                <div
                  className="rounded-xl border border-white/80 bg-zinc-100/80 bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${secondaryImage})`, backgroundSize: "cover" }}
                />
              </div>

              <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/75 p-2.5">
                <div className="flex items-center justify-between text-[11px] text-emerald-800">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {copy.workflowsSubtitle}
                  </span>
                  <span className="font-semibold">{steps[activeStep]?.metric}</span>
                </div>
              </div>

              {currentPanel.id === "create-tournament" ? (
                <div className="mt-2 rounded-xl border border-white/80 bg-white/70 p-2.5">
                  <p className="text-[11px] font-semibold text-zinc-700">
                    {createPhase < 3 ? copy.controls.createDraft : copy.controls.createReady}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] text-zinc-600">
                    <div className="rounded-lg border border-white/80 bg-white/85 px-2 py-1.5">
                      {copy.controls.format}: {createPhase >= 1 ? "Modern BO3" : "--"}
                    </div>
                    <div className="rounded-lg border border-white/80 bg-white/85 px-2 py-1.5">
                      {copy.controls.slots}: {createPhase >= 2 ? "64" : "--"}
                    </div>
                    <div className="rounded-lg border border-white/80 bg-white/85 px-2 py-1.5">
                      {copy.controls.ruleSet}: {createPhase >= 3 ? "Swiss + Top 8" : "--"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreatePhase((current) => (current + 1) % 4)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50/80 px-2.5 py-1.5 text-[11px] font-medium text-blue-700"
                  >
                    <CalendarPlus2 className="h-3.5 w-3.5" />
                    {createPhase === 3 ? copy.controls.published : copy.controls.publish}
                  </button>
                </div>
              ) : null}

              <div className="mt-2 space-y-1.5">
                {currentPanel.points.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-white/80 bg-white/70 px-2.5 py-1.5 text-[11px] text-zinc-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              2,340 {copy.watching}
            </span>
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
              {copy.labels.apiSync}: {steps[1].metric}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

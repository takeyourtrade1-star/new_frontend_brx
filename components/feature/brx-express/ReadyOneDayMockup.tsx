"use client";

import { useState, useEffect } from "react";
import { Camera, RefreshCw, Crown, PackageOpen, Layers, Shield, MessageSquare, CheckCircle2, Users, Maximize2, Minimize2, Plus, Bell, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { motion } from "framer-motion";

type Language = "it" | "en" | "de";

// We'll hardcode language to "it" here since we just want the mockup logic standalone. 
// If we want it dynamic we could accept a language prop, but for a mockup it's fine.

export function ReadyOneDayMockup() {
  const language = "it";

  const [selectedHubZone, setSelectedHubZone] = useState<"it" | "de" | "fr" | "es" | "benelux">("it");
  const [apiSyncEnabled, setApiSyncEnabled] = useState(true);
  const [sponsoredPlacement, setSponsoredPlacement] = useState("Hybrid Balance");

  const stockStats = {
    received: 14500,
    queue: 1200,
    ready: 13300,
    sla: "99.8%",
    latency: "12ms",
    hub: "Milano Nord",
  };

  const metricsByZone = {
    it: { received: 14500, queue: 1200, ready: 13300, sla: "99.8%", latency: "12ms", hub: "Milano Nord" },
    de: { received: 28000, queue: 3500, ready: 24500, sla: "99.2%", latency: "8ms", hub: "Frankfurt" },
    fr: { received: 11200, queue: 800, ready: 10400, sla: "99.9%", latency: "15ms", hub: "Paris Est" },
    es: { received: 8400, queue: 1100, ready: 7300, sla: "98.5%", latency: "22ms", hub: "Madrid" },
    benelux: { received: 9600, queue: 400, ready: 9200, sla: "99.9%", latency: "9ms", hub: "Amsterdam" },
  };

  const readyZoneMetrics = metricsByZone[selectedHubZone];

  const ready = {
    title: "Ready One Day Network",
    subtitle:
      "Creiamo una rete di hub europei dove voi e i vostri venditori spedite direttamente le carte: noi le gradiamo, le verifichiamo, le pubblichiamo sul marketplace e sincronizziamo tutto via API.",
    badge: "Simulazione live hub",
    objectiveTitle: "Obiettivo strategico",
    objectiveBody:
      "Avere più hub in Europa per ridurre i tempi di consegna, aumentare il sell-through e integrare la logistica 24h direttamente nella vostra piattaforma.",
    objectivePoints: [
      "Invio diretto delle carte dai venditori verso hub locali.",
      "Grading e controllo qualità prima della messa online.",
      "Sync automatico con stock, routing e marketplace via API complete.",
    ],
    processTitle: "Come funziona",
    processSteps: [
      "Inbound stock da voi e dalla rete venditori",
      "Grading professionale e quality check",
      "Smistamento verso hub regionali UE",
      "Sync automatico su stock e marketplace",
    ],
    stepLabel: "Step",
    simulatorTitle: "Simulatore zona->hub",
    zoneLabel: "Zona attiva",
    cardsReceived: "Carte ricevute oggi",
    gradedQueue: "In coda grading",
    sameDayReady: "Pronte in giornata",
    latency: "Latenza sync API",
    apiPanelTitle: "Accesso API & Distribution",
    apiStatus: "Stato sync",
    placementLabel: "Modalità routing",
    placementOptions: ["National First", "Hybrid Balance", "International Boost"],
    outcomesTitle: "Movimento stock",
    outcomes: [
      "Disponibilità nazionale attivata in tempo reale in base alla domanda.",
      "Riallocazione dinamica tra hub nazionali e internazionali.",
      "Dispatch veloce aumenta conversione e sell-through.",
    ],
    pricingTitle: "Modello commerciale esclusivo",
    pricingBody:
      "La nostra commissione è del 10% sul prezzo di vendita di ogni carta, con un tetto massimo di 100 EUR per carta. Voi mantenete pieno controllo sul prezzo di rivendita e trattenete tutto l'upside di margine aggiuntivo.",
    flowLabel: "Flusso",
    flowNodes: ["Venditori", "Grading", "Hub Pool", "Spedizione"],
    chartATitle: "Velocità dispatch (prima/dopo hub routing)",
    chartABeforeLabel: "Prima del routing hub",
    chartAAfterLabel: "Dopo Ready One Day",
    chartBTitle: "Uplift sell-through dopo localizzazione stock",
    chartBBaselineLabel: "Sell-through baseline",
    chartBLocalizedLabel: "Sell-through con stock localizzato",
  };

  return (
    <div className="relative overflow-visible rounded-[28px] border border-white/10 bg-[#0d1219] shadow-[0_35px_120px_rgba(0,0,0,0.55)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#1D3160] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-white/60">BRX Express Internal Dashboard</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Bell className="h-3.5 w-3.5 text-white/40" />
          Network Live
        </div>
      </div>

      <div className="p-3">
        <div className="flex flex-col overflow-hidden rounded-xl border border-white/8 bg-[#0a0e14] p-4 min-h-[620px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/90">{ready.title}</p>
              <p className="mt-1 max-w-4xl text-[11px] text-white/50">{ready.subtitle}</p>
            </div>
            <span className="rounded-full border border-[#FF7300]/20 bg-[#FF7300]/10 px-2.5 py-1 text-[10px] font-medium text-[#FF7300]">
              {ready.badge}
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-white/8 bg-[#111827] p-3">
            <p className="text-xs font-semibold text-white/90">{ready.objectiveTitle}</p>
            <p className="mt-1 text-[11px] leading-5 text-white/70">{ready.objectiveBody}</p>
            <div className="mt-2 space-y-1 text-[10px] text-white/50">
              {ready.objectivePoints.map((point) => (
                <p key={point}>• {point}</p>
              ))}
            </div>
          </div>

          <div className="mt-3 grid min-h-0 flex-1 grid-cols-[0.33fr_0.34fr_0.33fr] gap-3">
            {/* Process Section */}
            <div className="min-h-0 rounded-xl border border-white/8 bg-[#111827] p-3">
              <p className="text-xs font-medium text-white/70">{ready.processTitle}</p>
              <div className="mt-2 space-y-2">
                {ready.processSteps.map((step, idx) => (
                  <div key={step} className="rounded-lg border border-white/5 bg-[#0a0e14] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/30">
                      {ready.stepLabel} {idx + 1}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/80">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulator Section */}
            <div className="min-h-0 rounded-xl border border-white/8 bg-[#111827] p-3">
              <p className="text-xs font-medium text-white/70">{ready.simulatorTitle}</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                {[
                  { id: "it", label: "Italy" },
                  { id: "de", label: "Germany" },
                  { id: "fr", label: "France" },
                  { id: "es", label: "Spain" },
                  { id: "benelux", label: "Benelux" },
                ].map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedHubZone(zone.id as "it" | "de" | "fr" | "es" | "benelux")}
                    className={`rounded-md border px-2 py-1.5 ${
                      selectedHubZone === zone.id
                        ? "border-[#FF7300] bg-[#FF7300]/15 text-[#FF7300]"
                        : "border-white/5 bg-[#0a0e14] text-white/50"
                    }`}
                  >
                    {zone.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-white/5 bg-[#0a0e14] p-2.5">
                <p className="text-[10px] text-white/50">
                  {ready.zoneLabel}: <span className="font-medium text-white/80">{readyZoneMetrics.hub}</span>
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded bg-[#111827] px-2 py-1.5 border border-white/5">
                    <p className="text-white/40">{ready.cardsReceived}</p>
                    <p className="font-semibold text-white/90">{readyZoneMetrics.received.toLocaleString()}</p>
                  </div>
                  <div className="rounded bg-[#111827] px-2 py-1.5 border border-white/5">
                    <p className="text-white/40">{ready.gradedQueue}</p>
                    <p className="font-semibold text-white/90">{readyZoneMetrics.queue}</p>
                  </div>
                  <div className="rounded bg-[#111827] px-2 py-1.5 border border-white/5">
                    <p className="text-white/40">{ready.sameDayReady}</p>
                    <p className="font-semibold text-white/90">{readyZoneMetrics.ready.toLocaleString()}</p>
                  </div>
                  <div className="rounded bg-[#111827] px-2 py-1.5 border border-white/5">
                    <p className="text-white/40">{ready.latency}</p>
                    <p className="font-semibold text-[#FF7300]">{readyZoneMetrics.latency}</p>
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-white/5 bg-[#0a0e14] px-2.5 py-2 text-[11px] text-white/70">
                SLA: <span className="text-emerald-400 font-semibold">{readyZoneMetrics.sla}</span>
              </div>

              <div className="mt-2 rounded-lg border border-white/5 bg-[#0a0e14] p-2.5">
                <p className="text-[10px] text-white/50">{ready.flowLabel}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-white/60">
                  <span className="rounded bg-[#111827] px-1.5 py-1 border border-white/5">{ready.flowNodes[0]}</span>
                  <span className="text-white/30">{"->"}</span>
                  <span className="rounded bg-[#111827] px-1.5 py-1 border border-white/5">{ready.flowNodes[1]}</span>
                  <span className="text-white/30">{"->"}</span>
                  <span className="rounded bg-[#111827] px-1.5 py-1 border border-white/5">{ready.flowNodes[2]}</span>
                  <span className="text-white/30">{"->"}</span>
                  <span className="rounded bg-[#111827] px-1.5 py-1 border border-[#FF7300]/20 text-[#FF7300]">{ready.flowNodes[3]}</span>
                </div>
              </div>
            </div>

            {/* API & Outcomes Section */}
            <div className="min-h-0 space-y-2 overflow-y-auto rounded-xl border border-white/8 bg-[#111827] p-3">
              <div className="rounded-lg border border-white/5 bg-[#0a0e14] p-2.5">
                <p className="text-xs font-medium text-white/70">{ready.apiPanelTitle}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-white/50">{ready.apiStatus}</span>
                  <button
                    type="button"
                    onClick={() => setApiSyncEnabled((prev) => !prev)}
                    className={`rounded-full px-2 py-1 text-[10px] ${
                      apiSyncEnabled ? "bg-[#FF7300]/15 text-[#FF7300]" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {apiSyncEnabled ? "SYNC ONLINE" : "SYNC PAUSED"}
                  </button>
                </div>

                <p className="mt-2 text-[10px] text-white/50">{ready.placementLabel}</p>
                <div className="mt-1.5 grid grid-cols-1 gap-1.5">
                  {ready.placementOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSponsoredPlacement(option)}
                      className={`rounded-md border px-2 py-1.5 text-left text-[10px] ${
                        sponsoredPlacement === option
                          ? "border-[#FF7300] bg-[#FF7300]/10 text-white/90"
                          : "border-white/5 bg-[#111827] text-white/50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-[#0a0e14] p-2.5">
                <p className="text-xs font-medium text-white/70">{ready.chartATitle}</p>
                <div className="mt-2 space-y-2 text-[10px]">
                  <div>
                    <div className="mb-1 flex justify-between text-white/50">
                      <span>{ready.chartABeforeLabel}</span>
                      <span>9-14 days</span>
                    </div>
                    <div className="h-2 rounded bg-[#111827]">
                      <div className="h-2 w-[28%] rounded bg-white/20" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-white/50">
                      <span>{ready.chartAAfterLabel}</span>
                      <span className="text-[#FF7300]">24h</span>
                    </div>
                    <div className="h-2 rounded bg-[#111827]">
                      <div className="h-2 w-[86%] rounded bg-[#FF7300]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#FF7300]/20 bg-[#FF7300]/5 p-2.5">
                <p className="text-xs font-medium text-[#FF7300]">{ready.pricingTitle}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/70">{ready.pricingBody}</p>
              </div>

              <div className="rounded-lg border border-white/5 bg-[#0a0e14] p-2.5">
                <p className="text-xs font-medium text-white/70">{ready.outcomesTitle}</p>
                <div className="mt-2 space-y-2 text-[10px]">
                  <div>
                    <div className="mb-1 flex justify-between text-white/50">
                      <span>Vendors inbound</span>
                      <span>{readyZoneMetrics.received}</span>
                    </div>
                    <div className="h-2 rounded bg-[#111827]">
                      <div className="h-2 w-[86%] rounded bg-blue-500" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-white/50">
                      <span>Grading completion</span>
                      <span>{Math.max(0, readyZoneMetrics.received - readyZoneMetrics.queue)}</span>
                    </div>
                    <div className="h-2 rounded bg-[#111827]">
                      <div className="h-2 w-[72%] rounded bg-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-white/50">
                      <span>National stock shift</span>
                      <span>64%</span>
                    </div>
                    <div className="h-2 rounded bg-[#111827]">
                      <div className="h-2 w-[64%] rounded bg-indigo-500" />
                    </div>
                  </div>
                  <div className="pt-1 text-[11px] text-white/40">
                    {ready.outcomes.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

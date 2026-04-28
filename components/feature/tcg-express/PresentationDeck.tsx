"use client";

import { motion } from "framer-motion";
import { Gauge, HeartHandshake, ShieldCheck, Sparkles, TimerReset, Truck, Users } from "lucide-react";
import { useLanguage } from "@/components/feature/tcg-express/i18n/LanguageProvider";
import { ScrollytellingSection } from "@/components/feature/tcg-express/ScrollytellingSection";
import { RoiCalculator } from "@/components/feature/tcg-express/RoiCalculator";
import { HeroLiveSection } from "@/components/feature/tcg-express/HeroLiveSection";
import { TournamentAcquisitionSection } from "@/components/feature/tcg-express/TournamentAcquisitionSection";

function StatusQuoSection() {
  const { t, language } = useLanguage();
  const content = {
    de: {
      kicker: "Operational Architecture",
      metrics: [
        { label: "Dispatch Speed", current: 24, legacy: 72, suffix: "h", betterLower: true },
        { label: "Doppelverkaufs-Risiko", current: 0, legacy: 15, suffix: "%", betterLower: true },
      ],
      flowSummary: "Hub locale -> Controllo esperto -> Spedizione immediata dall'hub piu vicino",
      expert:
        "Jede Karte wird vor dem Listing von Experten geprüft (Zustand, Identität, Upload-Qualität), damit Käufer sofort eine verlässliche Ready-to-Ship-Karte erhalten.",
      nearestHub:
        "Nach Abschluss der Prüfung wird aus dem nächstgelegenen Hub mit sofortigem Dispatch versendet, um Zustellzeiten und Kosten zu minimieren.",
      chartLegendCurrent: "Unser Modell",
      chartLegendLegacy: "Traditionell",
    },
    en: {
      kicker: "Operational Architecture",
      metrics: [
        { label: "Dispatch Speed", current: 24, legacy: 72, suffix: "h", betterLower: true },
        { label: "Double-sale Risk", current: 0, legacy: 15, suffix: "%", betterLower: true },
      ],
      flowSummary: "Local hub intake -> Expert card check -> Immediate shipping from nearest hub",
      expert:
        "Every card is checked by experts before listing (condition, identity, upload quality), so buyers receive reliable ready-to-ship inventory.",
      nearestHub:
        "Once validation is complete, orders are dispatched immediately from the nearest hub to reduce transit time and cost.",
      chartLegendCurrent: "Our Model",
      chartLegendLegacy: "Legacy",
    },
    it: {
      kicker: "Architettura Operativa",
      metrics: [
        { label: "Velocita di dispatch", current: 24, legacy: 72, suffix: "h", betterLower: true },
        { label: "Rischio doppia vendita", current: 0, legacy: 15, suffix: "%", betterLower: true },
      ],
      flowSummary: "Hub locale -> Controllo esperto -> Spedizione immediata dall'hub piu vicino",
      expert:
        "Ogni carta viene controllata da esperti prima del listing (condizione, identita, qualita upload), cosi il cliente acquista stock realmente pronto alla spedizione.",
      nearestHub:
        "Dopo la validazione, l'ordine parte subito dall'hub piu vicino, riducendo tempi e costo di consegna.",
      chartLegendCurrent: "Nostro modello",
      chartLegendLegacy: "Modello tradizionale",
    },
  } as const;
  const data = content[language];

  return (
    <section className="px-6 py-8 sm:px-10 lg:px-16 md:snap-start md:min-h-[calc(100vh-72px)]">
      <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{data.kicker}</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">{t.slides.s4.title}</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">{t.slides.s4.description}</p>
          <div className="mt-5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            {data.flowSummary}
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                <p className="text-sm leading-6 text-emerald-900">{data.expert}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-blue-700" />
                <p className="text-sm leading-6 text-blue-900">{data.nearestHub}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-zinc-200 bg-white/85 p-6">
          <p className="mb-4 text-sm font-medium text-zinc-800">Vantaggi logistici chiave</p>
          <div className="space-y-4">
            {data.metrics.map((metric, idx) => (
              <div key={metric.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-600">{metric.label}</p>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{data.chartLegendCurrent}</span>
                      <span className="font-semibold text-emerald-700">
                        {metric.current}
                        {metric.suffix}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${metric.betterLower ? Math.max(8, 100 - metric.current) : metric.current}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: idx * 0.12 }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{data.chartLegendLegacy}</span>
                      <span className="font-semibold text-zinc-700">
                        {metric.legacy}
                        {metric.suffix}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${metric.betterLower ? Math.max(8, 100 - metric.legacy) : metric.legacy}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: idx * 0.14 + 0.1 }}
                        className="h-full rounded-full bg-zinc-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
            <p className="font-medium text-zinc-900">Sintesi</p>
            <p className="mt-1">Carte verificate da esperti + spedizione immediata dal nodo piu vicino.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeepDiveSections() {
  const { language } = useLanguage();
  const content = {
    de: {
      sectionA: {
        kicker: "Wie es im Alltag funktioniert",
        title: "Operativer Ablauf: vom Seller bis zur 24h-Lieferung",
        intro:
          "Der Prozess ist standardisiert und nachvollziehbar. Jede Phase reduziert Fehler, beschleunigt die Zustellung und hält den Inventory-Status immer konsistent.",
        points: [
          {
            title: "1) Lokaler Eingang",
            text: "Seller senden an den nächstgelegenen Hub, statt international einzeln zu versenden.",
          },
          {
            title: "2) Experten-Check",
            text: "Identität, Zustand und Listing-Qualität werden vor Freigabe verifiziert.",
          },
          {
            title: "3) API-Sync + Go-Live",
            text: "Freigegebene Karten gehen sofort live auf den offiziellen Account.",
          },
          {
            title: "4) Versand vom nächsten Hub",
            text: "Der finale Dispatch startet aus dem günstigsten und schnellsten Knotenpunkt.",
          },
        ],
      },
      sectionB: {
        kicker: "Warum dieses Modell gewinnt",
        title: "Konkrete Vorteile für Logistik, Seller und Buyer",
        cards: [
          {
            title: "Logistik-Klarheit",
            text: "Ein orchestrierter Flow ersetzt fragmentierte Einzelsendungen.",
          },
          {
            title: "Verkaufs-Sicherheit",
            text: "Single Source of Truth im Vault senkt das Risiko von Doppelverkäufen auf 0%.",
          },
          {
            title: "Speed für Käufer",
            text: "Bereits geprüfte Karten werden direkt aus dem nächstgelegenen Hub versendet.",
          },
          {
            title: "Weniger Support-Last",
            text: "Weniger Konflikte bei Bestand, Preis und Verfügbarkeit bedeuten weniger Tickets.",
          },
        ],
      },
    },
    en: {
      sectionA: {
        kicker: "How it works day-to-day",
        title: "Operational flow: from seller intake to 24h delivery",
        intro:
          "The process is standardized and fully traceable. Each phase reduces errors, accelerates delivery, and keeps inventory status consistent.",
        points: [
          {
            title: "1) Local intake",
            text: "Sellers ship to the nearest hub instead of fragmented international parcels.",
          },
          {
            title: "2) Expert validation",
            text: "Identity, condition, and listing quality are checked before approval.",
          },
          {
            title: "3) API sync + go live",
            text: "Approved cards are instantly published on the official account.",
          },
          {
            title: "4) Nearest-hub dispatch",
            text: "Final shipping starts from the fastest and most cost-efficient node.",
          },
        ],
      },
      sectionB: {
        kicker: "Why this model wins",
        title: "Concrete benefits for logistics, sellers, and buyers",
        cards: [
          {
            title: "Logistics clarity",
            text: "One orchestrated flow replaces fragmented shipment chains.",
          },
          {
            title: "Sales safety",
            text: "Vault single source of truth keeps double-sale risk at 0%.",
          },
          {
            title: "Buyer speed",
            text: "Pre-checked cards ship immediately from the nearest hub.",
          },
          {
            title: "Lower support load",
            text: "Fewer inventory and availability conflicts means fewer tickets.",
          },
        ],
      },
    },
    it: {
      sectionA: {
        kicker: "Come funziona ogni giorno",
        title: "Un flusso semplice, controllato e veloce",
        intro:
          "Il modello e progettato per essere chiaro in ogni passaggio: presa in carico locale, controllo esperto, sincronizzazione e spedizione immediata.",
        points: [
          {
            title: "1) Ingresso locale",
            text: "I seller spediscono all'hub piu vicino, evitando spedizioni internazionali frammentate.",
          },
          {
            title: "2) Validazione esperta",
            text: "Identita, condizione e qualita listing vengono controllate prima della pubblicazione.",
          },
          {
            title: "3) Sync API + pubblicazione",
            text: "Le carte approvate vanno live subito sull'account ufficiale.",
          },
          {
            title: "4) Dispatch nearest hub",
            text: "La spedizione finale parte dal nodo piu veloce e conveniente.",
          },
        ],
      },
      sectionB: {
        kicker: "Perche questo modello vince",
        title: "Vantaggi reali, misurabili e immediati",
        cards: [
          {
            title: "Logistica chiara",
            text: "Un flusso orchestrato sostituisce catene di spedizioni frammentate.",
          },
          {
            title: "Sicurezza vendita",
            text: "Single source of truth nel vault: rischio doppia vendita a 0%.",
          },
          {
            title: "Velocita per il cliente",
            text: "Carte gia controllate spedite subito dall'hub piu vicino.",
          },
          {
            title: "Meno carico supporto",
            text: "Meno conflitti su stock e disponibilita significa meno ticket.",
          },
        ],
      },
    },
  } as const;

  const data = content[language];
  const sectionBIcons = [Gauge, ShieldCheck, Truck, Sparkles] as const;

  return (
    <>
      <section className="px-6 py-8 sm:px-10 lg:px-16 md:snap-start md:min-h-[calc(100vh-72px)]">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/60 bg-gradient-to-b from-white to-zinc-50/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{data.sectionA.kicker}</p>
          <h2 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            {data.sectionA.title}
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg">{data.sectionA.intro}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-700">
              Expert checked cards
            </div>
            <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-700">
              Real-time vault status
            </div>
            <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-700">
              Nearest-hub dispatch
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.sectionA.points.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.07 }}
                className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-8 sm:px-10 lg:px-16 md:snap-start md:min-h-[calc(100vh-72px)]">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/60 bg-gradient-to-b from-white to-zinc-50/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{data.sectionB.kicker}</p>
          <h2 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            {data.sectionB.title}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Double-sale risk: 0%</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">Dispatch target: &lt; 24h</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.sectionB.cards.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.07 }}
                className="rounded-2xl border border-zinc-200/80 bg-white/90 p-5 backdrop-blur-sm"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
                  {(() => {
                    const Icon = sectionBIcons[idx] ?? Sparkles;
                    return <Icon className="h-4 w-4 text-zinc-700" />;
                  })()}
                </div>
                <p className="text-base font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function FinalClosingSection() {
  const { language } = useLanguage();
  const copy = {
    de: {
      kicker: "Closing Note",
      title: "Vielen Dank für Ihre Zeit und Ihr strategisches Feedback",
      description:
        "Wir schließen diese Phase mit klaren Ergebnissen ab: Die Backend-Infrastruktur ist vollständig produktionsreif, und das orchestrierte Logistikmodell wurde bereits technisch validiert.",
      milestonesTitle: "Aktueller Projektstatus",
      milestones: [
        "Backend-Infrastruktur: vollständig bereit (API, Routing, Vault-Logik, Monitoring).",
        "Seit zwei Monaten laufen reservierte Demo-Zugänge mit ausgewählten Sellern.",
        "Das aktuelle Demo-Fenster dient der Feinjustierung von UX, Operations und Seller-Flows.",
      ],
      cards: [
        { title: "Status heute", value: "Infra ready", hint: "End-to-end stack live" },
        { title: "Demo-Phase", value: "Seit 2 Monaten aktiv", hint: "Seller-only access" },
        { title: "Nächster Schritt", value: "Controlled scale", hint: "Rollout plan in progress" },
      ],
      thanks: "Vielen Dank. Wir sind bereit für die finale Abstimmung und einen skalierbaren Rollout.",
    },
    en: {
      kicker: "Closing Note",
      title: "Thank you for your time and strategic feedback",
      description:
        "We conclude this phase with clear outcomes: the backend infrastructure is fully production-ready, and the orchestrated logistics model has already been technically validated.",
      milestonesTitle: "Where we are now",
      milestones: [
        "Backend infrastructure: fully ready (API, routing, vault logic, monitoring).",
        "For the last two months we have run reserved demo access with selected sellers.",
        "The current demo window is focused on final UX, operations, and seller-flow improvements.",
      ],
      cards: [
        { title: "Status today", value: "Infra ready", hint: "End-to-end stack live" },
        { title: "Demo phase", value: "Started 2 months ago", hint: "Seller-only access" },
        { title: "Next step", value: "Controlled scale", hint: "Rollout plan in progress" },
      ],
      thanks: "Thank you. We are ready for final alignment and scalable rollout.",
    },
    it: {
      kicker: "Nota finale",
      title: "Grazie per il tempo e per il confronto strategico",
      description:
        "Chiudiamo questa fase con risultati chiari: l'infrastruttura backend è completamente pronta per la produzione e il modello logistico orchestrato è già stato validato tecnicamente.",
      milestonesTitle: "Punto in cui siamo oggi",
      milestones: [
        "Infrastruttura backend: tutta pronta (API, routing, logica vault, monitoraggio).",
        "Da due mesi sono attivi accessi demo riservati con seller selezionati.",
        "La fase demo corrente è dedicata agli ultimi miglioramenti su UX, operations e flussi seller.",
      ],
      cards: [
        { title: "Stato attuale", value: "Infra ready", hint: "Stack end-to-end operativo" },
        { title: "Fase demo", value: "Già iniziata da 2 mesi", hint: "Accessi riservati seller" },
        { title: "Prossimo step", value: "Scale controllata", hint: "Piano rollout in finalizzazione" },
      ],
      thanks: "Grazie. Siamo pronti all'allineamento finale e al rollout scalabile.",
    },
  } as const;
  const data = copy[language];
  const cardIcons = [ShieldCheck, Users, TimerReset] as const;

  return (
    <section className="px-6 py-10 sm:px-10 lg:px-16 md:snap-start md:min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6 text-white shadow-[0_30px_100px_rgba(2,6,23,0.55)] sm:p-8">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute"
          initial={{ opacity: 0.25 }}
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">{data.kicker}</p>
        <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">{data.title}</h2>
        <p className="mt-5 max-w-4xl text-base leading-7 text-zinc-200 sm:text-lg">{data.description}</p>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-zinc-100">{data.milestonesTitle}</p>
            <div className="mt-4 space-y-3">
              {data.milestones.map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.08 }}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-zinc-100">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {data.cards.map((card, idx) => {
              const Icon = cardIcons[idx] ?? Sparkles;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.1 }}
                  className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Icon className="h-4 w-4 text-emerald-300" />
                    <p className="text-xs uppercase tracking-wide">{card.title}</p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
                  <p className="mt-1 text-xs text-zinc-300">{card.hint}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3"
        >
          <p className="text-sm font-medium text-emerald-200">{data.thanks}</p>
        </motion.div>
      </div>
    </section>
  );
}

export function PresentationDeck() {
  const { t } = useLanguage();

  return (
    <div className="h-auto overflow-y-visible scroll-smooth md:h-[calc(100vh-72px)] md:snap-y md:snap-mandatory md:overflow-y-auto">
      <HeroLiveSection />
      <TournamentAcquisitionSection />
      <section className="py-4 md:snap-start md:min-h-[calc(100vh-72px)]">
        <div className="px-0">
          <div className="px-6 sm:px-10 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            />
          </div>
          <ScrollytellingSection />
        </div>
      </section>
      <StatusQuoSection />
      <DeepDiveSections />
      <section className="py-8 md:snap-start md:min-h-[calc(100vh-72px)]">
        <div className="px-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              {t.slides.s5.title}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg">
              {t.slides.s5.description}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {t.slides.s5.bullets.map((item) => (
                <div key={item} className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <RoiCalculator />
      </section>
      <FinalClosingSection />
    </div>
  );
}

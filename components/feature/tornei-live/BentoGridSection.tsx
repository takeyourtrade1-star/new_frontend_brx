"use client";

import { Euro, ShieldCheck, Timer, Truck } from "lucide-react";
import { useLanguage } from "@/components/feature/tornei-live/i18n/LanguageProvider";

export function BentoGridSection() {
  const { t, language } = useLanguage();
  const localizedBodies = {
    de: {
      feat1: "Planbare Gebührenstruktur mit Schutzdeckel auf hochwertige Transaktionen.",
      feat2: "Industrialisierter Grading-Workflow mit Fixkosten und Enterprise-SLA.",
      feat3: "Einheitliche EU-Versandarchitektur über dezentrale Logistik-Hubs.",
      feat4: "Bidirektionaler API-Lock mit Echtzeit-Sync gegen Bestandskollisionen.",
    },
    en: {
      feat1: "Predictable fee structure with upside protection on high-value transactions.",
      feat2: "Industrialized grading workflow at fixed cost and enterprise SLA.",
      feat3: "Unified EU shipping architecture through decentralized logistics hubs.",
      feat4: "Bidirectional API lock and instant sync to prevent inventory collisions.",
    },
    it: {
      feat1: "Struttura fee prevedibile con protezione margine su transazioni ad alto valore.",
      feat2: "Workflow di grading industrializzato a costo fisso con SLA enterprise.",
      feat3: "Architettura spedizioni UE unificata tramite hub logistici decentralizzati.",
      feat4: "Lock API bidirezionale e sync istantanea per evitare collisioni inventario.",
    },
  } as const;
  const body = localizedBodies[language];
  const items = [
    {
      title: t.bento.feat1,
      body: body.feat1,
      icon: Euro,
      className: "md:col-span-2 md:row-span-1",
    },
    {
      title: t.bento.feat2,
      body: body.feat2,
      icon: ShieldCheck,
      className: "md:col-span-1 md:row-span-2",
    },
    {
      title: t.bento.feat3,
      body: body.feat3,
      icon: Truck,
      className: "md:col-span-1 md:row-span-1",
    },
    {
      title: t.bento.feat4,
      body: body.feat4,
      icon: Timer,
      className: "md:col-span-2 md:row-span-1",
    },
  ] as const;

  return (
    <section id="benefits" className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm text-zinc-500">{t.nav.benefits}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {t.bento.title}
          </h2>
          <p className="mt-2 text-zinc-600">{t.bento.subtitle}</p>
        </div>
        <div className="grid auto-rows-[170px] grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`glass-panel group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 p-5 transition-transform duration-300 hover:-translate-y-1 ${item.className}`}
              >
                <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Icon className="relative z-10 h-5 w-5 text-emerald-600" />
                <h3 className="relative z-10 mt-4 text-lg font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-6 text-zinc-600">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

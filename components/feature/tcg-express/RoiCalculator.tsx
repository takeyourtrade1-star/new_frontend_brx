"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { useLanguage } from "@/components/feature/tcg-express/i18n/LanguageProvider";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RoiCalculator() {
  const { t, language } = useLanguage();
  const copy = {
    de: {
      projection:
        "Beispiel: Bei 16% Endkunden-Fee und unserer 10%-Provision (gedeckelt bei 100 EUR pro Karte) bleibt euch eine Netto-Kommission von 6%.",
      breakdown:
        "Monatlicher Nettoertrag auf Basis eurer Endkunden-Fee, abzüglich unserer 10%-Provision mit Cap von 100 EUR je Karte.",
      competitorFee: "Wettbewerbs-Fee",
      wholesaleFee: "Unsere Provision (mit 100 EUR Cap)",
      selectedFee: "Eure gewählte Fee",
    },
    en: {
      projection:
        "Example: if you set a 16% end-customer fee, your net commission is 6% after our 10% commission (capped at EUR 100 per card).",
      breakdown:
        "Monthly net earnings based on your end-customer fee, minus our 10% commission with a EUR 100 cap per card.",
      competitorFee: "Competitor fee",
      wholesaleFee: "Our commission (EUR 100 cap)",
      selectedFee: "Your selected fee",
    },
    it: {
      projection:
        "Esempio: se impostate una fee finale al 16%, la vostra commissione netta diventa il 6% dopo la nostra commissione del 10% (con cap massimo di 100 EUR per carta).",
      breakdown:
        "Guadagno netto mensile calcolato sulla vostra fee finale, al netto della nostra commissione del 10% con tetto massimo di 100 EUR per carta.",
      competitorFee: "Fee concorrenza",
      wholesaleFee: "Nostra commissione (cap 100 EUR)",
      selectedFee: "Fee selezionata da voi",
    },
  } as const;
  const [volume, setVolume] = useState(120000);
  const [resaleFee, setResaleFee] = useState(16);
  const [animatedMargin, setAnimatedMargin] = useState(7200);
  const animatedMarginRef = useRef(animatedMargin);
  const wholesaleFee = 10;
  const competitorFee = "17-18%";

  const netCommissionRate = Math.max(resaleFee - wholesaleFee, 0);
  const netMargin = Math.round(volume * (netCommissionRate / 100));

  useEffect(() => {
    const controls = animate(animatedMarginRef.current, netMargin, {
      duration: 0.65,
      ease: "easeOut",
      onUpdate: (latest) => {
        const rounded = Math.round(latest);
        animatedMarginRef.current = rounded;
        setAnimatedMargin(rounded);
      },
    });
    return () => controls.stop();
  }, [netMargin]);

  return (
    <section id="roi" className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel rounded-3xl border border-zinc-200 bg-white/80 p-6 sm:p-10">
          <p className="text-sm text-zinc-500">{t.nav.roi}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {t.roi.title}
          </h2>
          <p className="mt-2 text-zinc-600">{t.roi.subtitle}</p>
          <p className="mt-2 text-sm text-zinc-500">{t.roi.benchmark}</p>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <label htmlFor="vault-volume" className="text-sm text-zinc-700">
                {t.roi.volume}
              </label>
              <input
                id="vault-volume"
                type="range"
                min={20000}
                max={5000000}
                step={5000}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-emerald-500"
              />
              <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
                <span>€20.000</span>
                <span className="text-zinc-900">{formatCurrency(volume)}</span>
                <span>€5.000.000</span>
              </div>
              <div className="mt-8">
                <label htmlFor="resale-fee" className="text-sm text-zinc-700">
                  {t.roi.resaleFee}
                </label>
                <input
                  id="resale-fee"
                  type="range"
                  min={10}
                  max={22}
                  step={0.5}
                  value={resaleFee}
                  onChange={(event) => setResaleFee(Number(event.target.value))}
                  className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-emerald-500"
                />
                <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
                  <span>10%</span>
                  <span className="text-zinc-900">{resaleFee.toFixed(1)}%</span>
                  <span>22%</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50 p-6">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                {t.roi.netCommission}
              </p>
              <p className="mt-3 text-4xl font-semibold text-emerald-800 sm:text-5xl">
                {formatCurrency(animatedMargin)}
              </p>
              <p className="mt-3 text-sm text-zinc-600">
                {copy[language].projection}
              </p>
              <div className="mt-4 space-y-2 rounded-xl border border-emerald-200/80 bg-white/70 p-4 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>{copy[language].competitorFee}</span>
                  <span className="font-medium text-zinc-900">{competitorFee}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>{copy[language].wholesaleFee}</span>
                  <span className="font-medium text-zinc-900">{wholesaleFee}%</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>{copy[language].selectedFee}</span>
                  <span className="font-medium text-zinc-900">{resaleFee.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-200 pt-2 text-zinc-700">
                  <span>{t.roi.netCommission}</span>
                  <span className="font-semibold text-emerald-800">{netCommissionRate.toFixed(1)}%</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">{copy[language].breakdown}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

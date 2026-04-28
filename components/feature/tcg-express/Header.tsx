"use client";

import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/feature/tcg-express/i18n/LanguageProvider";
import { languages, type Language } from "@/components/feature/tcg-express/i18n/translations";

const languageLabel: Record<Language, string> = {
  de: "DE",
  en: "EN",
  it: "IT",
};

export function Header() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-16">
        <div className="text-sm font-semibold tracking-wide text-zinc-900 sm:text-base">
          I Sell For You Vault
        </div>
        <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex">
          <a href="#features" className="transition-colors hover:text-zinc-900">
            {t.nav.features}
          </a>
          <a href="#benefits" className="transition-colors hover:text-zinc-900">
            {t.nav.benefits}
          </a>
          <a href="#roi" className="transition-colors hover:text-zinc-900">
            {t.nav.roi}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              aria-label="Language switcher"
              className="appearance-none rounded-lg border border-zinc-300 bg-white py-2 pr-9 pl-3 text-xs font-semibold text-zinc-700 outline-none transition focus:border-emerald-400 sm:text-sm"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {languageLabel[lang]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>
      </div>
    </header>
  );
}

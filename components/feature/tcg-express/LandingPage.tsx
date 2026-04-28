"use client";

import { Header } from "@/components/feature/tcg-express/Header";
import { LanguageProvider } from "@/components/feature/tcg-express/i18n/LanguageProvider";
import { PresentationDeck } from "@/components/feature/tcg-express/PresentationDeck";

export function LandingPage() {
  return (
    <LanguageProvider>
      <main className="relative min-h-screen overflow-x-hidden bg-[#f6f8fb] md:h-screen md:overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(16,185,129,0.08),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.12),transparent_34%)]" />
        <div className="relative z-10 flex h-full flex-col">
          <Header />
          <PresentationDeck />
        </div>
      </main>
    </LanguageProvider>
  );
}

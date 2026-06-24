import { Suspense } from 'react';
import { AiutoContent } from './aiuto-content';

export const metadata = {
  title: 'Centro Assistenza | eBartex – Supporto e FAQ',
  description:
    'Trova risposte immediate alle domande più frequenti su eBartex: account, acquisti, vendite, aste, scambi, spedizioni, pagamenti e altro. Supporto guidato passo-passo.',
  keywords: [
    'ebartex supporto',
    'aiuto ebartex',
    'faq carte collezionabili',
    'assistenza marketplace',
  ],
};

export default function AiutoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F4F0]">
          <span className="sr-only">Caricamento…</span>
        </div>
      }
    >
      <AiutoContent />
    </Suspense>
  );
}

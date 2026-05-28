'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ChevronLeft, ChevronDown, Mail, HelpCircle, Package, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SUPPORT_EMAIL = 'supporto@ebartex.com';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-white/20 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-white/90"
      >
        <span className="font-medium text-white pr-4">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-white/70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        <p className="text-sm text-white/80 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

function AiutoContentInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');

  // Apri automaticamente la tab contatti se il query param è presente
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'contact') {
      setActiveTab('contact');
    }
  }, [searchParams]);

  const faqs = [
    {
      icon: <Package className="h-5 w-5" />,
      question: 'Come posso acquistare carte su Ebartex?',
      answer: 'Per acquistare, cerca la carta desiderata usando la barra di ricerca, seleziona il venditore con il prezzo migliore, aggiungi al carrello e procedi al checkout. Accettiamo pagamenti sicuri tramite carta di credito e altri metodi protetti.',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      question: 'Quali metodi di pagamento sono accettati?',
      answer: 'Accettiamo carte di credito/debito (Visa, Mastercard, American Express), PayPal, e bonifico bancario per ordini di importo superiore. Tutti i pagamenti sono processati in modo sicuro con crittografia SSL.',
    },
    {
      icon: <Truck className="h-5 w-5" />,
      question: 'Quanto tempo impiega la spedizione?',
      answer: 'Le spedizioni in Italia impiegano generalmente 2-5 giorni lavorativi. Per l\'Europa 5-10 giorni. Ogni venditore specifica i tempi di spedizione nel proprio profilo. Riceverai un codice di tracking via email.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      question: 'Come funziona la protezione acquirenti?',
      answer: 'Ebartex offre protezione completa: se non ricevi l\'articolo o non corrisponde alla descrizione, puoi aprire una disputa entro 14 giorni. Il nostro team medierà per risolvere il problema o rimborsarti.',
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      question: 'Posso vendere le mie carte su Ebartex?',
      answer: 'Certo! Registra un account business, sincronizza il tuo inventario con i maggiori marketplace o carica manualmente le tue carte. Puoi gestire prezzi, disponibilità e spedizioni dal pannello venditore.',
    },
  ];

  return (
    <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#3D65C6' }}>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('help.backHome')}
        </Link>

        <div className="mb-10 text-center">
          <h1 className="mb-4 font-display text-3xl font-bold text-white md:text-4xl">
            Hai bisogno di aiuto?
          </h1>
          <p className="mx-auto max-w-2xl text-white/80">
            Trova risposte alle domande frequenti o contatta il nostro team di supporto.
            Siamo qui per aiutarti a ottenere il massimo da Ebartex.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'faq'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'contact'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <Mail className="h-4 w-4" />
            Contattaci
          </button>
        </div>

        {activeTab === 'faq' && (
          <div className="space-y-6">
            <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
              <CardHeader className="border-b border-white/20">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Domande Frequenti
                </CardTitle>
                <CardDescription className="text-white/70">
                  Trova risposte rapide alle domande più comuni
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="divide-y divide-white/10">
                  {faqs.map((faq, index) => (
                    <FAQItem
                      key={index}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openFAQ === index}
                      onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t('help.conditionsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-white/80">{t('help.conditionsText')}</p>
                  <Link
                    href="/legal/condizioni"
                    className="text-sm text-primary hover:text-primary/80 hover:underline"
                  >
                    {t('help.conditionsLink')}
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t('help.buyTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-white/80">
                    <li>{t('help.buy1')}</li>
                    <li>{t('help.buy2')}</li>
                    <li>{t('help.buy3')}</li>
                    <li>{t('help.buy4')}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t('help.shippingTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/80">{t('help.shippingText')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="mx-auto max-w-xl space-y-6">
            <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
              <CardHeader className="border-b border-white/20 text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl text-white">
                  <Mail className="h-5 w-5 text-primary" />
                  {t('help.contactTitle')}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {t('help.contactDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
                <p className="max-w-md text-sm text-white/80">{t('help.contactResponseTime')}</p>
                <Button
                  asChild
                  size="lg"
                  className="bg-primary px-8 font-medium text-white hover:bg-primary/90"
                >
                  <a href={`mailto:${SUPPORT_EMAIL}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    {t('help.contactEmailBtn')}
                  </a>
                </Button>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm text-white/70 transition-colors hover:text-primary"
                >
                  {SUPPORT_EMAIL}
                </a>
              </CardContent>
            </Card>

            <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white">{t('help.contactBeforeTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('help.contactBefore1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('help.contactBefore2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('help.contactBefore3')}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// Wrapper con Suspense per useSearchParams
export function AiutoContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#3D65C6' }}>
        <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        </main>
      </div>
    }>
      <AiutoContentInner />
    </Suspense>
  );
}

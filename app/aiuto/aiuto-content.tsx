'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ChevronLeft, ChevronDown, Mail, MessageSquare, HelpCircle, Package, CreditCard, ShieldCheck, Truck, Camera, ImageIcon, X, FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import html2canvas from 'html2canvas';

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

interface ConsoleLog {
  type: 'log' | 'error' | 'warn';
  message: string;
  timestamp: number;
}

// Storage keys (must match BugReportButton.tsx)
const BUG_REPORT_STORAGE = {
  SCREENSHOT: 'brx_bug_screenshot',
  CONSOLE_LOGS: 'brx_bug_console_logs',
  CATEGORY: 'brx_bug_category',
  TIMESTAMP: 'brx_bug_timestamp',
};

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  account: 'account',
  search: 'functional',
  payment: 'payment',
  auction: 'functional',
  orders: 'functional',
  selling: 'functional',
  messaging: 'functional',
  games: 'functional',
  functional: 'functional',
};

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  bugType?: string;
  priority?: string;
  url?: string;
}

// Componente interno che usa useSearchParams
function AiutoContentInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'faq' | 'bug' | 'contact'>('faq');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const urlFromParams = searchParams.get('url') || '';
  const categoryFromParams = searchParams.get('category') || '';
  
  // Load stored data from localStorage on mount
  useEffect(() => {
    const isBugTab = searchParams.get('tab') === 'bug';
    if (!isBugTab) return;
    
    try {
      // Check timestamp - only load if recent (within 2 minutes)
      const timestamp = localStorage.getItem(BUG_REPORT_STORAGE.TIMESTAMP);
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age > 2 * 60 * 1000) { // 2 minutes
          // Clear old data
          localStorage.removeItem(BUG_REPORT_STORAGE.SCREENSHOT);
          localStorage.removeItem(BUG_REPORT_STORAGE.CONSOLE_LOGS);
          localStorage.removeItem(BUG_REPORT_STORAGE.CATEGORY);
          localStorage.removeItem(BUG_REPORT_STORAGE.TIMESTAMP);
          return;
        }
      }
      
      // Load screenshot
      const storedScreenshot = localStorage.getItem(BUG_REPORT_STORAGE.SCREENSHOT);
      if (storedScreenshot) {
        setScreenshot(storedScreenshot);
      }
      
      // Load console logs
      const storedLogs = localStorage.getItem(BUG_REPORT_STORAGE.CONSOLE_LOGS);
      if (storedLogs) {
        const logs = JSON.parse(storedLogs) as ConsoleLog[];
        setConsoleLogs(logs);
      }
    } catch (e) {
      console.error('Failed to load bug report data:', e);
    }
  }, [searchParams]);
  
  const [bugForm, setBugForm] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    bugType: categoryFromParams ? (CATEGORY_MAP[categoryFromParams] || 'functional') : 'functional',
    priority: 'medium',
    url: urlFromParams,
  });
  const [contactForm, setContactForm] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Apri automaticamente la tab bug se il query param è presente
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'bug') {
      setActiveTab('bug');
    }
  }, [searchParams]);

  // Clear localStorage after successful submit
  const clearStoredBugData = () => {
    localStorage.removeItem(BUG_REPORT_STORAGE.SCREENSHOT);
    localStorage.removeItem(BUG_REPORT_STORAGE.CONSOLE_LOGS);
    localStorage.removeItem(BUG_REPORT_STORAGE.CATEGORY);
    localStorage.removeItem(BUG_REPORT_STORAGE.TIMESTAMP);
  };

  const captureScreenshot = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowHeight: document.documentElement.scrollHeight,
        height: document.documentElement.scrollHeight,
        backgroundColor: null,
        scale: window.devicePixelRatio > 1 ? 1 : 1,
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setScreenshot(dataUrl);
    } catch (err) {
      console.error('Screenshot failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

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
    {
      icon: <MessageSquare className="h-5 w-5" />,
      question: 'Come funzionano gli scambi tra utenti?',
      answer: 'Trova carte che ti interessano, avvia una proposta di scambio con un altro utente. Potete negoziare direttamente sulla piattaforma. Una volta accettato, entrambi spedite le carte e confermate la ricezione.',
    },
  ];

  const handleBugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Include console logs in submission
    const submissionData = {
      ...bugForm,
      screenshot,
      consoleLogs: consoleLogs.length > 0 ? consoleLogs : undefined,
    };
    
    console.log('Bug report submitted:', submissionData);
    
    setSubmitStatus({
      type: 'success',
      message: 'Grazie! La segnalazione è stata inviata. Il nostro team la esaminerà al più presto.',
    });
    
    clearStoredBugData();
    setScreenshot(null);
    setConsoleLogs([]);
    
    setBugForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      bugType: 'functional',
      priority: 'medium',
    });
    setTimeout(() => setSubmitStatus({ type: null, message: '' }), 5000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus({
      type: 'success',
      message: 'Messaggio inviato con successo! Ti risponderemo entro 24-48 ore lavorative.',
    });
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitStatus({ type: null, message: '' }), 5000);
  };

  return (
    <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#3D65C6' }}>
      <Header />
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

        {submitStatus.type && (
          <div
            className={`mb-6 rounded-lg p-4 text-center text-sm ${
              submitStatus.type === 'success'
                ? 'bg-green-500/20 text-green-100 border border-green-500/30'
                : 'bg-red-500/20 text-red-100 border border-red-500/30'
            }`}
          >
            {submitStatus.message}
          </div>
        )}

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
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
                <CardHeader className="border-b border-white/20">
                  <CardTitle className="flex items-center gap-2 text-xl text-white">
                    <Mail className="h-5 w-5 text-primary" />
                    Contatta Ebartex
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Scrivici per domande commerciali, partnership o assistenza generale
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Nome completo</label>
                        <Input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Mario Rossi"
                          className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Email</label>
                        <Input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="tua@email.com"
                          className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Motivo del contatto</label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="" className="bg-[#3D65C6]">Seleziona un motivo...</option>
                        <option value="general" className="bg-[#3D65C6]">Informazioni generali</option>
                        <option value="business" className="bg-[#3D65C6]">Proposta commerciale / Partnership</option>
                        <option value="vendor" className="bg-[#3D65C6]">Diventa venditore</option>
                        <option value="account" className="bg-[#3D65C6]">Problemi account</option>
                        <option value="order" className="bg-[#3D65C6]">Domanda su un ordine</option>
                        <option value="other" className="bg-[#3D65C6]">Altro</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Messaggio</label>
                      <textarea
                        required
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Scrivi il tuo messaggio qui..."
                        className="flex w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Invia messaggio
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Informazioni</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-white/80">
                  <div>
                    <p className="font-medium text-white">Email supporto</p>
                    <a href="mailto:supporto@ebartex.com" className="hover:text-primary transition-colors">
                      supporto@ebartex.com
                    </a>
                  </div>
                  <div>
                    <p className="font-medium text-white">Email commerciale</p>
                    <a href="mailto:business@ebartex.com" className="hover:text-primary transition-colors">
                      business@ebartex.com
                    </a>
                  </div>
                  <div>
                    <p className="font-medium text-white">Orari supporto</p>
                    <p>Lun-Ven: 9:00 - 18:00 CET</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Prima di scrivere</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Controlla le FAQ per risposte immediate
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Per bug tecnici, usa il form "Segnala Bug"
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Includi sempre il tuo username
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Per ordini, allega il numero d'ordine
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
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
        <Header />
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

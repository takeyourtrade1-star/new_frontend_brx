'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  RefreshCw, 
  Shield, 
  Zap, 
  Package, 
  CheckCircle2,
  Clock,
  Globe,
  Sparkles,
  Mail,
  ArrowLeftRight,
  Users,
  Lock
} from 'lucide-react';

// Animation utility components using Tailwind
function FadeIn({ 
  children, 
  className,
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <div 
      className={cn(
        "animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function FadeInLeft({ 
  children, 
  className,
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <div 
      className={cn(
        "animate-in fade-in slide-in-from-left-8 duration-500 fill-mode-backwards",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function HoverCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn(
      "transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl",
      className
    )}>
      {children}
    </div>
  );
}

function StepCard({ 
  number, 
  icon: Icon, 
  title, 
  description,
  delay = 0
}: { 
  number: number; 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay?: number;
}) {
  return (
    <FadeInLeft delay={delay}>
      <div className="group relative">
        <div className="relative flex gap-5 items-start">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7300] to-[#FF8800] shadow-lg shadow-[#FF7300]/25 transition-transform duration-300 group-hover:scale-110">
              <Icon className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            {number < 4 && (
              <div className="mt-4 h-16 w-0.5 bg-gradient-to-b from-[#FF7300]/30 to-transparent" />
            )}
          </div>
          <div className="flex-1 pt-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D3160] text-[10px] font-bold text-white">
                {number}
              </span>
              <h3 className="text-lg font-bold text-[#1D3160]">{title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </FadeInLeft>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <HoverCard className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#FF7300]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7300]/10 to-[#FF8800]/5 text-[#FF7300] transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-[#FF7300] group-hover:to-[#FF8800] group-hover:text-white">
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
          <h3 className="mb-2 text-base font-bold text-[#1D3160]">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
      </HoverCard>
    </FadeIn>
  );
}

function FloatingCard({ 
  children, 
  className,
  delay = 0
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700 fill-mode-backwards rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-xl",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const games = [
  { name: 'Magic: The Gathering', color: '#1D3160', available: true },
  { name: 'Pokémon', color: '#FF7300', available: false },
  { name: 'One Piece', color: '#FF8800', available: false },
  { name: 'Lorcana', color: '#8B5CF6', available: false },
  { name: 'Yu-Gi-Oh!', color: '#1D3160', available: false },
];

// Video Section Component
function ScambiVideoSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative overflow-hidden bg-black py-0">
      <div className="relative h-[60vh] min-h-[500px] w-full">
        {/* Messaggio Fallback */}
        {!videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
            <p className="max-w-md text-lg font-medium tracking-wide text-gray-400 animate-pulse">
              Stiamo creando l&apos;animazione speciale, ancora un attimo per favore...
            </p>
          </div>
        )}

        {/* Video che riempie lo spazio */}
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden
        >
          <source src="/videos/STG_vSnap.mp4" type="video/mp4" />
        </video>

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" aria-hidden />
        
        {/* Testo sopra il video */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Scambia in <span className="text-[#FF7300]">sicurezza</span>
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Il sistema di scambio protetto ti garantisce transazioni affidabili e trasparenti.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ScambiLandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const searchParams = useSearchParams();
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Show video if accessed with ?video=1 param (from pill click)
    const videoParam = searchParams.get('video');
    if (videoParam === '1') {
      setShowVideo(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      {/* Video Section - only shown when coming from pill click */}
      {showVideo && <ScambiVideoSection />}

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#1D3160] via-[#243663] to-[#1D3160]"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-20 h-96 w-96 animate-[spin_20s_linear_infinite] rounded-full bg-[#FF7300]/10 blur-3xl" />
          <div className="absolute -right-20 bottom-20 h-96 w-96 animate-[spin_25s_linear_infinite_reverse] rounded-full bg-[#FF8800]/10 blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        </div>

        <div className="relative z-10 container-content py-20 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Text content */}
            <div className="text-center lg:text-left">
              <FadeIn delay={0}>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#FF7300]/20 px-4 py-1.5 text-sm font-semibold text-[#FF8800]">
                  <Sparkles className="h-4 w-4" />
                  Presto in arrivo
                </span>
              </FadeIn>
              
              <FadeIn delay={100}>
                <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                  Scambia le tue carte{' '}
                  <span className="bg-gradient-to-r from-[#FF7300] to-[#FF8800] bg-clip-text text-transparent">
                    in totale sicurezza
                  </span>
                </h1>
              </FadeIn>
              
              <FadeIn delay={200}>
                <p className="mb-8 text-lg text-gray-300">
                  Trova il partner di scambio perfetto per le tue carte collezionabili.
                  Proponi scambi, negozia e completa transazioni protette dalla nostra piattaforma.
                </p>
              </FadeIn>
              
              <FadeIn delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    type="button"
                    disabled
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#FF7300]/25 transition-all duration-300 opacity-60 cursor-not-allowed"
                  >
                    <Mail className="h-5 w-5" />
                    Avvisami quando sarà attivo
                  </button>
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FF8800]">100%</div>
                    <div className="text-xs text-gray-400">scambi protetti</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FF8800]">0</div>
                    <div className="text-xs text-gray-400">commissioni sugli scambi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FF8800]">24h</div>
                    <div className="text-xs text-gray-400">per confermare</div>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right: Floating cards mockup */}
            <div className="relative hidden lg:block">
              <div className="relative h-[500px]">
                <FloatingCard delay={400} className="absolute left-0 top-0 w-80 p-6 bg-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7300] to-[#FF8800]">
                      <ArrowLeftRight className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1D3160]">Scambio Diretto</div>
                      <div className="text-xs text-gray-500">Carta per carta</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600" />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#FF7300] to-[#FF8800]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1D3160]">Proposta attiva</span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">In attesa</span>
                  </div>
                </FloatingCard>

                <FloatingCard delay={600} className="absolute right-0 top-24 w-72 p-5 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1D3160] to-[#243663]">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1D3160]">Trova partner</div>
                      <div className="text-xs text-gray-500">Community attiva</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
                      <span className="text-xs text-gray-600">Cerca carte desiderate</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#FF7300] to-[#FF8800]" />
                      <span className="text-xs text-gray-600">Proponi le tue carte</span>
                    </div>
                  </div>
                </FloatingCard>

                <FloatingCard delay={800} className="absolute left-8 bottom-0 w-64 p-5 bg-white">
                  <div className="mb-3 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-semibold text-[#1D3160]">Protezione scambio</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Stato</span>
                      <span className="font-semibold text-green-600">Protetto</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 to-green-400" />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Entrambi gli oggetti bloccati fino alla conferma
                    </p>
                  </div>
                </FloatingCard>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-white/60">Scopri di più</span>
            <div className="h-10 w-6 rounded-full border-2 border-white/30 p-1">
              <div className="h-2 w-full animate-bounce rounded-full bg-white/60" />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-[#f5f5f5] py-20 lg:py-28">
        <div className="container-content">
          <FadeIn className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-[#FF7300]/10 px-4 py-1.5 text-sm font-semibold text-[#FF7300]">
              Come funziona
            </span>
            <h2 className="mb-4 text-3xl font-bold text-[#1D3160] sm:text-4xl">
              Scambiare è semplicissimo
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Un flusso guidato e sicuro per trovare il partner perfetto e completare lo scambio.
            </p>
          </FadeIn>

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <StepCard number={1} icon={Package} title="Seleziona le tue carte" description="Scegli dalla tua collezione le carte che vuoi scambiare." delay={0} />
              <StepCard number={2} icon={ArrowLeftRight} title="Cerca o ricevi proposte" description="Trova carte che ti interessano o attendi proposte da altri utenti." delay={150} />
              <StepCard number={3} icon={RefreshCw} title="Negozia e accordati" description="Discuti i dettagli e trova l&apos;accordo perfetto con il tuo partner." delay={300} />
              <StepCard number={4} icon={CheckCircle2} title="Completa lo scambio" description="Conferma e completa la transazione protetta in sicurezza." delay={450} />
            </div>

            <FadeIn delay={300} className="relative">
              <div className="sticky top-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D3160] to-[#243663] p-8 text-white shadow-2xl">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF7300]/20 blur-3xl" />
                  <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FF8800]/20 blur-3xl" />
                  
                  <div className="relative">
                    <h3 className="mb-6 text-2xl font-bold">Uno scambio sicuro</h3>
                    
                    <div className="space-y-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF7300]">
                            <Lock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold">Protezione garantita</h4>
                            <p className="text-xs text-gray-300">Oggetti bloccati durante lo scambio</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Entrambi gli oggetti vengono bloccati fino alla conferma di ricezione.</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8800]">
                            <Globe className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold">Community attiva</h4>
                            <p className="text-xs text-gray-300">Trova sempre un partner</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Migliaia di collezionisti pronti a scambiare ogni giorno.</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold">Zero commissioni</h4>
                            <p className="text-xs text-gray-300">Scambi diretti senza costi</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">La piattaforma garantisce la sicurezza senza applicare commissioni.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-20 lg:py-28">
        <div className="container-content">
          <FadeIn className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-[#FF7300]/10 px-4 py-1.5 text-sm font-semibold text-[#FF7300]">Perché scegliere Ebartex</span>
            <h2 className="mb-4 text-3xl font-bold text-[#1D3160] sm:text-4xl">Tutto ciò che serve per scambiare</h2>
            <p className="mx-auto max-w-2xl text-gray-600">Una piattaforma completa pensata per i collezionisti.</p>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Shield} title="Scambi Sicuri" description="Protezione su ogni transazione con oggetti bloccati." delay={0} />
            <FeatureCard icon={Clock} title="Proposte Veloci" description="Crea e rispondi a proposte in pochi secondi." delay={100} />
            <FeatureCard icon={Users} title="Community Attiva" description="Trova sempre qualcuno con cui scambiare." delay={200} />
            <FeatureCard icon={Globe} title="Nazionale e Internazionale" description="Scambia con collezionisti da tutta Europa." delay={300} />
            <FeatureCard icon={RefreshCw} title="Negoziazione Libera" description="Discuti e trova l&apos;accordo perfetto." delay={400} />
            <FeatureCard icon={Lock} title="Zero Rischio" description="Sistema di protezione che garantisce entrambe le parti." delay={500} />
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="bg-[#f5f5f5] py-20 lg:py-28">
        <div className="container-content">
          <FadeIn className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-[#FF7300]/10 px-4 py-1.5 text-sm font-semibold text-[#FF7300]">Giochi supportati</span>
            <h2 className="mb-4 text-3xl font-bold text-[#1D3160] sm:text-4xl">Tutti i tuoi giochi preferiti</h2>
            <p className="mx-auto max-w-2xl text-gray-600">Un unico marketplace per tutte le carte collezionabili.</p>
          </FadeIn>

          <div className="flex flex-wrap justify-center gap-4">
            {games.map((game, index) => (
              <FadeIn key={game.name} delay={index * 100}>
                <HoverCard className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: game.color }} />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#1D3160]">{game.name}</span>
                    <span className={cn('text-xs font-medium', game.available ? 'text-green-600' : 'text-[#FF7300]')}>
                      {game.available ? 'Già disponibile' : 'Presto in arrivo'}
                    </span>
                  </div>
                </HoverCard>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={650} className="mt-8 text-center">
            <p className="text-sm font-semibold text-[#1D3160]">E tante future novità.</p>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1D3160] via-[#243663] to-[#1D3160] py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-96 w-96 animate-[spin_30s_linear_infinite] rounded-full bg-[#FF7300]/10 blur-3xl" />
          <div className="absolute -left-40 -bottom-40 h-96 w-96 animate-[spin_35s_linear_infinite_reverse] rounded-full bg-[#FF8800]/10 blur-3xl" />
        </div>

        <div className="container-content relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <FadeIn>
              <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Resta aggiornato</h2>
              <p className="mb-8 text-lg text-gray-300">Ti avviseremo non appena lo scambio sarà disponibile.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button type="button" disabled className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#FF7300]/25 transition-all duration-300 opacity-60 cursor-not-allowed">
                  <Mail className="h-5 w-5" />
                  Voglio scambiare
                </button>
                <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                  Torna alla home
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}

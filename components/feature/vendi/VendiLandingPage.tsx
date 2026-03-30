'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap, 
  Package, 
  Camera,
  CheckCircle2,
  Clock,
  Globe,
  Sparkles,
  Mail
} from 'lucide-react';
import { FakeSearchBar } from './FakeSearchBar';

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

export function VendiLandingPage() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-white">
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
                <span className="mb-6 inline-flex items-center rounded-full bg-[#FF7300]/20 px-6 py-2.5 text-base font-semibold text-[#FF8800]">
                  Pronto al lancio!
                </span>
              </FadeIn>
              
              <FadeIn delay={100}>
                <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                  Vendi le tue carte{' '}
                  <span className="bg-gradient-to-r from-[#FF7300] to-[#FF8800] bg-clip-text text-transparent">
                    in pochi click
                  </span>
                </h1>
              </FadeIn>
              
              <FadeIn delay={200}>
                <p className="mb-8 text-lg text-gray-300">
                  Pubblica le tue carte in vendita in modo rapido e professionale.
                  Imposti quantità, lingua, condizione e prezzo, poi ricevi ordini
                  da una community attiva di collezionisti.
                </p>
              </FadeIn>
              
              <FadeIn delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FF8800]">2 min</div>
                    <div className="text-xs text-gray-400">per pubblicare una vendita</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FF8800]">24/7</div>
                    <div className="text-xs text-gray-400">annunci sempre visibili</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FF8800]">100%</div>
                    <div className="text-xs text-gray-400">sicuro e protetto</div>
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
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1D3160]">Vendita Diretta</div>
                      <div className="text-xs text-gray-500">Prezzo fisso, immediato</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-gray-100" />
                    <div className="h-2 w-3/4 rounded-full bg-gray-100" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-[#FF7300]">€45.00</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Attiva</span>
                  </div>
                </FloatingCard>

                <FloatingCard delay={600} className="absolute right-0 top-24 w-72 p-5 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1D3160] to-[#243663]">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1D3160]">Dettagli inserzione</div>
                      <div className="text-xs text-gray-500">Scheda completa e chiara</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <span className="rounded-lg bg-gray-100 px-2 py-1">Quantità</span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1">Lingua</span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1">Condizione</span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1">Prezzo</span>
                  </div>
                </FloatingCard>

                {/* Fake Search Bar - Gamefication element */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <FakeSearchBar delay={700} />
                </div>

                <FloatingCard delay={800} className="absolute left-8 bottom-0 w-64 p-5 bg-white">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-semibold text-[#1D3160]">Performance</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Viste</span>
                      <span className="font-semibold text-[#1D3160]">+128%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800]" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Offerte</span>
                      <span className="font-semibold text-[#1D3160]">+45%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800]" />
                    </div>
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
              Vendere è facilissimo
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Un flusso semplice e guidato per pubblicare i tuoi prodotti in pochi minuti.
            </p>
          </FadeIn>

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <StepCard number={1} icon={Package} title="Seleziona la carta" description="Parti dal catalogo e scegli l'articolo che vuoi mettere in vendita." delay={0} />
              <StepCard number={2} icon={Camera} title="Compila i dettagli" description="Inserisci quantità, lingua, condizione, prezzo e una descrizione chiara." delay={150} />
              <StepCard number={3} icon={Zap} title="Pubblica l'annuncio" description="Conferma i dati e rendi subito visibile la tua inserzione ai compratori." delay={300} />
              <StepCard number={4} icon={CheckCircle2} title="Gestisci ordine e spedizione" description="Quando vendi, prepari il pacco e completi la spedizione in totale sicurezza." delay={450} />
            </div>

            <FadeIn delay={300} className="relative">
              <div className="sticky top-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D3160] to-[#243663] p-8 text-white shadow-2xl">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF7300]/20 blur-3xl" />
                  <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FF8800]/20 blur-3xl" />
                  
                  <div className="relative">
                    <h3 className="mb-6 text-2xl font-bold">Una vendita fatta bene</h3>
                    
                    <div className="space-y-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF7300]">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold">Quantità e prezzo</h4>
                            <p className="text-xs text-gray-300">Controllo totale sul tuo annuncio</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Scegli quanto vendere e imposta il prezzo in modo preciso.</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8800]">
                            <Globe className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold">Visibilità marketplace</h4>
                            <p className="text-xs text-gray-300">Raggiungi compratori reali</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Le tue carte sono esposte a una community attiva di collezionisti.</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold">Pubblicazione rapida</h4>
                            <p className="text-xs text-gray-300">Flusso semplice e veloce</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">In pochi passaggi la tua inserzione è online e pronta a vendere.</p>
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
            <h2 className="mb-4 text-3xl font-bold text-[#1D3160] sm:text-4xl">Tutto ciò che serve per vendere</h2>
            <p className="mx-auto max-w-2xl text-gray-600">Una piattaforma completa pensata per i collezionisti.</p>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Shield} title="Transazioni Sicure" description="Protezione venditore e compratore su ogni transazione." delay={0} />
            <FeatureCard icon={Clock} title="Creazione Veloce" description="Pubblica una vendita in meno di 2 minuti." delay={100} />
            <FeatureCard icon={TrendingUp} title="Massima Visibilità" description="Visibile a migliaia di collezionisti ogni giorno." delay={200} />
            <FeatureCard icon={Globe} title="Mercato Europeo" description="Raggiungi compratori da tutta Europa." delay={300} />
            <FeatureCard icon={Camera} title="Foto Obbligatorie" description="Trasparenza totale con foto reali." delay={400} />
            <FeatureCard icon={Zap} title="Pubblicazione Immediata" description="Dalla scheda prodotto alla vendita in pochi click." delay={500} />
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
              <p className="mb-8 text-lg text-gray-300">Ti avviseremo non appena la vendita sarà disponibile.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

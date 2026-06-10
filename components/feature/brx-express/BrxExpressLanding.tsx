'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useScroll, useSpring, motion } from 'framer-motion';
import {
  Zap,
  PackageOpen,
  Sparkles,
  ShieldCheck,
  Truck,
  ArrowRight,
  FileText
} from 'lucide-react';

// Math Helper: Convert Catmull-Rom spline to Bezier curves for SVG path
function catmullRom2Bezier(points: { x: number; y: number }[], tension = 0.75): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  
  // Duplicate endpoints to compute control points for the first/last segments
  const pts = [points[0], ...points, points[points.length - 1]];
  
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2]!;
    
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  
  return d;
}

// Generate fluid wavy path points between two nodes
const generateChaoticPath = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  points: { x: number; y: number }[]
) => {
  const steps = 14; // Higher steps for smoother wave curves
  const dy = end.y - start.y;
  const dx = end.x - start.x;
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const y = start.y + dy * t;
    const xBase = start.x + dx * t;
    
    // Smooth, low frequency, gentle sweep waves
    const frequency = 0.0035;
    const amplitude = 32;
    const jitter = Math.sin(y * frequency + i * 0.7) * amplitude + 
                   Math.cos(y * 0.002) * (amplitude * 0.3);
    
    points.push({ x: xBase + jitter, y });
  }
};

export default function BrxExpressLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroStartRef = useRef<HTMLSpanElement>(null);
  const cardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null)
  ];
  const termsTextRef = useRef<HTMLDivElement>(null);

  const [pathD, setPathD] = useState('');
  const [mounted, setMounted] = useState(false);

  // Scroll Progress binding to SVG Path drawing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });
  
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001
  });

  const updatePath = () => {
    const container = containerRef.current;
    const heroStart = heroStartRef.current;
    const cards = cardRefs.map(r => r.current);
    const termsText = termsTextRef.current;
    
    if (!container || !heroStart || cards.some(c => !c) || !termsText) {
      return;
    }
    
    const containerRect = container.getBoundingClientRect();
    
    const getRelativeCoords = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      };
    };
    
    const points: { x: number; y: number }[] = [];
    
    // Start at Hero
    const start = getRelativeCoords(heroStart);
    const startPt = { x: start.x + start.width / 2, y: start.y + start.height };
    points.push(startPt);
    
    const wrapOffset = 10; // Precise border stroke margin
    
    // ==========================================
    // CARD 1: Organic Blob (Left Column)
    // ==========================================
    const c1 = getRelativeCoords(cards[0]!);
    
    // 360-Degree CCW Closed Loop: Enter Top-Right -> Top-Left -> Left -> Bottom -> Right -> Top-Right
    const pts1 = [
      { x: c1.x + c1.width * 0.8, y: c1.y - wrapOffset }, // Enter Top-Right
      { x: c1.x + c1.width * 0.5, y: c1.y - wrapOffset }, // Top-Middle
      { x: c1.x + c1.width * 0.2, y: c1.y - wrapOffset }, // Top-Left
      { x: c1.x - wrapOffset, y: c1.y + c1.height * 0.25 }, // Left-Top
      { x: c1.x - wrapOffset, y: c1.y + c1.height * 0.5 },  // Left-Middle
      { x: c1.x - wrapOffset, y: c1.y + c1.height * 0.75 }, // Left-Bottom
      { x: c1.x + c1.width * 0.2, y: c1.y + c1.height + wrapOffset }, // Bottom-Left
      { x: c1.x + c1.width * 0.5, y: c1.y + c1.height + wrapOffset }, // Bottom-Middle
      { x: c1.x + c1.width * 0.8, y: c1.y + c1.height + wrapOffset }, // Bottom-Right
      { x: c1.x + c1.width + wrapOffset, y: c1.y + c1.height * 0.75 }, // Right-Bottom
      { x: c1.x + c1.width + wrapOffset, y: c1.y + c1.height * 0.5 },  // Right-Middle
      { x: c1.x + c1.width + wrapOffset, y: c1.y + c1.height * 0.25 }, // Right-Top
      { x: c1.x + c1.width * 0.8, y: c1.y - wrapOffset }  // Return/Exit Top-Right
    ];
    
    generateChaoticPath(startPt, pts1[0]!, points);
    points.push(...pts1);
    const c1Exit = pts1[pts1.length - 1]!;
    
    // ==========================================
    // CARD 2: Rectangle (Right Column)
    // ==========================================
    const c2 = getRelativeCoords(cards[1]!);
    
    // 360-Degree CW Closed Loop: Enter Top-Left -> Top-Right -> Right -> Bottom -> Left -> Top-Left
    const pts2 = [
      { x: c2.x + c2.width * 0.2, y: c2.y - wrapOffset }, // Enter Top-Left
      { x: c2.x + c2.width * 0.5, y: c2.y - wrapOffset }, // Top-Middle
      { x: c2.x + c2.width * 0.8, y: c2.y - wrapOffset }, // Top-Right
      { x: c2.x + c2.width + wrapOffset, y: c2.y + c2.height * 0.25 }, // Right-Top
      { x: c2.x + c2.width + wrapOffset, y: c2.y + c2.height * 0.5 },  // Right-Middle
      { x: c2.x + c2.width + wrapOffset, y: c2.y + c2.height * 0.75 }, // Right-Bottom
      { x: c2.x + c2.width * 0.8, y: c2.y + c2.height + wrapOffset }, // Bottom-Right
      { x: c2.x + c2.width * 0.5, y: c2.y + c2.height + wrapOffset }, // Bottom-Middle
      { x: c2.x + c2.width * 0.2, y: c2.y + c2.height + wrapOffset }, // Bottom-Left
      { x: c2.x - wrapOffset, y: c2.y + c2.height * 0.75 }, // Left-Bottom
      { x: c2.x - wrapOffset, y: c2.y + c2.height * 0.5 },  // Left-Middle
      { x: c2.x - wrapOffset, y: c2.y + c2.height * 0.25 }, // Left-Top
      { x: c2.x + c2.width * 0.2, y: c2.y - wrapOffset }  // Return/Exit Top-Left
    ];
    
    generateChaoticPath(c1Exit, pts2[0]!, points);
    points.push(...pts2);
    const c2Exit = pts2[pts2.length - 1]!;
    
    // ==========================================
    // CARD 3: Oval / Pill (Left Column)
    // ==========================================
    const c3 = getRelativeCoords(cards[2]!);
    const cx3 = c3.x + c3.width / 2;
    const cy3 = c3.y + c3.height / 2;
    const rx3 = c3.width / 2 + wrapOffset;
    const ry3 = c3.height / 2 + wrapOffset;
    
    // 360-Degree CCW Elliptical Wrap starting and ending at Top-Right
    const pts3: { x: number; y: number }[] = [];
    for (let angle = -Math.PI * 0.25; angle >= -Math.PI * 2.25; angle -= Math.PI / 8) {
      pts3.push({ x: cx3 + rx3 * Math.cos(angle), y: cy3 + ry3 * Math.sin(angle) });
    }
    
    generateChaoticPath(c2Exit, pts3[0]!, points);
    points.push(...pts3);
    const c3Exit = pts3[pts3.length - 1]!;
    
    // ==========================================
    // CARD 4: Diamond (Right Column)
    // ==========================================
    const c4 = getRelativeCoords(cards[3]!);
    const cx4 = c4.x + c4.width / 2;
    const cy4 = c4.y + c4.height / 2;
    
    // 360-Degree CW Diamond Wrap: Enter Top-Left corner, loop CW, return/exit Top-Left
    const pts4 = [
      { x: c4.x + c4.width * 0.25, y: c4.y + c4.height * 0.25 - wrapOffset }, // Enter Top-Left corner
      { x: cx4, y: c4.y - wrapOffset }, // Top
      { x: c4.x + c4.width * 0.75, y: c4.y + c4.height * 0.25 - wrapOffset }, // Top-Right
      { x: c4.x + c4.width + wrapOffset, y: cy4 }, // Right
      { x: cx4, y: c4.y + c4.height + wrapOffset }, // Bottom
      { x: c4.x - wrapOffset, y: cy4 }, // Left
      { x: c4.x + c4.width * 0.25, y: c4.y + c4.height * 0.25 - wrapOffset }  // Return/Exit Top-Left
    ];
    
    generateChaoticPath(c3Exit, pts4[0]!, points);
    points.push(...pts4);
    const c4Exit = pts4[pts4.length - 1]!;
    
    // ==========================================
    // TERMS: Inner Rectangle Wrap (Center Block)
    // ==========================================
    const terms = getRelativeCoords(termsText);
    const innerPadding = 14; // Wrap precisely inside the text border
    
    // 360-Degree CCW Inner Wrap: Enter Top-Left, frame all sides, return Top-Left
    const ptsTerms = [
      { x: terms.x + innerPadding, y: terms.y + innerPadding }, // Enter Top-Left
      { x: terms.x + innerPadding, y: terms.y + terms.height * 0.5 },
      { x: terms.x + innerPadding, y: terms.y + terms.height - innerPadding },
      { x: terms.x + terms.width * 0.5, y: terms.y + terms.height - innerPadding },
      { x: terms.x + terms.width - innerPadding, y: terms.y + terms.height - innerPadding },
      { x: terms.x + terms.width - innerPadding, y: terms.y + terms.height * 0.5 },
      { x: terms.x + terms.width - innerPadding, y: terms.y + innerPadding },
      { x: terms.x + terms.width * 0.5, y: terms.y + innerPadding },
      { x: terms.x + innerPadding, y: terms.y + innerPadding }  // Completed Loop
    ];
    
    generateChaoticPath(c4Exit, ptsTerms[0]!, points);
    points.push(...ptsTerms);
    
    // Build spline
    const pathD = catmullRom2Bezier(points);
    setPathD(pathD);
  };

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      updatePath();
    }, 150);
    
    const observer = new ResizeObserver(() => {
      updatePath();
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updatePath);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updatePath);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#0F172A] text-slate-100 overflow-hidden font-sans pb-24"
    >
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* SVG Canvas for Scroll Line (Rendered at z-10) */}
      {mounted && pathD && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <defs>
            {/* Seamless, infinitely translating gradient pattern for flowing river effect */}
            <linearGradient
              id="line-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="200"
              gradientUnits="userSpaceOnUse"
              spreadMethod="repeat"
            >
              <stop offset="0%" stopColor="#FF3B00" />
              <stop offset="25%" stopColor="#FF7300" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="75%" stopColor="#FF7300" />
              <stop offset="100%" stopColor="#FF3B00" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0,0"
                to="0,200"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Layer 1: Ambient thick glow trail */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={32}
            opacity={0.05}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

          {/* Layer 2: Medium glowing bloom */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={14}
            opacity={0.18}
            filter="url(#glow)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

          {/* Layer 3: Core thick sharp line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />
        </svg>
      )}

      {/* Hero Section (Clean and Minimal) */}
      <section className="relative z-20 max-w-4xl mx-auto px-6 pt-28 pb-14 text-center">
        <div className="flex justify-center mb-5">
          <span
            ref={heroStartRef}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 px-3 py-0.5 text-[10px] font-bold tracking-wider text-orange-400 uppercase"
          >
            <Zap className="h-3 w-3 text-orange-400" />
            Spedizione 24h
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
          BRX Express
        </h1>
        
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Il network logistico europeo di Ebartex. Spedisci le tue carte una sola volta:
          le digitalizziamo, le gradiamo e le consegniamo ai compratori in 24 ore.
        </p>

        <div className="mt-6 flex justify-center">
          <button className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-500/20">
            <span className="relative z-10 flex items-center gap-1.5">
              Inizia a spedire
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        </div>
      </section>

      {/* Come Funziona Section */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
            Come Funziona
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            Il flusso decentralizzato che elimina lo stress delle spedizioni singole.
          </p>
        </div>

        {/* Cards are explicitly set to z-20 relative so the line at z-10 passes UNDER them */}
        <div className="space-y-24 md:space-y-36">
          {/* Card 1: Organic Blob (Left) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-start">
              <div
                ref={cardRefs[0]}
                className="relative z-20 w-full max-w-[440px] p-8 md:p-10 text-slate-100 flex flex-col items-start justify-center min-h-[280px] bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60"
                style={{
                  borderRadius: '52% 48% 68% 32% / 45% 42% 58% 55%'
                }}
              >
                <div className="mb-4 rounded-2xl bg-orange-500/10 p-3 text-orange-400 border border-orange-500/20">
                  <PackageOpen className="h-6 w-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-500">Fase 1</span>
                <h3 className="mt-2 text-xl font-bold text-white tracking-tight">Inviaci le tue carte</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Raggruppa le tue carte e spediscile all'hub BRX Express più vicino. Al resto pensiamo noi: grading professionale, foto in HD e stoccaggio protetto in camera blindata.
                </p>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>

          {/* Card 2: Rounded Rectangle (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="hidden md:block" />
            <div className="flex justify-end">
              <div
                ref={cardRefs[1]}
                className="relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-2xl text-slate-100 flex flex-col items-start justify-center min-h-[280px] bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60"
              >
                <div className="mb-4 rounded-2xl bg-amber-500/10 p-3 text-amber-400 border border-amber-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">Fase 2</span>
                <h3 className="mt-2 text-xl font-bold text-white tracking-tight">Vendiamo per te</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Le tue carte sono listate sul marketplace a soli 0,30€ a pezzo. Vengono visualizzate sotto un Account Ufficiale Sponsorizzato, garantendo massima visibilità e affidabilità.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Oval / Pill (Left) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-start">
              <div
                ref={cardRefs[2]}
                className="relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-[50px] text-slate-100 flex flex-col items-start justify-center min-h-[280px] bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60"
              >
                <div className="mb-4 rounded-2xl bg-orange-500/10 p-3 text-orange-400 border border-orange-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-500">Fase 3</span>
                <h3 className="mt-2 text-xl font-bold text-white tracking-tight">Zero doppie vendite</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Eliminiamo alla radice l'incubo del doppio ordinamento. Avendo le carte fisicamente stoccate nei nostri hub regionali, la sincronizzazione dell'inventario è istantanea.
                </p>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>

          {/* Card 4: Diamond (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="hidden md:block" />
            <div className="flex justify-end">
              <div className="w-full max-w-[440px] flex justify-center items-center relative z-20">
                <div
                  ref={cardRefs[3]}
                  className="relative z-20 w-[340px] aspect-square flex items-center justify-center p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60 [clip-path:polygon(50%_0%,_100%_50%,_50%_100%,_0%_50%)]"
                >
                  <div className="text-center max-w-[210px] flex flex-col items-center">
                    <div className="mb-2.5 rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
                      <Truck className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">Fase 4</span>
                    <h3 className="mt-1 text-base font-bold text-white tracking-tight">Fulfillment 24h</h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      All'acquisto, la spedizione parte immediatamente dall'hub locale in cui risiede la carta. Consegna all'acquirente in tutta Europa in sole 24 ore.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Termini e Condizioni Section (Explicitly set to z-[5] lower than SVG z-10 so the line passes ON TOP) */}
      <section className="relative z-[5] max-w-4xl mx-auto px-6 mt-32">
        <div className="relative rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur-md p-8 md:p-12 shadow-2xl">
          <div
            ref={termsTextRef}
            className="relative z-[5] p-6 md:p-8 rounded-2xl border border-slate-800/80 bg-slate-900/20"
          >
            <div className="flex items-center gap-2 mb-6 justify-center">
              <FileText className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Termini e Condizioni
              </h3>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Accettazione Valutazione:</strong> L'invio delle carte all'hub implica l'accettazione insindacabile del grading e della digitalizzazione operati dal team tecnico di BRX.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Tariffa Upload:</strong> Si applica un costo fisso di 0,30€ per ciascuna carta inserita a catalogo a titolo di costi di inbound, ispezione e digitalizzazione.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Commissioni:</strong> Al completamento di ogni transazione di vendita viene applicata una trattenuta del 10% sul prezzo dell'asset, fino ad un massimale di 100€ per singola carta.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Tempistiche Spedizione:</strong> La spedizione 24h è garantita nei giorni lavorativi ed è soggetta alla stabilità operativa dei corrieri espressi designati da BRX Express.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Riconsegna Stock:</strong> Il venditore può revocare il mandato di vendita e richiedere il rientro fisico delle proprie carte in qualsiasi momento, facendosi carico delle spese di spedizione.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share,
  PlusSquare,
  CheckCircle,
  Home,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface IOSInstallTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Share,
    label: 'Condividi',
    description: 'Tocca il bottone Condividi in basso su Safari',
    color: 'from-[#3D65C6] to-[#1D3160]',
  },
  {
    icon: PlusSquare,
    label: 'Aggiungi a Home',
    description: 'Scorri e tocca "Aggiungi a Home" dal menu',
    color: 'from-[#6732A8] to-[#291442]',
  },
  {
    icon: CheckCircle,
    label: 'Conferma',
    description: 'Tocca "Aggiungi" nella schermata di conferma',
    color: 'from-[#FF7300] to-[#CC5C00]',
  },
];

function SafariMockAnimation() {
  return (
    <div className="relative w-full mx-auto max-w-xs select-none pointer-events-none">
      {/* Area "schermo" safari */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0F172A]">
        {/* Fake contenuto pagina */}
        <div className="h-24 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF7300]" />
          <div className="w-24 h-2 rounded bg-white/10" />
        </div>

        {/* Barra Safari bottom */}
        <div className="relative h-12 bg-[#1C1C1E] border-t border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-6 text-white/60">
            <ArrowLeft className="w-5 h-5" />
            <ArrowRight className="w-5 h-5" />
            <BookOpen className="w-5 h-5" />
          </div>

          {/* Bottone condividi — target dell'animazione */}
          <div className="flex items-center gap-6 text-white/60">
            <div className="relative flex items-center justify-center w-6 h-6">
              <Share className="w-5 h-5" />

              {/* Tap indicator */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.3, 1, 1.3, 0],
                  opacity: [0, 1, 1, 1, 0],
                }}
                transition={{
                  duration: 1.2,
                  delay: 0.6,
                  times: [0, 0.25, 0.5, 0.75, 1],
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full border-2 border-white/80 bg-white/20"
              />
            </div>
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Share Sheet (menu) */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: ['100%', '0%', '0%', '0%', '-5%', '-5%', '-5%', '0%'] }}
          transition={{
            duration: 4.2,
            delay: 1.8,
            times: [0, 0.18, 0.35, 0.52, 0.7, 0.85, 0.95, 1],
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 left-0 right-0 bg-[#2C2C2E] rounded-t-xl border-t border-white/10 overflow-hidden"
        >
          <div className="px-4 pt-3 pb-2 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="px-4 pb-4 space-y-2">
            {/* Voce finta 1 */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-[#3D65C6]/30 flex items-center justify-center">
                <Share className="w-4 h-4 text-[#3D65C6]" />
              </div>
              <span className="text-sm text-white/60">Invia a…</span>
            </div>

            {/* Voce finta 2 — target */}
            <div className="relative flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-[#FF7300]/20 flex items-center justify-center">
                <PlusSquare className="w-4 h-4 text-[#FF7300]" />
              </div>
              <span className="text-sm text-white">Aggiungi alla schermata Home</span>

              {/* Tap indicator voce menu */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.2, 0.9, 1.2, 0],
                  opacity: [0, 1, 1, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: 2.4,
                  times: [0, 0.2, 0.4, 0.6, 1],
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-lg border-2 border-[#FF7300]/80 bg-[#FF7300]/10"
              />
            </div>

            {/* Voce finta 3 */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white/50" />
              </div>
              <span className="text-sm text-white/60">Aggiungi ai Preferiti</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function IOSInstallTutorial({ isOpen, onClose }: IOSInstallTutorialProps) {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
        >
          {/* Backdrop blur */}
          <motion.div
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(12px)' }}
            exit={{ backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modale */}
          <motion.div
            initial={{ y: '100%', scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 350,
              mass: 0.8,
            }}
            className="relative w-full max-w-lg mx-0 sm:mx-4 bg-gradient-to-b from-[#1e293b] to-[#0F172A] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 overflow-x-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0F172A]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-[#FF7300]" />
                <span className="font-bold text-white">Installa su iOS</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Chiudi tutorial"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <div className="px-6 pt-6 pb-8 space-y-5">
              {/* Animazione in bella vista */}
              <SafariMockAnimation />

              {/* Toggle passaggi */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSteps((s) => !s)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span className="text-sm font-medium text-white/80">
                  {showSteps ? 'Nascondi passaggi' : 'Mostra passaggi dettagliati'}
                </span>
                <motion.div
                  animate={{ rotate: showSteps ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </motion.div>
              </motion.button>

              {/* Passaggi scritti (collassabili) */}
              <AnimatePresence initial={false}>
                {showSteps && (
                  <motion.div
                    key="steps"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-5 pb-2">
                      {steps.map((step, index) => (
                        <motion.div
                          key={step.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.1 + index * 0.1,
                            type: 'spring',
                            stiffness: 200,
                          }}
                          className="flex items-start gap-4"
                        >
                          {/* Step Number + Icon */}
                          <div className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0`}
                            >
                              <step.icon className="w-6 h-6 text-white" />
                            </div>
                            {index < steps.length - 1 && (
                              <div className="w-0.5 h-8 bg-white/10 rounded-full" />
                            )}
                          </div>

                          {/* Text */}
                          <div className="pt-1">
                            <h4 className="font-semibold text-white text-base">
                              {index + 1}. {step.label}
                            </h4>
                            <p className="text-sm text-white/60 mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA sempre visibile */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-2 text-center"
              >
                <p className="text-sm text-white/50 mb-4">
                  Perfetto, ora avrai EbarteX sulla tua schermata principale!
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full py-3.5 bg-[#FF7300] hover:bg-[#e66800] text-white font-semibold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                >
                  Ho capito!
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

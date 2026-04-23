'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, CheckCircle, Home } from 'lucide-react';

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

export function IOSInstallTutorial({ isOpen, onClose }: IOSInstallTutorialProps) {
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
            className="relative w-full max-w-lg mx-0 sm:mx-4 bg-gradient-to-b from-[#1e293b] to-[#0F172A] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto overflow-x-hidden"
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

            {/* Steps */}
            <div className="px-6 py-6 space-y-5">
              {steps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.15, type: 'spring', stiffness: 200 }}
                  className="flex items-start gap-4"
                >
                  {/* Step Number + Icon */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0`}
                    >
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-0.5 h-8 bg-white/10 rounded-full" />
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

              {/* Final CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-4 text-center"
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

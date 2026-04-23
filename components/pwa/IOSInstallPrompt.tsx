'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Smartphone } from 'lucide-react';
import { useIsIOS } from '@/hooks/useIsIOS';
import { IOSInstallTutorial } from './IOSInstallTutorial';

export function IOSInstallPrompt() {
  const { isIOS, isLoading } = useIsIOS();
  const [showTutorial, setShowTutorial] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !isIOS) return null;

  return (
    <>
      <AnimatePresence>
        {!dismissed && (
          <motion.div key="ios-prompt-wrapper" className="contents">
            {/* Overlay scuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => setDismissed(true)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
                mass: 0.8,
              }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0F172A] rounded-t-2xl shadow-2xl border-t border-white/10"
            >
              <div className="relative p-6 pb-8">
                {/* Handle bar */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Chiudi */}
                <button
                  onClick={() => setDismissed(true)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                {/* Icona */}
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF7300] to-[#CC5C00] flex items-center justify-center shadow-lg">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Testo */}
                <h3 className="text-center text-lg font-bold text-white mb-2">
                  Installa EbarteX
                </h3>
                <p className="text-center text-sm text-white/70 mb-6 leading-relaxed px-4">
                  Installa la web-app per un&apos;esperienza più fluida e per avere le notifiche integrate.
                </p>

                {/* Bottone CTA */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowTutorial(true)}
                  className="w-full py-3.5 bg-[#FF7300] hover:bg-[#e66800] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Come installare
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modale */}
      <IOSInstallTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </>
  );
}

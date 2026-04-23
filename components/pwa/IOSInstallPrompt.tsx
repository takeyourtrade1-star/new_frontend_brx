'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { useIsIOS } from '@/hooks/useIsIOS';
import { IOSInstallTutorial } from './IOSInstallTutorial';

const VISIT_COUNT_KEY = 'ios-install-visit-count';
const SESSION_COUNTED_KEY = 'ios-install-counted';
const DISMISSED_KEY = 'ios-install-dismissed';

export function IOSInstallPrompt() {
  const { isIOS, isLoading } = useIsIOS();
  const [showTutorial, setShowTutorial] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(DISMISSED_KEY) === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;
    if (!isIOS) return;

    const alreadyCounted = sessionStorage.getItem(SESSION_COUNTED_KEY);
    if (alreadyCounted) return;

    const raw = localStorage.getItem(VISIT_COUNT_KEY) || '0';
    const parsed = parseInt(raw, 10);
    const count = (Number.isNaN(parsed) ? 0 : parsed) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
    sessionStorage.setItem(SESSION_COUNTED_KEY, 'true');

    // Mostra solo ogni 3 visite (3, 6, 9, ...)
    if (count % 3 === 0) {
      setDismissed(false);
    }
  }, [isLoading, isIOS]);

  if (isLoading || !isIOS || dismissed) return null;

  return (
    <>
      <AnimatePresence>
        {!dismissed && (
          <motion.div key="ios-prompt-wrapper" className="relative">
            {/* Overlay scuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => {
                sessionStorage.setItem(DISMISSED_KEY, 'true');
                setDismissed(true);
              }}
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
              onClick={() => {
                sessionStorage.setItem(DISMISSED_KEY, 'true');
                setDismissed(true);
              }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                {/* Logo EbarteX */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/logo-pwa.svg"
                    alt="EbarteX"
                    className="w-16 h-16 rounded-2xl shadow-lg"
                  />
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

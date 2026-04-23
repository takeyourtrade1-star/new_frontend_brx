'use client';

import { WifiOff, RefreshCw, Frown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-[#3D65C6] to-[#1D3160]">
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-6"
      >
        <div className="relative">
          <WifiOff className="w-20 h-20 text-white/80" strokeWidth={1.5} />
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Frown className="w-8 h-8 text-[#FF7300]" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-white mb-3"
      >
        Oops, sei offline!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-white/70 text-lg max-w-md mb-8"
      >
        Non preoccuparti, la tua collezione ti aspetta.
        <br />
        Riconnetti la rete e torna a catturare le migliori carte.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 bg-[#FF7300] text-white font-semibold rounded-xl shadow-lg hover:bg-[#e66800] transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        Riprova
      </motion.button>
    </div>
  );
}

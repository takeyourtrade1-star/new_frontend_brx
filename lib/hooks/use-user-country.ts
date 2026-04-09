'use client';

import { useState, useEffect } from 'react';

interface GeoInfo {
  country_code?: string;
  country_name?: string;
}

const STORAGE_KEY = 'ebartex_user_country';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 giorni

/** 
 * Hook per rilevare il paese dell'utente tramite:
 * 1. Cache locale (7 giorni)
 * 2. API geolocalizzazione gratuita (ipapi.co)
 * 3. Fallback su navigator.language
 * 
 * Restituisce il codice ISO 2-lettere (es. 'IT', 'DE')
 */
export function useUserCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    const detectCountry = async () => {
      // 1. Prova cache locale
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const { code, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setCountry(code);
            return;
          }
        }
      } catch {
        // localStorage non disponibile
      }

      // 2. Prova API geolocalizzazione
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeout);
        
        if (res.ok) {
          const data: GeoInfo = await res.json();
          if (data.country_code) {
            const code = data.country_code.toUpperCase();
            // Verifica che sia un paese supportato
            const supportedCountries = ['IT', 'DE', 'FR', 'ES', 'AT', 'CH', 'GB', 'US'];
            const finalCode = supportedCountries.includes(code) ? code : 'IT';
            
            setCountry(finalCode);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              code: finalCode,
              timestamp: Date.now()
            }));
            return;
          }
        }
      } catch {
        // API fallita, procedi con fallback
      }

      // 3. Fallback su navigator.language
      const langCode = navigator.language?.split('-')[1]?.toUpperCase();
      const supportedCountries = ['IT', 'DE', 'FR', 'ES', 'AT', 'CH', 'GB', 'US'];
      const fallbackCode = langCode && supportedCountries.includes(langCode) ? langCode : 'IT';
      
      setCountry(fallbackCode);
    };

    detectCountry();
  }, []);

  return country;
}

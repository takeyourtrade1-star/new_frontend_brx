const STORAGE_KEY = 'ebartex:auction-wizard-language-pref';
const TTL_MS = 3_600_000;

type AuctionLanguagePreference = {
  code: string;
  expiresAt: number;
};

/** Legge la lingua preferita dal wizard asta (sessionStorage, TTL 1h). */
export function readAuctionLanguagePreference(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuctionLanguagePreference;
    if (!parsed?.code || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() >= parsed.expiresAt) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.code.trim() || null;
  } catch {
    return null;
  }
}

/** Salva la lingua preferita per 1 ora (sessionStorage). */
export function writeAuctionLanguagePreference(code: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = code.trim();
  if (!trimmed) return;
  try {
    const payload: AuctionLanguagePreference = {
      code: trimmed,
      expiresAt: Date.now() + TTL_MS,
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* sessionStorage non disponibile */
  }
}

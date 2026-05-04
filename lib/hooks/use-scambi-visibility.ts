import { useAuthStore } from '@/lib/stores/auth-store';
import { FEATURES } from '@/lib/config/features';

/**
 * Determina se la sezione Scambi è visibile per l'utente corrente.
 *
 * Regole rigide:
 * 1. Se il feature flag globale FEATURES.scambiEnabled è true → visibile per tutti.
 * 2. Altrimenti, visibile SOLO se il backend ha impostato show_scambi = true
 *    sul profilo utente autenticato.
 * 3. Utenti non autenticati NON vedono mai gli scambi a meno che non siano
 *    abilitati globalmente.
 *
 * Il backend è l'unica fonte di verità per singolo utente.
 */
export function useScambiVisibility(): boolean {
  const user = useAuthStore((s) => s.user);

  if (FEATURES.scambiEnabled) {
    return true;
  }

  return user?.show_scambi === true;
}

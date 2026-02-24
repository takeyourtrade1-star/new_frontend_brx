import { redirect } from 'next/navigation';

/**
 * Redirect alla pagina principale di registrazione.
 * Il flusso multi-step (indirizzo → account) è stato sostituito dai tre tipi: Demo, Privato, Business.
 */
export default function RegistratiIndirizzoPage() {
  redirect('/registrati');
}

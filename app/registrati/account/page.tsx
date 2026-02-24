import { redirect } from 'next/navigation';

/**
 * Redirect alla pagina principale di registrazione.
 * Il flusso multi-step è stato sostituito dai tre tipi: Demo, Privato, Business.
 */
export default function RegistratiAccountPage() {
  redirect('/registrati');
}

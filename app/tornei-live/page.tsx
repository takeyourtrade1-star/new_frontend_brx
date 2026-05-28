import { redirect } from 'next/navigation';
import { TOURNAMENTS_PORTAL_URL } from '@/lib/config/tournaments';

/** /tornei-live → piattaforma tornei esterna (fallback se il redirect in next.config non applica). */
export default function TorneiLivePage() {
  redirect(TOURNAMENTS_PORTAL_URL);
}

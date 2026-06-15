import { redirect } from 'next/navigation';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

/** /tornei-live → piattaforma tornei esterna (fallback se il redirect in next.config non applica). */
export default function TorneiLivePage() {
  redirect(getTournamentsPortalUrl('/'));
}

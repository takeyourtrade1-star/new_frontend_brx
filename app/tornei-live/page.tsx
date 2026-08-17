import { redirect } from 'next/navigation';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

/** /tornei-live -> bridge SSO first-party della piattaforma Tornei. */
export default function TorneiLivePage() {
  redirect(getTournamentsPortalUrl('/'));
}

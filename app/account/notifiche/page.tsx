import type { Metadata } from 'next';
import { NotificationHistoryContent } from '@/components/feature/notifiche/NotificationHistoryContent';

export const metadata: Metadata = {
  title: 'Notifiche | Account | Ebartex',
  description: 'Aggiornamenti su scambi, aste e novità Ebartex.',
};

export default function NotificationsPage() {
  return <NotificationHistoryContent />;
}

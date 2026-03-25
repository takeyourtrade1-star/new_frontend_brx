import { MessaggiContent } from '@/components/feature/account/MessaggiContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'I miei messaggi | Account | Ebartex',
  description: 'Messaggi e conversazioni del tuo account',
};

export default function MessaggiPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <MessaggiContent />
    </>
  );
}

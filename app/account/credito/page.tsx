import { CreditoContent } from '@/components/feature/account/CreditoContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Credito | Account | Ebartex',
  description: 'Gestisci il tuo credito e i metodi di ricarica',
};

export default function CreditoPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <CreditoContent />
    </>
  );
}

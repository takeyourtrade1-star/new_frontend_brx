import { IndirizziContent } from '@/components/feature/account/IndirizziContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Indirizzi | Account | Ebartex',
  description: 'Gestisci i tuoi indirizzi di spedizione e fatturazione',
};

export default function IndirizziPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <div className="pointer-events-none opacity-60">
        <IndirizziContent />
      </div>
    </>
  );
}

import { ProfiloContent } from '@/components/feature/account/ProfiloContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Profilo | Account | Ebartex',
  description: 'Il tuo profilo Ebartex',
};

export default function ProfiloPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <div className="pointer-events-none opacity-60">
        <ProfiloContent />
      </div>
    </>
  );
}

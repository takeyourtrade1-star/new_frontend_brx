import { ProfiloContent } from '@/components/feature/account/ProfiloContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Profilo | Account | Ebartex',
  description: 'Il tuo profilo Ebartex',
};

export default function ProfiloPage() {
  return (
    <div className="relative">
      <ProfiloContent />
      <PrestoInArrivoBanner />
    </div>
  );
}

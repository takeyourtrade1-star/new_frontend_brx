import { AttivaContoVenditore } from '@/components/feature/account/AttivaContoVenditore';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export default function AccountPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <div className="pointer-events-none opacity-60 text-gray-900">
        <AttivaContoVenditore />
      </div>
    </>
  );
}

import { CouponContent } from '@/components/feature/account/CouponContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Coupon | Ebartex',
  description: 'Gestisci e incassa i tuoi coupon',
};

export default function CouponPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <div className="pointer-events-none opacity-60">
        <CouponContent />
      </div>
    </>
  );
}

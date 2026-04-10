import { Suspense } from 'react';
import { CouponContent } from '@/components/feature/account/CouponContent';

export const metadata = {
  title: 'Coupon | Ebartex',
  description: 'Gestisci e incassa i tuoi coupon',
};

export default function CouponPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <div className="pointer-events-none opacity-60">
        <CouponContent />
      </div>
    </Suspense>
  );
}

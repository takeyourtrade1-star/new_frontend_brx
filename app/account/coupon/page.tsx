import { Suspense } from 'react';
import { CouponContent } from '@/components/feature/account/CouponContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'Coupon | Ebartex',
  description: 'Gestisci e incassa i tuoi coupon',
};

export default function CouponPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <div className="pointer-events-none opacity-60">
        <CouponContent />
      </div>
    </Suspense>
  );
}

import { Suspense } from 'react';
import { MessaggiContent } from '@/components/feature/account/MessaggiContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'I miei messaggi | Account | Ebartex',
  description: 'Messaggi e conversazioni del tuo account',
};

export default function MessaggiPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <div className="pointer-events-none opacity-60">
        <MessaggiContent />
      </div>
    </Suspense>
  );
}

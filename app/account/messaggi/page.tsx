import { Suspense } from 'react';
import { MessaggiContent } from '@/components/feature/account/MessaggiContent';

export const metadata = {
  title: 'I miei messaggi | Account | Ebartex',
  description: 'Messaggi e conversazioni del tuo account',
};

export default function MessaggiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <div className="pointer-events-none opacity-60">
        <MessaggiContent />
      </div>
    </Suspense>
  );
}

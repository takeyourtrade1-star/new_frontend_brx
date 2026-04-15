import Link from 'next/link';
import { RegistratiDemoForm } from '@/components/feature/registrati/RegistratiDemoForm';
import { AuthShell } from '@/components/layout/AuthShell';
import { AUTH_GLASS_CLASS, AUTH_GLASS_LIGHT } from '@/components/layout/auth-glass';

export const metadata = {
  title: 'Registrazione demo | Registrati | Ebartex',
  description: 'Registrazione veloce in 30 secondi',
};

export default function RegistratiDemoPage() {
  return (
    <AuthShell>
      <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wide text-white">
        Registrazione demo
      </h1>
      <div className={AUTH_GLASS_CLASS} style={AUTH_GLASS_LIGHT}>
        <div className="p-8 sm:p-12">
          <RegistratiDemoForm />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-center">
        <Link href="/registrati" className="text-sm text-white hover:underline">
          Torna alla scelta
        </Link>
        <Link href="/login?accesso=1" className="text-sm text-white hover:underline">
          Hai già un account? Login
        </Link>
      </div>
    </AuthShell>
  );
}

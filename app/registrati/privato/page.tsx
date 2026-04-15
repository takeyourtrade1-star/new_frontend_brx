import Link from 'next/link';
import { RegistratiPrivatoForm } from '@/components/feature/registrati/RegistratiPrivatoForm';
import { AuthShell } from '@/components/layout/AuthShell';
import { AUTH_GLASS_CLASS, AUTH_GLASS_DARK } from '@/components/layout/auth-glass';

export const metadata = {
  title: 'Account privato | Registrati | Ebartex',
  description: 'Crea il tuo account personale Ebartex',
};

export default function RegistratiPrivatoPage() {
  return (
    <AuthShell>
      <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wide text-white">
        Account privato
      </h1>
      <div className={AUTH_GLASS_CLASS} style={AUTH_GLASS_DARK}>
        <div className="p-12">
          <RegistratiPrivatoForm />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-center">
        <Link href="/registrati" className="text-sm text-white hover:underline">
          Torna alla scelta
        </Link>
        <Link href="/login" className="text-sm text-white hover:underline">
          Hai già un account? Login
        </Link>
      </div>
    </AuthShell>
  );
}

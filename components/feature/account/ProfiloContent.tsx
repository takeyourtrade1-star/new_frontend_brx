'use client';

import Link from 'next/link';
import { Home, Pencil } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

function ProfiloRow({
  label,
  value,
  editable = true,
}: {
  label: string;
  value: string;
  editable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-normal uppercase text-white">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-normal text-white">{value}</span>
        {editable && (
          <button
            type="button"
            className="rounded p-1 text-[#FF7300] hover:bg-white/10"
            aria-label={`Modifica ${label}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Separator() {
  return <hr className="border-t border-white/20" />;
}

export function ProfiloContent() {
  const user = useAuthStore((s) => s.user);
  const displayName =
    (user?.name || user?.email || 'Utente').toUpperCase();
  const email = user?.email ?? '—';

  return (
    <div className="text-white">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/90" aria-label="Breadcrumb">
        <Link href="/account" className="hover:text-white">
          <Home className="h-4 w-4" />
        </Link>
        <span className="text-white/60">/</span>
        <span>ACCOUNT</span>
        <span className="text-white/60">/</span>
        <span className="text-white">PROFILO</span>
      </nav>

      {/* Intestazione: nome utente + link profilo pubblico */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
          {displayName}
        </h1>
        <Link
          href="#"
          className="text-sm font-normal text-white underline hover:opacity-90"
        >
          Il tuo profilo pubblico
        </Link>
      </div>

      {/* Dati profilo */}
      <div className="space-y-0">
        <ProfiloRow label="Nome" value={user?.name || '—'} />
        <Separator />
        <ProfiloRow label="Tipo di account" value="Privato" />
        <Separator />
        <ProfiloRow label="Data di registrazione" value="28.01.2026" />
        <Separator />
        <ProfiloRow label="Data di nascita" value="19.03.2000" />
        <Separator />
        <ProfiloRow label="Email" value={email} />
        <Separator />
        <ProfiloRow label="Password" value="••••••••••••" />
        <Separator />
        <ProfiloRow label="Numero di telefono" value="—" />
        <Separator />
        <ProfiloRow label="Numero DCI" value="—" />
        <Separator />
        <ProfiloRow label="Konami ID" value="—" />
        <Separator />
        <ProfiloRow label="Play! Pokémon ID" value="—" />
      </div>

      {/* Chiudi account */}
      <div className="mt-10 pt-6">
        <Link
          href="#"
          className="text-sm font-medium uppercase text-red-500 hover:text-red-400 hover:underline"
        >
          Chiudi l&apos;account
        </Link>
      </div>
    </div>
  );
}

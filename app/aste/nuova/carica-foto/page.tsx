import Link from 'next/link';
import { AuctionMobilePairingUpload } from '@/components/feature/aste/create/AuctionMobilePairingUpload';

export const metadata = {
  title: 'Carica foto da telefono | Ebartex',
  description: 'Invia foto all’asta che stai creando dal computer.',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AsteNuovaCaricaFotoPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}) {
  const sp = await searchParams;
  const raw = typeof sp.sid === 'string' ? sp.sid.trim() : '';
  const sid = UUID_RE.test(raw) ? raw : '';

  if (!sid) {
    return (
      <main className="min-h-dvh bg-white px-4 py-10">
        <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
          <p className="font-semibold">Sessione non valida</p>
          <p className="mt-2 text-amber-900/90">
            Apri questa pagina dal QR mostrato nel passo Foto della creazione asta su PC.
          </p>
          <Link href="/aste/nuova" className="mt-4 inline-block font-semibold text-[#1D3160] underline">
            Torna a nuova asta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white">
      <AuctionMobilePairingUpload sessionId={sid} />
    </main>
  );
}

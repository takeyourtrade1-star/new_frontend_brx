import { AuctionMobilePairingUpload } from '@/components/feature/aste/create/AuctionMobilePairingUpload';

export const metadata = {
  title: 'Carica foto',
  description: 'Invio foto per la tua asta da telefono.',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseGuestToken(raw: string | undefined): string {
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (t.length < 16 || t.length > 256) return '';
  if (!/^[A-Za-z0-9_-]+$/.test(t)) return '';
  return t;
}

export default async function AstaFotoGuestPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string; t?: string }>;
}) {
  const sp = await searchParams;
  const rawSid = typeof sp.sid === 'string' ? sp.sid.trim() : '';
  const sid = UUID_RE.test(rawSid) ? rawSid : '';
  const uploadToken = parseGuestToken(sp.t);

  if (!sid || !uploadToken) {
    return (
      <main className="min-h-dvh bg-white px-4 py-10">
        <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
          <p className="font-semibold">Link non valido o scaduto</p>
          <p className="mt-2 text-amber-900/90">
            Apri la pagina dal QR mostrato nel passo Foto della creazione asta sul computer.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <AuctionMobilePairingUpload sessionId={sid} uploadToken={uploadToken} />
    </main>
  );
}

import Link from 'next/link';

export const metadata = {
  title: 'Carica foto da telefono | Ebartex',
  description: 'Invia foto all’asta che stai creando dal computer.',
};

export default function AsteNuovaCaricaFotoPage() {
  return (
    <main className="min-h-dvh bg-white px-4 py-10">
      <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
        <p className="font-semibold">Link non più valido</p>
        <p className="mt-2 text-amber-900/90">
          Scansiona di nuovo il codice QR mostrato sul computer nel passo Foto. Il link sul telefono
          deve includere il codice di sicurezza generato in quel momento.
        </p>
        <Link href="/aste/nuova" className="mt-4 inline-block font-semibold text-[#1D3160] underline">
          Torna a nuova asta
        </Link>
      </div>
    </main>
  );
}

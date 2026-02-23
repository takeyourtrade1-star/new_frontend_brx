import Link from 'next/link';
import Image from 'next/image';
import { RegistratiForm } from '@/components/feature/registrati/registrati-form';
import { getCdnImageUrl } from '@/lib/config';

export const metadata = {
  title: 'Registrati | Ebartex',
  description: 'Crea il tuo account Ebartex',
};

export default function RegistratiPage() {
  const carouselBg = getCdnImageUrl('carousel/slide1.jpg');
  const logoUrl = getCdnImageUrl('logo.png');
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      {/* Sfondo visibile (non sfocato) fuori dal riquadro */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${carouselBg}")` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[#2d2d2d]/40"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col pt-8">
        {/* Logo Ebartex */}
        <div className="flex justify-center px-4">
          <Link
            href="/"
            className="relative block h-[80px] w-[200px] sm:h-[100px] sm:w-[260px]"
            aria-label="Ebartex Home"
          >
            <Image
              src={logoUrl}
              alt="Ebartex"
              fill
              className="object-contain object-center"
              priority
              sizes="(max-width: 640px) 200px, 260px"
              unoptimized
            />
          </Link>
        </div>

        {/* Link account business in alto a destra */}
        <div className="absolute right-4 top-8 text-right">
          <Link
            href="/account-business"
            className="text-sm text-white hover:underline"
          >
            Sei un professionista? Apri un account business
          </Link>
        </div>

        {/* "I TUOI DATI" fuori dal box; riquadro con linee a rettangolo */}
        <div className="mx-auto mt-8 w-full max-w-xl flex-1 px-4 pb-12">
          <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wide text-white">
            I TUOI DATI
          </h1>
          <div
            className="overflow-hidden rounded-3xl border-2 border-white"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="p-12">
              <RegistratiForm />
            </div>
          </div>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-white hover:underline">
              Hai già un account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

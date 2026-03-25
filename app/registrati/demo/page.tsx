import Link from 'next/link';
import Image from 'next/image';
import { RegistratiDemoForm } from '@/components/feature/registrati/RegistratiDemoForm';
import { getCdnImageUrl } from '@/lib/config';

export const metadata = {
  title: 'Registrazione demo | Registrati | Ebartex',
  description: 'Registrazione veloce in 30 secondi',
};

export default function RegistratiDemoPage() {
  const carouselBg = getCdnImageUrl('carousel/slide1.jpg');
  const logoUrl = getCdnImageUrl('logo.png');
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${carouselBg}")` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#2d2d2d]/25" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col pt-8">
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
        <div className="mx-auto mt-8 w-full max-w-lg flex-1 px-4 pb-24">
          <div className="overflow-hidden rounded-[24px] border border-gray-100/30 border-t border-l border-white/60 bg-white/60 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.05)]">
            <div className="p-6 sm:p-8 md:p-10">
              <h1 className="mb-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Registrazione demo
              </h1>

              <RegistratiDemoForm />

              <div className="mt-6 border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-center items-center gap-4 text-center">
                <Link
                  href="/demo"
                  className="rounded-full border border-gray-100/50 bg-white/65 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-[#FF7300]"
                >
                  Torna alla scelta
                </Link>
                <Link
                  href="/login?accesso=1"
                  className="rounded-full border border-gray-100/50 bg-white/65 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-[#FF7300]"
                >
                  Hai già un account? Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

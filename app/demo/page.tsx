import Link from 'next/link';
import Image from 'next/image';

import { getCdnImageUrl } from '@/lib/config';

export const metadata = {
  title: 'Demo | Ebartex',
  description:
    'Benvenuto nella demo di Ebartex: cosa puoi provare e come segnalarci bug e problemi.',
};

export default function DemoExplanationPage() {
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

        <div className="mx-auto mt-10 w-full max-w-xl flex-1 px-4 pb-24 flex flex-col justify-center">
          <div className="overflow-hidden rounded-[24px] border border-gray-100/30 border-t border-l border-white/60 bg-white/60 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.05)]">
            <div className="p-7 sm:p-9 md:p-10">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 text-center">
                Benvenuto nella demo di Ebartex
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-gray-700/90">
                Qui puoi esplorare la piattaforma e farti un'idea di come funzioneranno aste,
                acquisti e gestione del tuo account. Tutto è in fase di sviluppo e potresti
                incontrare bug, rallentamenti o altre piccole imperfezioni.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-gray-700/90">
                Se noti problemi, ti chiediamo cortesemente di inviarci una mail a{' '}
                <a
                  href="mailto:ebartex.service@gmail.com"
                  className="font-semibold text-[#FF7300] hover:underline"
                >
                  ebartex.service@gmail.com
                </a>
                .
              </p>

              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/login?accesso=1"
                  className="rounded-full border border-orange-100/60 bg-orange-50/60 px-7 py-2.5 text-center text-sm sm:text-base font-semibold text-[#FF7300] transition-all duration-200 hover:bg-orange-50/90 hover:scale-[1.02] active:scale-95"
                >
                  Accedi
                </Link>
                <Link
                  href="/registrati/demo"
                  className="rounded-full bg-gradient-to-b from-[#FF7300] to-[#FF7300] px-7 py-2.5 text-center text-sm sm:text-base font-semibold text-white shadow-[0_4px_12px_rgba(255,115,0,0.25)] transition-all duration-200 hover:brightness-95 hover:scale-[1.03] hover:shadow-[0_8px_18px_rgba(255,115,0,0.30)] active:scale-95"
                >
                  Registrati ora
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            La demo potrebbe cambiare mentre lavoriamo su nuove funzionalita.
          </div>
        </div>
      </div>
    </div>
  );
}


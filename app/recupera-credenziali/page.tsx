import Link from 'next/link';
import Image from 'next/image';
import { RecuperaCredenzialiForm } from '@/components/feature/login/recupera-credenziali-form';

export const metadata = {
  title: 'Recupera credenziali | Ebartex',
  description: 'Reimposta la password del tuo account Ebartex',
};

const CAROUSEL_BG = '/carousel/slide1.jpg';

export default function RecuperaCredenzialiPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${CAROUSEL_BG}")` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[#2d2d2d]/40"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col pt-8">
        <div className="flex justify-center px-4">
          <Link
            href="/"
            className="relative block h-[80px] w-[200px] sm:h-[100px] sm:w-[260px]"
            aria-label="Ebartex Home"
          >
            <Image
              src="/logo.png"
              alt="Ebartex"
              fill
              className="object-contain object-center"
              priority
              sizes="(max-width: 640px) 200px, 260px"
            />
          </Link>
        </div>

        <div className="absolute right-4 top-8 text-right">
          <Link
            href="/account-business"
            className="text-sm text-white hover:underline"
          >
            Sei un professionista? Apri un account business
          </Link>
        </div>

        <div className="mx-auto mt-8 w-full max-w-xl flex-1 px-4 pb-12">
          <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wide text-white">
            Recupera credenziali
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
              <RecuperaCredenzialiForm />
            </div>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/registrati"
              className="text-sm text-white hover:underline"
            >
              Non hai un account? Registrati
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

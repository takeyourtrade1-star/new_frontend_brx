import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Offerta Massima | Ebartex',
  description: 'Configura la tua offerta massima automatica',
};

type Props = {
  searchParams: Promise<{ auctionId?: string }>;
};

export default async function BiddingPage({ searchParams }: Props) {
  const { auctionId } = await searchParams;

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <div className="container-content py-8">
        <Link
          href={auctionId ? `/aste/${auctionId}` : '/aste'}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#FF7300] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna all&apos;asta
        </Link>

        <div className="mt-8 rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-[1px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
            Offerta Massima
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Questa funzione sarà disponibile prossimamente.
          </p>
          
          <div className="mt-8 flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
                Coming Soon
              </p>
              <p className="mt-2 text-xs text-gray-400 max-w-xs">
                L&apos;offerta massima automatica ti permetterà di impostare un limite superiore e farebbero offerte automatiche fino a quel importo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

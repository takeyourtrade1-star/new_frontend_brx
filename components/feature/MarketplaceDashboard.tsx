import Image from 'next/image';
import { NuoveOccasioniCard } from './NuoveOccasioniCard';
import { getCdnImageUrl } from '@/lib/config';
const SECTION_RADIUS = '1rem';

const getBestSellersCards = () => [
  { src: getCdnImageUrl('cards/card2.png'), label: 'Carta Pikachu', price: '3$', rank: 1 },
  { src: getCdnImageUrl('cards/card3.png'), label: 'Carta Pikachu', price: '3$', rank: 2 },
  { src: getCdnImageUrl('cards/card1.png'), label: 'Carta Pikachu', price: '3$', rank: 3 },
];

const listItem = { label: 'Il gattopardo magico', price: '3$' };
const listItems = Array(3).fill(listItem);

const getScambiaCards = () => [
  { src: getCdnImageUrl('cards/card2.png'), label: 'Carta Pikachu', price: '3$', rank: 1 },
  { src: getCdnImageUrl('cards/card3.png'), label: 'Carta Pikachu', price: '3$', rank: 2 },
  { src: getCdnImageUrl('cards/card1.png'), label: 'Carta Pikachu', price: '3$', rank: 3 },
];

export function MarketplaceDashboard() {
  const bestSellersCards = getBestSellersCards();
  const scambiaCards = getScambiaCards();
  return (
    <div className="w-full font-sans bg-transparent text-white transition-colors duration-300">
      {/* Titolo centrato: NON LASCIARTELI SCAPPARE (sottolineato); nessuno sfondo proprio, si vede il background del body */}
      <section className="-mt-4 flex w-full justify-center pb-4 pt-6">
        <span
          className="text-center text-2xl font-bold uppercase tracking-wide md:text-3xl"
          style={{
            background: 'linear-gradient(135deg, #FAE27A 0%, #DA6B32 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            borderBottom: '3px solid #DA6B32',
            paddingBottom: 4,
          }}
        >
          NON LASCIARTELI SCAPPARE
        </span>
      </section>

      {/* Main content: mt-4 compensa il -mt-4 del titolo così solo il testo sale, le card restano ferme */}
      <div className="mx-auto max-w-7xl mt-4 space-y-6 px-2 pb-6 pt-2 sm:px-3">
        {/* Row 1: BEST SELLERS | SUPER PREZZI | SCAMBIA ORA */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* BEST SELLERS - sfumatura viola vivace → prugna */}
          <div
            className="overflow-hidden rounded-2xl p-4 shadow-lg md:p-5"
            style={{
              background: 'linear-gradient(135deg, #5B4B9E 0%, #4A2C6D 50%, #6B3A7A 100%)',
              borderRadius: SECTION_RADIUS,
            }}
          >
            <div className="mx-auto mb-4 w-fit rounded-full bg-white px-6 py-2.5 text-center">
              <span
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: '#1e3a8a' }}
              >
                Best Sellers
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {bestSellersCards.map((card) => (
                  <div key={card.rank} className="flex flex-col items-center">
                    <span
                      className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black text-sm font-bold"
                      style={{
                        backgroundColor: card.rank === 2 ? '#C0C0C0' : card.rank === 3 ? '#CD7F32' : '#FBBF24',
                        color: '#171717',
                      }}
                    >
                      {card.rank}
                    </span>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                      <Image
                        src={card.src}
                        alt={card.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 16vw"
                        unoptimized
                      />
                    </div>
                    <div className="w-full px-2 pb-2 pt-1.5 text-center">
                      <div
                        className="inline-flex rounded-md px-2.5 py-1 text-center"
                        style={{ backgroundColor: '#FBBF24' }}
                      >
                        <span className="whitespace-nowrap text-xs font-bold text-gray-900">
                          {card.label}
                        </span>
                      </div>
                      <p className="mt-1 text-center text-xs font-bold text-white">
                        {card.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <ul className="mt-4 space-y-3">
                {listItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-2 py-2"
                  >
                    <span className="w-6 text-base font-bold text-white">
                      {i + 4}
                    </span>
                    <div className="h-12 w-12 shrink-0 rounded-full bg-gray-400/60" />
                    <span className="flex-1 text-sm font-bold text-white">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white">{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SUPER PREZZI - sfumatura bordeaux/plum → bordeaux scuro */}
          <div
            className="overflow-hidden rounded-2xl p-4 shadow-lg md:p-5"
            style={{
              background: 'linear-gradient(135deg, #8B5A6B 0%, #6B4A5B 50%, #4A3038 100%)',
              borderRadius: SECTION_RADIUS,
            }}
          >
            <div className="mx-auto mb-4 w-fit rounded-full bg-white px-6 py-2.5 text-center">
              <span
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: '#1e3a8a' }}
              >
                Super Prezzi
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {bestSellersCards.map((card) => (
                  <div key={card.rank} className="flex flex-col items-center">
                    <span
                      className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black text-sm font-bold"
                      style={{
                        backgroundColor: card.rank === 2 ? '#C0C0C0' : card.rank === 3 ? '#CD7F32' : '#FBBF24',
                        color: '#171717',
                      }}
                    >
                      {card.rank}
                    </span>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                      <Image
                        src={card.src}
                        alt={card.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 16vw"
                        unoptimized
                      />
                    </div>
                    <div className="w-full px-2 pb-2 pt-1.5 text-center">
                      <div
                        className="inline-flex rounded-md px-2.5 py-1 text-center"
                        style={{ backgroundColor: '#FBBF24' }}
                      >
                        <span className="whitespace-nowrap text-xs font-bold text-gray-900">
                          {card.label}
                        </span>
                      </div>
                      <p className="mt-1 text-center text-xs font-bold text-white">
                        {card.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <ul className="mt-4 space-y-3">
                {listItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-2 py-2"
                  >
                    <span className="w-6 text-base font-bold text-white">
                      {i + 4}
                    </span>
                    <div className="h-12 w-12 shrink-0 rounded-full bg-gray-400/60" />
                    <span className="flex-1 text-sm font-bold text-white">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white">{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SCAMBIA ORA - sfumatura teal → navy/indigo */}
          <div
            className="overflow-hidden rounded-2xl p-4 shadow-lg md:p-5"
            style={{
              background: 'linear-gradient(135deg, #1E4D5C 0%, #1A3D4D 50%, #0F1729 100%)',
              borderRadius: SECTION_RADIUS,
            }}
          >
            <div className="mx-auto mb-4 w-fit rounded-full border border-gray-200 bg-white px-6 py-2.5 text-center shadow-sm">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-800">
                Scambia Ora
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {scambiaCards.map((card, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center"
                >
                  <span
                    className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black text-sm font-bold"
                    style={{
                      backgroundColor: card.rank === 2 ? '#C0C0C0' : card.rank === 3 ? '#CD7F32' : '#FBBF24',
                      color: '#171717',
                    }}
                  >
                    {card.rank}
                  </span>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                    <Image
                      src={card.src}
                      alt={card.label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 16vw"
                      unoptimized
                    />
                  </div>
                  <div className="w-full px-2 pb-2 pt-1.5 text-center">
                    <div
                      className="inline-flex rounded-md px-2.5 py-1 text-center"
                      style={{ backgroundColor: '#FBBF24' }}
                    >
                      <span className="whitespace-nowrap text-xs font-bold text-gray-900">
                        {card.label}
                      </span>
                    </div>
                    <p className="mt-1 text-center text-xs font-bold text-white">
                      {card.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Lista sotto le card: 4, 5, 6 con placeholder ovale e testo */}
            <ul className="mt-4 space-y-3">
              {listItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <span className="w-6 text-base font-bold text-white">
                    {i + 4}
                  </span>
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gray-400/60" />
                  <span className="flex-1 text-sm font-bold text-white">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-white">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Row 2: NUOVE OCCASIONI (wide) | NUOVE ESPANSIONI (narrow) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NuoveOccasioniCard />
          </div>

          {/* NUOVE ESPANSIONI - 1/3 width (layout come riferimento: barra arancione, immagine, pallini) */}
          <div
            className="overflow-hidden rounded-2xl shadow-lg"
            style={{
              border: '2px solid #1e3a5f',
              backgroundColor: '#1e3a5f',
            }}
          >
            {/* Barra arancione in alto con testo bianco */}
            <div
              className="w-full py-2.5 text-center"
              style={{
                background: 'linear-gradient(90deg, #C2410C 0%, #EA580C 50%, #F97316 100%)',
              }}
            >
              <span className="text-sm font-bold uppercase tracking-wide text-white">
                NUOVE ESPANSIONI
              </span>
            </div>
            {/* Immagine Avatar (leggermente zoommata) con titolo sotto la barra */}
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={getCdnImageUrl('footer/b3bc471ced1aee6228467881901001b851ead8a6.jpg')}
                alt="I misteri passati di Aang"
                fill
                className="object-cover"
                style={{ transform: 'scale(1.3)' }}
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              <div
                className="absolute inset-x-0 top-0 flex flex-col pt-1 pl-4"
                aria-hidden
              >
                <p className="text-left text-2xl font-bold uppercase leading-tight text-white drop-shadow-md md:text-4xl">
                  I MISTERI PASSATI
                  <br />
                  DI AANG
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

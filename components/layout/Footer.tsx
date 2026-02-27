import Link from 'next/link';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';

/** Colonne link in stile CardTrader: titolo + lista link */
const FOOTER_COLUMNS = [
  {
    title: 'Lingua del sito',
    links: [
      { label: 'Italiano', href: '#' },
      { label: 'English', href: '#' },
      { label: 'Español', href: '#' },
    ],
  },
  {
    title: 'Funzionalità',
    links: [
      { label: 'Compra', href: '/products' },
      { label: 'Vendi', href: '/account-business' },
      { label: 'Scambia', href: '/scambi' },
      { label: 'Aste', href: '/aste' },
      { label: 'Sincronizza', href: '/sincronizza' },
    ],
  },
  {
    title: 'Aiuto',
    links: [
      { label: 'Termini di utilizzo', href: '/legal/condizioni' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Cookie Policy', href: '/legal/cookie' },
      { label: 'FAQ', href: '/aiuto' },
      { label: 'Contattaci', href: '/contatti' },
    ],
  },
  {
    title: 'Guide',
    links: [
      { label: 'Guida alle condizioni', href: '/aiuto#condizioni' },
      { label: 'Come comprare', href: '/aiuto#comprare' },
      { label: 'Metodi di spedizione', href: '/aiuto#spedizione' },
    ],
  },
  {
    title: 'Giochi',
    links: [
      { label: 'Magic: the Gathering', href: '/products?game=magic' },
      { label: 'Pokémon', href: '/products?game=pokemon' },
      { label: 'Yu-Gi-Oh!', href: '/products?game=yugioh' },
    ],
  },
] as const;

const FOOTER_BAND_BG = '#1D3160';

export function Footer() {
  return (
    <footer className="w-full bg-white text-gray-900">
      {/* Fascia logo + claim: sfondo blu e testo bianco come prima */}
      <div
        className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-white md:flex-row md:gap-6 md:py-10"
        style={{ backgroundColor: FOOTER_BAND_BG }}
      >
        <Link href="/" className="flex items-center" aria-label="Ebartex Home">
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={320}
            height={128}
            className="h-[7.5rem] w-auto drop-shadow-sm md:h-[8rem]"
            unoptimized
          />
        </Link>
        <p className="text-center text-sm font-medium text-white/95 md:text-base">
          Il tuo marketplace per carte collezionabili
        </p>
      </div>

      {/* Blocco link: bordo arancione in alto */}
      <div className="border-t-4 border-[#FF7300] bg-white px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-7xl 2xl:max-w-[100rem] 3xl:max-w-[120rem] px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 border-b-2 border-[#FF7300]/60 pb-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra finale: copyright centrato */}
      <div className="flex items-center justify-center border-t border-gray-200 bg-white py-5 text-center">
        <span className="text-sm text-gray-700">
          © {new Date().getFullYear()} Ebartex. Tutti i diritti riservati.
        </span>
      </div>
    </footer>
  );
}

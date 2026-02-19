import Link from 'next/link';
import Image from 'next/image';

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

const HEADER_BG = '#1D3160';

export function Footer() {
  return (
    <footer className="w-full text-white" style={{ backgroundColor: HEADER_BG }}>
      {/* Fascia logo + claim */}
      <div
        className="flex flex-col items-center justify-center gap-3 px-4 py-8 md:flex-row md:gap-6 md:py-10"
        style={{ backgroundColor: HEADER_BG }}
      >
        <Link href="/" className="flex items-center" aria-label="Ebartex Home">
          <Image
            src="/landing/Logo%20Principale%20EBARTEX.png"
            alt="Ebartex"
            width={320}
            height={128}
            className="h-[7.5rem] w-auto drop-shadow-sm md:h-[8rem]"
          />
        </Link>
        <p className="text-center text-sm font-medium text-white/95 md:text-base">
          Il tuo marketplace per carte collezionabili
        </p>
      </div>

      {/* Blocco link: bordo arancione in alto */}
      <div
        className="border-t-4 border-[#FF7300] px-4 py-10 text-white md:px-6 md:py-14"
        style={{ backgroundColor: HEADER_BG }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 border-b-2 border-[#FF7300]/60 pb-2 text-sm font-bold uppercase tracking-wider text-white">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/75 transition-colors hover:text-[#FF7300]"
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
      <div
        className="flex items-center justify-center border-t border-white/10 py-5 text-center"
        style={{ backgroundColor: HEADER_BG }}
      >
        <span className="text-sm text-white">
          © {new Date().getFullYear()} Ebartex. Tutti i diritti riservati.
        </span>
      </div>
    </footer>
  );
}

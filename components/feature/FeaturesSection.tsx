'use client';

const ORANGE = '#FF7300';

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg' as const,
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: ORANGE,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-full w-full',
};

/** I prezzi migliori — mano con moneta, icona pulita e moderna */
function IconPrezziMigliori() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="7" r="4" />
      <line x1="12" y1="5" x2="12" y2="9" />
      <path d="M18 16c-1.5 0-2.5-.5-4-1l-3-1H4v4h12l2 1a2 2 0 0 0 2-3z" />
    </svg>
  );
}

/** Spedizioni veloci — pacco con freccia, icona pulita e moderna */
function IconSpedizioniVeloci() {
  return (
    <svg {...svgProps}>
      <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
      <path d="M16 10l4-2-4-2v4z" />
      <path d="M12 12h6" />
    </svg>
  );
}

function IconProtezioneAcquirente() {
  return (
    <svg {...svgProps}>
      <rect x="4" y="11" width="16" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  );
}

function IconGuidatiCommunity() {
  return (
    <svg {...svgProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const FEATURES = [
  { title: 'I prezzi migliori', Icon: IconPrezziMigliori },
  { title: 'Spedizioni veloci', Icon: IconSpedizioniVeloci },
  { title: 'Protezione acquirente', Icon: IconProtezioneAcquirente },
  { title: 'Guidati dalla community', Icon: IconGuidatiCommunity },
] as const;

export function FeaturesSection() {
  return (
    <section className="w-full bg-white py-4 font-sans text-gray-900 md:py-6">
      <div className="container-content px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {FEATURES.map(({ title, Icon }) => (
            <div
              key={title}
              className="flex items-center gap-3 text-center sm:text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10" aria-hidden>
                <Icon />
              </span>
              <h3 className="text-base font-bold uppercase tracking-wide text-gray-900 sm:text-lg">
                {title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Tag, Truck, ShieldCheck, Users } from 'lucide-react';

const features = [
  {
    icon: Tag,
    title: 'I prezzi migliori',
    description: 'Compara i prezzi tra migliaia di venditori.',
  },
  {
    icon: Truck,
    title: 'Spedizioni veloci',
    description: 'Vi raggiungiamo ovunque in 2-5 giorni lavorativi',
  },
  {
    icon: ShieldCheck,
    title: 'Protezione acquirente',
    description: 'Transazioni 100% sicure grazie al nostro partner.',
  },
  {
    icon: Users,
    title: 'Guidati dalla community',
    description: 'Unisciti a più di 1 milione di collezionisti e venditori.',
  },
] as const;

export function FeaturesSection() {
  return (
    <section
      className="features-section w-full pt-6 pb-14 md:pt-8 md:pb-20 font-sans bg-transparent text-white transition-colors duration-300"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-3">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-start gap-3 text-left md:gap-4"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center md:h-14 md:w-14"
                  aria-hidden
                >
                  <Icon
                    className="h-10 w-10 md:h-12 md:w-12"
                    style={{ color: '#FF7300' }}
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-black dark:text-white md:text-xl">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

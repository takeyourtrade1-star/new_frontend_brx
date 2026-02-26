const features = [
  { title: 'I prezzi migliori' },
  { title: 'Spedizioni veloci' },
  { title: 'Protezione acquirente' },
  { title: 'Guidati dalla community' },
] as const;

export function FeaturesSection() {
  return (
    <section
      className="w-full py-4 md:py-6 font-sans text-white"
      style={{ backgroundColor: '#1D3160' }}
    >
      <div className="container-content px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 text-center sm:text-left"
            >
              <div
                className="h-10 w-10 shrink-0 rounded-lg sm:h-12 sm:w-12"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                aria-hidden
              />
              <h3 className="text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

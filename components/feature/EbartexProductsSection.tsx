import Link from 'next/link';
import Image from 'next/image';

const PRODUCTS = [
  { id: 'dadi-magici', label: 'DADI MAGICI', href: '/products?category=dadi', image: '/footer/f5ad6b7217e9abd6ed3e026333913ba96dd00f74.png' },
  { id: 'buste', label: 'BUSTE', href: '/products?category=buste', image: '/footer/7f25a7bd6a52315737a312ef1283fe8d250ed5eb.png' },
  { id: 'album', label: 'ALBUM', href: '/products?category=album', image: '/footer/b3bc471ced1aee6228467881901001b851ead8a6.jpg' },
  { id: 'tappetini', label: 'TAPPETINI', href: '/products?category=tappetini', image: '/footer/b7e23951c913fe308eeda498f429598d53369372.jpg' },
  { id: 'game-kits', label: 'GAME KITS', href: '/products?category=game-kits', image: '/footer/f5ad6b7217e9abd6ed3e026333913ba96dd00f74.png' },
  { id: 'esplora-altro', label: 'ESPLORA ALTRO', href: '/products', image: '/footer/0d7d930f0e4154893466c139c778f7bdd2b8a23b.png' },
] as const;

export function EbartexProductsSection() {
  return (
    <section className="w-full py-10 md:py-14 bg-transparent">
      <div className="mx-auto max-w-7xl px-2 sm:px-3">
        <div className="flex w-full justify-center pb-8">
          <span
            className="font-display text-center text-2xl font-bold uppercase tracking-wide md:text-3xl"
            style={{
              background: 'linear-gradient(135deg, #FAE27A 0%, #DA6B32 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              borderBottom: '3px solid #DA6B32',
              paddingBottom: 8,
            }}
          >
            EBARTEX PRODUCTS
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PRODUCTS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex aspect-[4/3] w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />
              <div
                className={
                  item.id === 'esplora-altro'
                    ? 'absolute inset-0 flex items-center justify-center'
                    : 'absolute inset-x-0 bottom-0 flex justify-center pb-3 pt-8'
                }
              >
                <span
                  className="inline-flex h-[38px] min-w-[120px] items-center justify-center rounded-full px-6 text-center text-sm font-bold uppercase tracking-wide text-white"
                  style={{
                    background: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 50%, #6d28d9 100%)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

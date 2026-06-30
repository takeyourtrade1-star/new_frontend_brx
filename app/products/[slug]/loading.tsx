import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton dedicato alla pagina dettaglio prodotto/carta (immagine + info + tab).
 * Mostrato da Next durante il caricamento del segmento `/products/[slug]`.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8" aria-hidden>
      <Skeleton className="mb-6 h-4 w-48 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        {/* Immagine carta */}
        <Skeleton className="aspect-[63/88] w-full max-w-sm rounded-2xl bg-gray-200 dark:bg-gray-800" />
        {/* Info + tab */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-5 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

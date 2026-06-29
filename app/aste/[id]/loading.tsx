/**
 * Skeleton dedicato alla pagina dettaglio asta (layout immagine + info / offerte).
 * Mostrato da Next durante il caricamento del segmento `/aste/[id]`.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8" aria-hidden>
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        {/* Immagine carta */}
        <div className="aspect-[63/88] w-full max-w-sm animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        {/* Pannello offerte */}
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-32 w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-12 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

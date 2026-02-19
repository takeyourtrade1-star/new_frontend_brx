import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold text-[var(--color-brand-dark)] dark:text-white">
        Pagina non trovata
      </h2>
      <p className="text-muted-foreground">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <Link
        href="/"
        className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Torna alla home
      </Link>
    </div>
  );
}

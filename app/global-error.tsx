'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-xl font-semibold">Errore critico</h2>
          <p className="max-w-md text-center text-gray-600 dark:text-gray-400">
            {error.message || 'Si è verificato un errore. Prova a ricaricare.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-[#3D65C6] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Ricarica
          </button>
        </div>
      </body>
    </html>
  );
}

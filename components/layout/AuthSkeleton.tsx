import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton per pagine auth con layout split 50/50.
 */
export function AuthSkeleton() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      <div
        className="absolute inset-0 bg-gradient-to-b from-global-bg-start/25 via-[#2d2d2d]/40 to-global-bg-end/50 lg:right-1/2"
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 z-[1] hidden w-1/2 bg-white/90 lg:block" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="order-2 hidden flex-1 flex-col justify-center px-10 py-10 lg:order-1 lg:flex lg:w-1/2">
            <div className="space-y-4">
              <Skeleton className="h-28 rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md sm:h-36" />
              <Skeleton className="h-40 rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md" />
              <Skeleton className="h-56 rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md" />
            </div>
          </aside>

          <section className="order-1 flex flex-1 flex-col bg-white/90 px-6 py-6 sm:px-8 sm:py-8 lg:order-2 lg:w-1/2 lg:bg-transparent lg:px-8 lg:py-10 xl:px-10 xl:py-12">
            <div className="w-full max-w-none space-y-5">
              <Skeleton className="h-7 w-48 rounded-lg bg-gray-200/80" />
              <Skeleton className="h-4 w-64 rounded bg-gray-200/60" />
              <Skeleton className="h-11 w-full rounded-xl bg-gray-200/70" />
              <Skeleton className="h-11 w-full rounded-xl bg-gray-200/70" />
              <Skeleton className="h-10 w-full rounded-full bg-gray-200/80" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

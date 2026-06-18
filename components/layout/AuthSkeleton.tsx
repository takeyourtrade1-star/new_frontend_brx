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
              <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md sm:h-36" />
              <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md" />
              <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md" />
            </div>
          </aside>

          <section className="order-1 flex flex-1 flex-col bg-white/90 px-6 py-6 sm:px-8 sm:py-8 lg:order-2 lg:w-1/2 lg:bg-transparent lg:px-8 lg:py-10 xl:px-10 xl:py-12">
            <div className="w-full max-w-none space-y-5">
              <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200/80" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-200/60" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200/70" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200/70" />
              <div className="h-10 w-full animate-pulse rounded-full bg-gray-200/80" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

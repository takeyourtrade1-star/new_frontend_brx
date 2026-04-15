/**
 * Lightweight server-rendered skeleton for auth pages.
 * Matches the AuthShell layout with animated pulse placeholders.
 * No 'use client' — renders instantly without hydration.
 */
export function AuthSkeleton() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      <div className="absolute inset-0 bg-[#2d2d2d]" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col pt-8">
        <div className="flex justify-center px-4">
          <div className="h-[80px] w-[200px] sm:h-[100px] sm:w-[260px] animate-pulse rounded-xl bg-white/10" />
        </div>
        <div className="mx-auto mt-8 w-full max-w-xl flex-1 px-4 pb-12">
          <div className="mb-6 mx-auto h-9 w-48 animate-pulse rounded-lg bg-white/10" />
          <div
            className="rounded-3xl border-2 border-white/20 p-8 sm:p-12 space-y-7"
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div className="h-16 w-full animate-pulse rounded-xl bg-white/15" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-white/15" />
            <div className="h-14 w-full animate-pulse rounded-xl bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

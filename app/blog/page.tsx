import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BLOG_POSTS } from '@/lib/blog-posts';

export const metadata = {
  title: 'Blog | Ebartex – Novità e annunci',
  description:
    'Tutte le novità di Ebartex: nuove funzionalità, aste, scambi, tornei, BRX Express e annunci dal marketplace delle carte collezionabili.',
};

export default function BlogPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header reserveSpace={true} />
      </Suspense>

      <main className="min-h-screen bg-[#F5F4F0] pb-20">
        <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
          {/* Intestazione */}
          <header className="mb-8 text-center sm:mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF7300]">
              Ebartex
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-[#1D3160] sm:text-4xl">
              Blog
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Novità, annunci e nuove funzionalità del marketplace, raccontate man mano che arrivano.
            </p>
          </header>

          {/* Timeline dei post */}
          <div className="relative flex flex-col gap-5 sm:gap-6">
            <span
              className="pointer-events-none absolute bottom-4 left-[7px] top-4 hidden w-px bg-gray-200 sm:block"
              aria-hidden
            />
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="relative sm:pl-8">
                {/* Puntino sulla timeline */}
                <span
                  className="absolute left-0 top-7 hidden h-[15px] w-[15px] rounded-full border-[3px] border-[#F5F4F0] bg-[#FF7300] shadow-sm sm:block"
                  aria-hidden
                />
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_10px_28px_-18px_rgba(29,49,96,0.25)] sm:p-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${post.tagClass}`}
                    >
                      {post.tag}
                    </span>
                    <time
                      dateTime={post.date}
                      className="text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {post.dateLabel}
                    </time>
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-[#1D3160] sm:text-xl">
                    {post.title}
                  </h2>
                  <div className="mt-2.5 space-y-2.5">
                    {post.paragraphs.map((paragraph, i) => (
                      <p key={i} className="text-sm leading-relaxed text-gray-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {post.cta && (
                    <Link
                      href={post.cta.href}
                      className="mt-4 inline-flex items-center rounded-full bg-[#FF7300] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-[#e56700]"
                    >
                      {post.cta.label}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Chiusura */}
          <p className="mt-10 text-center text-xs text-gray-400">
            Altre novità in arrivo — torna a trovarci.
          </p>
        </div>
      </main>
    </>
  );
}

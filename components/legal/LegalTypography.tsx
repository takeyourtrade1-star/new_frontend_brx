import Link from 'next/link';
import { cn } from '@/lib/utils';

const linkClass =
  'font-medium text-[#FF7300] underline decoration-[#FF7300]/30 underline-offset-2 transition-colors hover:text-[#e56800] hover:decoration-[#FF7300]';

export function LegalP({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[15px] leading-7 text-slate-700', className)}>{children}</p>;
}

export function LegalH2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 border-l-4 border-[#FF7300] pl-4 font-display text-xl font-bold tracking-tight text-[#1D3160] md:text-2xl"
    >
      {children}
    </h2>
  );
}

export function LegalH3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[#1D3160]">{children}</h3>;
}

export function LegalUl({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-slate-700 marker:text-[#FF7300]">{children}</ul>;
}

export function LegalOl({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-7 text-slate-700 marker:font-semibold marker:text-[#1D3160]">{children}</ol>;
}

export function LegalSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-28 space-y-4 border-b border-slate-100 pb-8 last:border-0 last:pb-0', className)}>
      {children}
    </section>
  );
}

export function LegalIntro({ title, updated }: { title: string; updated: string }) {
  return (
    <div className="rounded-xl border border-[#FF7300]/20 bg-gradient-to-br from-[#FFF8F3] to-white px-5 py-4 md:px-6 md:py-5">
      <p className="font-display text-sm font-bold uppercase tracking-widest text-[#FF7300]">{title}</p>
      <p className="mt-1 text-sm text-slate-500">Ultimo aggiornamento: {updated}</p>
    </div>
  );
}

export function LegalCompanyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-sm leading-relaxed text-slate-700 shadow-sm">
      {children}
    </div>
  );
}

export function LegalInlineLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external || href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a href={href} className={linkClass} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

export function LegalTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function LegalTableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-[#1D3160] text-white">{children}</thead>;
}

export function LegalTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>;
}

export function LegalTableTh({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">{children}</th>;
}

export function LegalTableTd({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-slate-700">{children}</td>;
}

/** @deprecated Usa LegalP */
export const P = LegalP;
/** @deprecated Usa LegalH2 */
export const H2 = LegalH2;
/** @deprecated Usa LegalH3 */
export const H3 = LegalH3;
/** @deprecated Usa LegalUl */
export const Ul = LegalUl;

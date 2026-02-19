import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChevronLeft, Mail, MessageCircle } from 'lucide-react';

export const metadata = {
  title: 'Contattaci | Ebartex',
  description: 'Contatta il team Ebartex per supporto e informazioni',
};

export default function ContattiPage() {
  return (
    <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#3D65C6' }}>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Torna alla home
        </Link>
        <h1 className="mb-8 font-display text-2xl font-bold text-white md:text-3xl">
          Contattaci
        </h1>

        <div className="space-y-8">
          <section className="flex gap-4 rounded-xl border border-white/20 bg-white/10 p-6">
            <Mail className="h-8 w-8 shrink-0 text-white" />
            <div>
              <h2 className="mb-2 font-semibold text-white">Email</h2>
              <p className="mb-2 text-sm text-white/80">
                Per assistenza clienti, ordini e informazioni generali:
              </p>
              <a
                href="mailto:support@ebartex.com"
                className="text-sm font-medium text-white hover:underline"
              >
                support@ebartex.com
              </a>
            </div>
          </section>

          <section className="flex gap-4 rounded-xl border border-white/20 bg-white/10 p-6">
            <MessageCircle className="h-8 w-8 shrink-0 text-white" />
            <div>
              <h2 className="mb-2 font-semibold text-white">Supporto venditori</h2>
              <p className="mb-2 text-sm text-white/80">
                Per venditori e partner: domande su account business, commissioni e integrazioni.
              </p>
              <a
                href="mailto:venditori@ebartex.com"
                className="text-sm font-medium text-white hover:underline"
              >
                venditori@ebartex.com
              </a>
            </div>
          </section>

          <p className="text-sm text-white/80">
            Cerchi risposte rapide? Consulta la sezione{' '}
            <Link href="/aiuto" className="text-white hover:underline">
              Aiuto e FAQ
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

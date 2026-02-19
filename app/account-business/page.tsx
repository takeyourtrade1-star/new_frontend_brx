import Link from 'next/link';
import { AccountBusinessForm } from '@/components/feature/account-business/AccountBusinessForm';

export const metadata = {
  title: 'Account Business | Ebartex',
  description: 'Apri un account professionale Ebartex per vendere e acquistare',
};

export default function AccountBusinessPage() {
  return (
    <div className="min-h-screen bg-[#212121] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Card principale: info + form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl sm:p-10">
          <h1 className="mb-2 text-2xl font-bold text-[#1f2937]">
            Account Business
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            L&apos;account professionale per aziende e venditori. Richiedi
            l&apos;attivazione compilando il modulo sotto.
          </p>

          {/* Informazioni */}
          <div className="mb-8 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            <h2 className="mb-2 font-semibold text-gray-900">
              A chi è rivolto
            </h2>
            <p className="mb-3">
              L&apos;account business è pensato per professionisti, negozi e
              aziende che vogliono vendere o acquistare su Ebartex con
              condizioni dedicate, fatturazione e supporto dedicato.
            </p>
            <h2 className="mb-2 font-semibold text-gray-900">
              Cosa ti serve
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>Ragione sociale o nome dell&apos;attività</li>
              <li>Partita IVA valida (11 cifre)</li>
              <li>Email e telefono di riferimento</li>
            </ul>
            <p className="mt-3 text-gray-600">
              Dopo l&apos;invio della richiesta, il nostro team ti contatterà
              per completare la verifica e attivare l&apos;account.
            </p>
          </div>

          {/* Form creazione account business */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Richiedi il tuo account business
            </h2>
            <AccountBusinessForm />
          </div>
        </div>

        {/* Link secondario in basso */}
        <p className="mt-6 text-center">
          <Link
            href="/registrati"
            className="text-sm text-white/80 hover:text-white hover:underline"
          >
            Non sei un professionista? Crea un account personale
          </Link>
        </p>
      </div>
    </div>
  );
}

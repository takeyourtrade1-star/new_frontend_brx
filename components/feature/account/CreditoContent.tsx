'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getCdnImageUrl } from '@/lib/config';

const contoBancarioSchema = z.object({
  iban: z.string().min(1, 'Inserisci IBAN'),
  bicSwift: z.string().min(1, 'Inserisci BIC/SWIFT'),
  nomeBanca: z.string().min(1, 'Inserisci il nome della banca'),
  confermaIntestatario: z
    .boolean()
    .refine((v) => v === true, {
      message: "Devi confermare la corrispondenza dell'intestatario",
    }),
});

type ContoBancarioValues = z.infer<typeof contoBancarioSchema>;

const SALDO_MOCK = '0,00';

const getCreditoIcons = () => ({
  paypal: getCdnImageUrl('icone-credito/5940e1c945029bd0805d24688010007167cbe82c.png'),
  bankTransfer: getCdnImageUrl('icone-credito/6bcd80fb790eb6df62388f889069a5ad296b52f8.png'),
  ebank: getCdnImageUrl('icone-credito/be0f0648125838db80b716b448190891f79f9dfc.png'),
});

function PaymentCard({
  icon,
  label,
  description,
  highlighted = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  highlighted?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-[120px] w-full items-center gap-4 border p-4 text-left transition-all hover:shadow-sm ${
        highlighted
          ? 'border-[#FF7300] hover:bg-orange-50/40'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-gray-100 bg-gray-50">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-bold uppercase tracking-wide text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}

export function CreditoContent() {
  const user = useAuthStore((s) => s.user);
  const intestatario = (user?.name || 'LEONARDO XHETA').toUpperCase();
  const ICONS = getCreditoIcons();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContoBancarioValues>({
    resolver: zodResolver(contoBancarioSchema),
    defaultValues: { iban: '', bicSwift: '', nomeBanca: '', confermaIntestatario: false },
  });

  function onSubmitConto(_data: ContoBancarioValues) {
    // TODO: invio dati conto bancario all'API
  }

  return (
    <div className="font-sans text-gray-900">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/account" className="hover:text-gray-900" aria-label="Account">
          <Home className="h-4 w-4" />
        </Link>
        <span>/</span>
        <Link href="/account" className="hover:text-gray-900">ACCOUNT</Link>
        <span>/</span>
        <span className="font-medium text-gray-900">CREDITO</span>
      </nav>

      {/* Saldo */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-gray-200 bg-white p-5">
        <span className="text-lg font-bold uppercase tracking-wide text-gray-900">
          IL TUO CREDITO
        </span>
        <span className="text-3xl font-bold text-gray-900">{SALDO_MOCK} €</span>
      </div>

      {/* Azioni saldo */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          className="rounded-none border border-[#1D3160] bg-[#1D3160] px-6 font-semibold uppercase text-white hover:bg-[#1D3160]/90"
        >
          RITIRA CREDITO
        </Button>
        <Link href="/account/transazioni" className="text-sm text-gray-500 underline hover:text-gray-900">
          TUTTE LE TRANSAZIONI
        </Link>
      </div>

      {/* Ricarica saldo */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold uppercase tracking-wide text-gray-900">
          RICARICA IL SALDO DELL&apos;ACCOUNT
        </h2>

        {/* Istantaneo */}
        <div className="mb-4 flex items-center gap-2 text-gray-700">
          <Zap className="h-5 w-5 text-[#FF7300]" />
          <span className="text-sm font-bold uppercase tracking-wide">Trasferimento bancario</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PaymentCard
            highlighted
            icon={
              <Image src={ICONS.paypal} alt="PayPal" width={48} height={48} className="h-10 w-auto object-contain" unoptimized />
            }
            label="Paga con PayPal"
            description="Versione demo — presto potrai caricare i tuoi soldi."
          />
          <PaymentCard
            highlighted
            icon={
              <Image src={ICONS.bankTransfer} alt="Bonifico istantaneo" width={48} height={48} className="h-10 w-auto object-contain" unoptimized />
            }
            label="Bonifico istantaneo"
            description="Versione demo — presto potrai caricare i tuoi soldi."
          />
        </div>

        {/* Classico */}
        <div className="mt-8 mb-4 flex items-center gap-2 text-gray-700">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-bold uppercase tracking-wide">Trasferimento classico</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PaymentCard
            icon={
              <Image src={ICONS.ebank} alt="Trasferimento bancario" width={48} height={48} className="h-10 w-auto object-contain" unoptimized />
            }
            label="Trasferimento bancario"
            description="Versione demo — presto potrai caricare i tuoi soldi."
          />
        </div>

        <div className="mt-8 border-t border-gray-200" />
      </section>

      {/* Collega conto bancario */}
      <section>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
              COLLEGA IL TUO CONTO BANCARIO
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Versione demo — presto potrai collegare il tuo conto.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm text-gray-700">
            <span className="uppercase tracking-wide">Intestatario del conto</span>
            <p className="mt-1 font-semibold text-gray-900">{intestatario}</p>
          </div>
          <span className="text-xs uppercase text-gray-400">*Campi obbligatori</span>
        </div>

        <form onSubmit={handleSubmit(onSubmitConto)} className="max-w-3xl space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { id: 'iban' as const, label: 'IBAN', placeholder: "Inserisci l'IBAN" },
              { id: 'bicSwift' as const, label: 'BIC/SWIFT', placeholder: 'Inserisci BIC/SWIFT' },
              { id: 'nomeBanca' as const, label: 'Nome della banca', placeholder: 'Inserisci nome della banca' },
            ].map(({ id, label, placeholder }) => (
              <div key={id}>
                <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {label}
                </label>
                <Input
                  id={id}
                  placeholder={placeholder}
                  className="h-10 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF7300]"
                  {...register(id)}
                />
                {errors[id] && (
                  <p className="mt-1 text-xs text-red-500">{errors[id]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <label htmlFor="confermaIntestatario" className="flex cursor-pointer items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="confermaIntestatario"
              className="mt-0.5 h-4 w-4 accent-[#FF7300]"
              {...register('confermaIntestatario')}
            />
            <span className="text-xs leading-relaxed text-gray-700">
              CONFERMO CHE IL MIO NOME COMPLETO CORRISPONDE A QUELLO DELL&apos;INTESTATARIO DEL
              CONTO CORRENTE. NEL CASO IN CUI I NOMI NON COINCIDANO, AUTORIZZO EBARTEX A
              PROCEDERE COMUNQUE CON IL PAGAMENTO.*
            </span>
          </label>
          {errors.confermaIntestatario && (
            <p className="text-xs text-red-500">{errors.confermaIntestatario.message}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              type="submit"
              className="rounded-none font-semibold uppercase text-white hover:opacity-90"
              style={{ backgroundColor: '#FF7300' }}
            >
              Collega conto bancario
            </Button>
            <Link href="/account/credito" className="text-sm text-gray-500 underline hover:text-gray-900">
              ANNULLA
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}

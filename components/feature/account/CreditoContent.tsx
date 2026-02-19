'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/stores/auth-store';

const contoBancarioSchema = z.object({
  iban: z.string().min(1, 'Inserisci IBAN'),
  bicSwift: z.string().min(1, 'Inserisci BIC/SWIFT'),
  nomeBanca: z.string().min(1, 'Inserisci il nome della banca'),
  confermaIntestatario: z
    .boolean()
    .refine((v) => v === true, {
      message: 'Devi confermare la corrispondenza dell\'intestatario',
    }),
});

type ContoBancarioValues = z.infer<typeof contoBancarioSchema>;

const SALDO_MOCK = '0,00';

const ICONS = {
  lightning: '/images/icone-credito/9ce32205c84b551967e2b78ce4f3823f747b4d4d.png',
  paypal: '/images/icone-credito/5940e1c945029bd0805d24688010007167cbe82c.png',
  clock: '/images/icone-credito/89f450008f53edeaf10d33852a6134c379915b3d.png',
  bankTransfer: '/images/icone-credito/6bcd80fb790eb6df62388f889069a5ad296b52f8.png',
  ebank: '/images/icone-credito/be0f0648125838db80b716b448190891f79f9dfc.png',
} as const;

export function CreditoContent() {
  const user = useAuthStore((s) => s.user);
  const intestatario = (user?.name || 'LEONARDO XHETA').toUpperCase();

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
    <div className="text-white">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-2 text-sm text-white/90"
        aria-label="Breadcrumb"
      >
        <Link href="/account" className="hover:text-white" aria-label="Account">
          <Home className="h-4 w-4" />
        </Link>
        <span className="text-white/60">/</span>
        <span>ACCOUNT</span>
        <span className="text-white/60">/</span>
        <span className="text-white">CREDITO</span>
      </nav>

      {/* Sezione: Il tuo credito */}
      <div className="mb-6 mt-8 rounded-lg bg-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-lg font-bold uppercase tracking-wide text-white">
            IL TUO CREDITO
          </span>
          <span className="text-2xl font-bold text-white sm:text-3xl">
            {SALDO_MOCK} €
          </span>
        </div>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          className="rounded-lg bg-[#1D3160] px-6 font-semibold uppercase text-white hover:bg-[#1D3160]/90"
        >
          RITIRA CREDITO
        </Button>
        <Link
          href="/account/transazioni"
          className="text-sm text-white/70 underline hover:text-white"
        >
          TUTTE LE TRANSAZIONI
        </Link>
      </div>

      {/* Ricarica il saldo dell'account - Card in fila con sfondo a due zone */}
      <section className="mb-12">
        <h2 className="mb-10 text-xl font-bold uppercase tracking-wide text-white">
          RICARICA IL SALDO DELL&apos;ACCOUNT
        </h2>

        <div className="mb-6 flex items-center gap-3 text-white/90">
          <Image
            src={ICONS.lightning}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            aria-hidden
          />
          <span className="text-lg font-bold uppercase">Trasferimento bancario</span>
        </div>

        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto_1fr] sm:gap-6">
          {/* Card 1: PayPal - bordo arancione */}
          <button
            type="button"
            className="flex min-h-[140px] overflow-hidden rounded-xl border-2 border-[#FF7300] transition-opacity hover:opacity-95"
          >
            <div
              className="flex w-[120px] shrink-0 items-center justify-center rounded-l-[10px] bg-cover bg-center bg-no-repeat p-4"
              style={{ backgroundImage: "url('/images/rectangle-99.png')" }}
            >
              <Image
                src={ICONS.paypal}
                alt="PayPal"
                width={140}
                height={140}
                className="h-24 w-24 object-contain sm:h-28 sm:w-28"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center rounded-r-[10px] bg-[#1D3160] p-4">
              <p className="font-bold uppercase leading-tight text-white">PAGA CON PAYPAL</p>
              <p className="mt-1 text-xs text-white/80">
                Questa è ancora la versione demo, presto potrai caricare i tuoi soldi.
              </p>
            </div>
          </button>

          {/* Card 2: Bonifico Istantaneo - bordo arancione */}
          <button
            type="button"
            className="flex min-h-[140px] overflow-hidden rounded-xl border-2 border-[#FF7300] transition-opacity hover:opacity-95"
          >
            <div
              className="flex w-[120px] shrink-0 items-center justify-center rounded-l-[10px] bg-cover bg-center bg-no-repeat p-4"
              style={{ backgroundImage: "url('/images/rectangle-99.png')" }}
            >
              <Image
                src={ICONS.bankTransfer}
                alt="Bonifico istantaneo"
                width={80}
                height={80}
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center rounded-r-[10px] bg-[#1D3160] p-4">
              <p className="font-bold uppercase leading-tight text-white">BONIFICO ISTANTANEO</p>
              <p className="mt-1 text-xs text-white/80">
                Questa è ancora la versione demo, presto potrai caricare i tuoi soldi.
              </p>
            </div>
          </button>

          {/* Linea verticale bianca tra card 2 e card 3 */}
          <div className="hidden min-h-[240px] items-stretch sm:flex" aria-hidden>
            <div className="w-px shrink-0 bg-white" />
          </div>

          {/* Intestazione "Trasferimento classico" + Card 3 */}
          <div className="flex flex-col gap-3">
            <div className="mt-10 flex items-center gap-3 text-white">
              <Image
                src={ICONS.clock}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
                aria-hidden
              />
              <span className="text-lg font-bold uppercase tracking-wide">
                Trasferimento classico
              </span>
            </div>
            <button
              type="button"
              className="flex min-h-[140px] overflow-hidden rounded-xl border-2 border-gray-800 transition-opacity hover:opacity-95"
            >
              <div
                className="flex w-[120px] shrink-0 items-center justify-center rounded-l-[10px] bg-cover bg-center bg-no-repeat p-4"
                style={{ backgroundImage: "url('/images/rectangle-99.png')" }}
              >
                <Image
                  src={ICONS.ebank}
                  alt="Trasferimento bancario"
                  width={80}
                  height={80}
                  className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center rounded-r-[10px] bg-[#1D3160] p-4">
                <p className="font-bold uppercase leading-tight text-white">TRASFERIMENTO BANCARIO</p>
                <p className="mt-1 text-xs text-white/80">
                  Questa è ancora la versione demo, presto potrai caricare i tuoi soldi.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-white/20 pt-2">
          <div className="h-0.5 w-full rounded bg-white/10" />
          <div className="mt-0.5 h-0.5 w-full rounded bg-[#FF7300]/60" />
        </div>
      </section>

      {/* Collega il tuo conto bancario */}
      <section>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-white">
              COLLEGA IL TUO CONTO BANCARIO
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Questa è ancora la versione demo, presto potrai caricare i tuoi soldi.
            </p>
          </div>
<Button
          type="button"
          className="rounded-lg font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: '#FF7300' }}
        >
          Questa è ancora la versione demo, presto potrai caricare i tuoi soldi.
        </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm text-white/90">
            <span className="uppercase">Intestatario del conto</span>
            <p className="mt-1 font-medium text-white">{intestatario}</p>
          </div>
          <span className="text-xs uppercase text-white/60">*Campi obbligatori</span>
        </div>

        <form onSubmit={handleSubmit(onSubmitConto)} className="max-w-4xl space-y-5">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <label htmlFor="iban" className="mb-1 block text-sm font-medium uppercase text-white/90">
                IBAN
              </label>
              <div
                className="flex h-9 items-center rounded-full bg-cover bg-center bg-no-repeat px-4 py-1"
                style={{ backgroundImage: "url('/images/rectangle-72.png')" }}
              >
                <Input
                  id="iban"
                  placeholder="INSERISCI L'IBAN"
                  className="h-7 border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...register('iban')}
                />
              </div>
              {errors.iban && (
                <p className="mt-1 text-sm text-red-400">{errors.iban.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="bicSwift" className="mb-1 block text-sm font-medium uppercase text-white/90">
                BIC/SWIFT
              </label>
              <div
                className="flex h-9 items-center rounded-full bg-cover bg-center bg-no-repeat px-4 py-1"
                style={{ backgroundImage: "url('/images/rectangle-72.png')" }}
              >
                <Input
                  id="bicSwift"
                  placeholder="INSERISCI BIC/SWIFT"
                  className="h-7 border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...register('bicSwift')}
                />
              </div>
              {errors.bicSwift && (
                <p className="mt-1 text-sm text-red-400">{errors.bicSwift.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="nomeBanca" className="mb-1 block text-sm font-medium uppercase text-white/90">
                Nome della banca
              </label>
              <div
                className="flex h-9 items-center rounded-full bg-cover bg-center bg-no-repeat px-4 py-1"
                style={{ backgroundImage: "url('/images/rectangle-72.png')" }}
              >
                <Input
                  id="nomeBanca"
                  placeholder="INSERISCI NOME DELLA BANCA"
                  className="h-7 border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...register('nomeBanca')}
                />
              </div>
              {errors.nomeBanca && (
                <p className="mt-1 text-sm text-red-400">{errors.nomeBanca.message}</p>
              )}
            </div>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <label
              htmlFor="confermaIntestatario"
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                id="confermaIntestatario"
                className="sr-only"
                {...register('confermaIntestatario')}
              />
              {/* Cerchio arancione (flag) */}
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center"
                aria-hidden
              >
                <span className="h-7 w-7 rounded-full border-2 border-[#FF7300] bg-transparent" />
              </span>
            </label>
            <span className="text-sm font-medium uppercase leading-snug text-white">
              CONFERMO CHE IL MIO NOME COMPLETO CORRISPONDE A QUELLO DELL&apos;INTESTATARIO DEL
              CONTO CORRENTE. NEL CASO IN CUI I NOMI NON COINCIDANO, AUTORIZZO EBARTEX A
              PROCEDERE COMUNQUE CON IL PAGAMENTO.*
            </span>
          </div>
          {errors.confermaIntestatario && (
            <p className="text-sm text-red-400">{errors.confermaIntestatario.message}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              type="submit"
              className="rounded-lg font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: '#FF7300' }}
            >
              Questa è ancora la versione demo, presto potrai caricare i tuoi soldi.
            </Button>
            <Link href="/account/credito" className="text-sm text-white/70 underline hover:text-white">
              ANNULLA
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}

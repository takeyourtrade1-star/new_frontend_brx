'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AttivaContoVenditore() {
  const [phone, setPhone] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [nomeBanca, setNomeBanca] = useState('');
  const [intestatario, setIntestatario] = useState('');
  const [importo1, setImporto1] = useState('');
  const [importo2, setImporto2] = useState('');
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const TENTATIVI_RIMASTI = 2;

  const hasMissingBankFields =
    !intestatario.trim() || !iban.trim() || !nomeBanca.trim();
  const hasMissingPhone = !phone.trim();
  const showRequiredMessage =
    hasTriedSubmit && (hasMissingPhone || hasMissingBankFields);

  function handleConfermaInvio(e: React.MouseEvent) {
    e.preventDefault();
    setHasTriedSubmit(true);
    if (!hasMissingPhone && !hasMissingBankFields) {
      // TODO: invio dati
    }
  }

  function handleConfermaAttiva(e: React.MouseEvent) {
    e.preventDefault();
    setHasTriedSubmit(true);
    // TODO: validazione importi e attivazione
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900">
        Attiva il tuo conto venditore
      </h1>

      <p className="max-w-2xl text-gray-700">
        Per diventare venditore su Ebartex ti consigliamo di consultare la Guida
        del Venditore e di attivare l&apos;autenticazione a due fattori (2FA) per
        maggiore sicurezza.
      </p>

      <p className="font-bold text-gray-900">
        Momentaneamente non sei un venditore verificato. Se vuoi diventare
        venditore su Ebartex, segui il procedimento:
      </p>

      {/* Step 1: Telefono */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold uppercase text-gray-900">
          Inserisci il tuo numero di telefono
        </h2>
        <div className="flex flex-wrap gap-3">
          <Input
            value="IT +39"
            readOnly
            className="h-12 w-24 rounded-none border-gray-300 bg-white text-gray-900"
          />
          <Input
            placeholder="Inserisci numero"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 w-64 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </section>

      {/* Step 2: Conto bancario */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold uppercase text-gray-900">
          Inserisci il tuo conto bancario
        </h2>
        <p className="max-w-2xl text-sm text-gray-700">
          Sono accettati solo conti intestati al titolare dell&apos;account.
          Verranno effettuati due micro-bonifici di verifica; dovrai inserire
          gli importi esatti ricevuti entro 5 giorni lavorativi.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Intestatario del conto
              {showRequiredMessage && (
                <span className="ml-1 text-red-400">Campi obbligatori</span>
              )}
            </label>
            <Input
              placeholder="Nome intestatario"
              value={intestatario}
              onChange={(e) => setIntestatario(e.target.value)}
              className="h-12 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              IBAN
            </label>
            <Input
              placeholder="Inserisci l'IBAN"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="h-12 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              BIC/SWIFT
            </label>
            <Input
              placeholder="Inserisci BIC/SWIFT"
              value={bic}
              onChange={(e) => setBic(e.target.value)}
              className="h-12 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Nome della banca
            </label>
            <Input
              placeholder="Inserisci nome della banca"
              value={nomeBanca}
              onChange={(e) => setNomeBanca(e.target.value)}
              className="h-12 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <Button
            type="button"
            className="h-12 rounded-none px-6 font-semibold uppercase text-gray-900"
            style={{ backgroundColor: '#FF7300' }}
            onClick={handleConfermaInvio}
          >
            Conferma e invia
          </Button>
        </div>
      </section>

      {/* Step 3: Conferma trasferimento */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold uppercase text-gray-900">
          Conferma di trasferimento
        </h2>
        <p className="text-gray-700">
          Se hai ricevuto i due bonifici bancari, conferma cortesemente
          l&apos;importo qua sotto.
        </p>
        <p className="text-sm font-medium text-gray-900">
          Rimangono ancora {TENTATIVI_RIMASTI} tentativi
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Importo 1
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={importo1}
                onChange={(e) => setImporto1(e.target.value)}
                className="h-12 w-32 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <span className="text-gray-900">€</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Importo 2
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={importo2}
                onChange={(e) => setImporto2(e.target.value)}
                className="h-12 w-32 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <span className="text-gray-900">€</span>
            </div>
          </div>
          <Button
            type="button"
            className="h-12 rounded-none px-6 font-semibold uppercase text-gray-900"
            style={{ backgroundColor: '#FF7300' }}
            onClick={handleConfermaAttiva}
          >
            Conferma – Attiva il mio conto venditore
          </Button>
        </div>
      </section>
    </div>
  );
}

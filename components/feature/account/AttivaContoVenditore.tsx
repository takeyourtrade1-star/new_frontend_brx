'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AttivaContoVenditore() {
  const { t } = useTranslation();
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
        {t('accountPage.sellerTitle')}
      </h1>

      <p className="max-w-2xl text-gray-700">{t('accountPage.sellerIntro1')}</p>

      <p className="font-bold text-gray-900">{t('accountPage.sellerIntro2')}</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold uppercase text-gray-900">
          {t('accountPage.sellerPhoneStep')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Input
            value="IT +39"
            readOnly
            className="h-12 w-24 rounded-none border-gray-300 bg-white text-gray-900"
          />
          <Input
            placeholder={t('accountPage.sellerPhonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 w-64 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold uppercase text-gray-900">
          {t('accountPage.sellerBankStep')}
        </h2>
        <p className="max-w-2xl text-sm text-gray-700">{t('accountPage.sellerBankHelp')}</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              {t('accountPage.sellerHolder')}
              {showRequiredMessage && (
                <span className="ml-1 text-red-400">{t('accountPage.sellerRequiredHint')}</span>
              )}
            </label>
            <Input
              placeholder={t('accountPage.sellerHolderPh')}
              value={intestatario}
              onChange={(e) => setIntestatario(e.target.value)}
              className="h-12 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              {t('accountPage.sellerIban')}
            </label>
            <Input
              placeholder={t('accountPage.sellerIbanPh')}
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="h-12 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              {t('accountPage.sellerBic')}
            </label>
            <Input
              placeholder={t('accountPage.sellerBicPh')}
              value={bic}
              onChange={(e) => setBic(e.target.value)}
              className="h-12 rounded-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              {t('accountPage.sellerBankName')}
            </label>
            <Input
              placeholder={t('accountPage.sellerBankNamePh')}
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
            {t('accountPage.sellerConfirmSend')}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold uppercase text-gray-900">
          {t('accountPage.sellerTransferTitle')}
        </h2>
        <p className="text-gray-700">{t('accountPage.sellerTransferText')}</p>
        <p className="text-sm font-medium text-gray-900">
          {t('accountPage.sellerAttemptsLeft', { count: TENTATIVI_RIMASTI })}
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              {t('accountPage.sellerAmount1')}
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
              {t('accountPage.sellerAmount2')}
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
            {t('accountPage.sellerConfirmActivate')}
          </Button>
        </div>
      </section>
    </div>
  );
}

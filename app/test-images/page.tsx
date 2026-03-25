'use client';

/**
 * Pagina di debug per testare il caricamento immagini da CloudFront/S3.
 * Combina Base URL + filename e mostra successo (bordo verde + dimensioni) o errore con causa (404/403/CORS).
 */

import { useState, useCallback } from 'react';

const DEFAULT_BASE_URL = 'https://di0y87a9s8da9.cloudfront.net';
const MOCK_FILES = [
  'cards/4/158647.webp',
  'cards/7/219679.webp',
  'mowgli-test.webp',
  'card-back.webp',
  'black-lotus.webp',
  'default.webp',
];

function buildImageUrl(base: string, filename: string): string {
  const baseClean = (base || '').trim().replace(/\/+$/, '');
  const path = (filename || '').trim().replace(/^\/+/, '');
  if (!baseClean) return path ? `/${path}` : '';
  return path ? `${baseClean}/${path}` : baseClean;
}

export default function TestImagesPage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [filename, setFilename] = useState('black-lotus.webp');
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkImage = useCallback((url: string) => {
    const img = new Image();
    img.onload = () => {
      setStatus('ok');
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setErrorMessage(null);
    };
    img.onerror = () => {
      setStatus('error');
      setDimensions(null);
      setErrorMessage('Immagine non caricata. Apri l’URL in nuova scheda per vedere la risposta del server.');
    };
    img.src = url;
  }, []);

  const runTest = useCallback(
    (url: string) => {
      if (!url) {
        setStatus('idle');
        setTestUrl(null);
        setHttpStatus(null);
        setDimensions(null);
        setErrorMessage(null);
        return;
      }
      setTestUrl(url);
      setStatus('loading');
      setHttpStatus(null);
      setDimensions(null);
      setErrorMessage(null);

      fetch(url, { method: 'HEAD', mode: 'cors' })
        .then((res) => {
          setHttpStatus(res.status);
          if (res.ok) {
            checkImage(url);
          } else {
            setStatus('error');
            setErrorMessage(
              res.status === 404
                ? '404 Not Found – File non trovato in S3. Verifica che l’oggetto esista con questa chiave (es. black-lotus.webp o mtg/black-lotus.webp).'
                : res.status === 403
                  ? '403 Forbidden – Accesso negato. Verifica policy S3 e OAC CloudFront.'
                  : `Errore HTTP ${res.status}. Apri l’URL in nuova scheda per i dettagli.`
            );
          }
        })
        .catch(() => {
          setHttpStatus(null);
          setStatus('error');
          setErrorMessage(
            'Impossibile leggere lo status HTTP (CORS non configurato o rete). Apri l’URL in nuova scheda per vedere 403/404. Verifica che il file esista in S3 con la chiave corretta.'
          );
          const img = new Image();
          img.onload = () => {
            setStatus('ok');
            setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            setErrorMessage(null);
          };
          img.onerror = () =>
            setErrorMessage(
              (prev) => prev ?? 'Immagine non caricata (404/403). Apri l’URL in nuova scheda.'
            );
          img.src = url;
        });
    },
    [checkImage]
  );

  const handleTestImage = () => {
    const url = buildImageUrl(baseUrl, filename);
    runTest(url);
  };

  const handleMockClick = (mockFilename: string) => {
    setFilename(mockFilename);
    const url = buildImageUrl(baseUrl, mockFilename);
    runTest(url);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-gray-800">Test immagini CDN / CloudFront</h1>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="https://....cloudfront.net"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Image Filename</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="black-lotus.webp"
          />
        </div>

        <button
          type="button"
          onClick={handleTestImage}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
        >
          Test Image
        </button>

        {/* Area visualizzazione */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Risultato</h2>
          {testUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-gray-500 break-all flex-1 min-w-0" title={testUrl}>
                URL: {testUrl}
              </p>
              <a
                href={testUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Apri in nuova scheda
              </a>
            </div>
          )}
          {httpStatus != null && (
            <p className="text-xs text-gray-600">Status HTTP: {httpStatus}</p>
          )}
          <div
            className={`min-h-[200px] rounded border-2 flex items-center justify-center bg-white ${
              status === 'ok'
                ? 'border-green-500'
                : status === 'error'
                  ? 'border-red-500'
                  : 'border-gray-200'
            }`}
          >
            {status === 'loading' && <p className="text-gray-500 text-sm">Caricamento...</p>}
            {status === 'ok' && testUrl && (
              <div className="p-2 text-center">
                <img
                  src={testUrl}
                  alt="Test"
                  className="max-w-full max-h-[400px] object-contain mx-auto"
                />
                {dimensions && (
                  <p className="text-sm text-green-700 mt-2">
                    Dimensioni: {dimensions.width} × {dimensions.height} px
                  </p>
                )}
              </div>
            )}
            {status === 'error' && (
              <p className="text-red-600 text-sm px-4 text-center">{errorMessage}</p>
            )}
            {status === 'idle' && testUrl === null && (
              <p className="text-gray-400 text-sm">Clicca &quot;Test Image&quot; per provare.</p>
            )}
          </div>
        </div>

        {/* Griglia mock */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Griglia mock (clic per testare)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MOCK_FILES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleMockClick(name)}
                className="px-3 py-2 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 text-left truncate"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="border border-amber-200 bg-amber-50 rounded p-4 text-sm text-gray-700 space-y-2">
          <h2 className="font-medium text-gray-800">Se l’immagine non carica</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>404</strong> – Il file non esiste in S3 con quella chiave. Carica l’oggetto nel bucket (es. <code className="bg-amber-100 px-1 rounded">black-lotus.webp</code> o <code className="bg-amber-100 px-1 rounded">mtg/black-lotus.webp</code>).
            </li>
            <li>
              <strong>403</strong> – Accesso negato. Con Terraform OAC solo CloudFront può leggere S3; l’URL deve essere quello CloudFront (non S3 diretto). Verifica <code className="bg-amber-100 px-1 rounded">aws_s3_bucket_policy.allow_cloudfront</code> e OAC.
            </li>
            <li>
              <strong>CORS</strong> – Se vedi “Impossibile leggere lo status HTTP”, il fetch è bloccato. Usa “Apri in nuova scheda”: se vedi XML con 403/404 la causa è quella; per vedere lo status in questa pagina aggiungi CORS su S3 e su CloudFront (cache behavior).
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

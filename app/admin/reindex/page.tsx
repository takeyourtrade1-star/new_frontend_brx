'use client';

/**
 * Pagina admin per avviare il reindex Meilisearch.
 * Chiama il Search Engine direttamente dal browser (come la barra di ricerca con Meilisearch).
 * Richiede l'header X-Admin-API-Key (chiave inserita nel campo).
 * Sul Search Engine (AWS) deve essere impostato CORS_ORIGINS con l'origine del frontend (es. http://localhost:3000).
 */

import { useState } from 'react';
import { SEARCH_ADMIN_API_URL } from '@/lib/config';

function getReindexUrl(): string {
  const base = (SEARCH_ADMIN_API_URL || '').replace(/\/+$/, '');
  return base ? `${base}/api/admin/reindex` : '';
}

async function handleReindex(adminKey: string): Promise<{ ok: boolean; message: string }> {
  const key = adminKey.trim();
  if (!key) {
    return { ok: false, message: 'Inserisci la chiave Admin.' };
  }
  const url = getReindexUrl();
  if (!url) {
    return {
      ok: false,
      message: 'NEXT_PUBLIC_SEARCH_API_URL (o VITE_SEARCH_API_URL) non impostato nel .env.',
    };
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-API-Key': key },
    });
    const data = await response.json().catch(() => ({}));
    const msg = (data?.error ?? data?.message ?? data?.detail ?? '').trim();
    if (response.status === 202) {
      return { ok: true, message: 'Indicizzazione partita con successo! Controlla i log sul server.' };
    }
    if (response.status === 403) {
      return { ok: false, message: msg || 'Chiave Admin non valida.' };
    }
    return { ok: false, message: msg || `Errore ${response.status}.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Richiesta fallita: ${msg}. Verifica che il Search Engine sia raggiungibile e che CORS_ORIGINS includa questa origine (es. http://localhost:3000).`,
    };
  }
}

export default function AdminReindexPage() {
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setResult({ ok: false, message: 'Inserisci la chiave Admin.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await handleReindex(adminKey);
      setResult(res);
      if (res.ok) setAdminKey('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Reindicizzazione catalogo</h1>
        <p className="text-sm text-gray-600 mb-4">
          Avvia il reindex totale su Meilisearch. Richiede la chiave admin (header X-Admin-API-Key).
          Nessun login: inserisci la chiave e clicca &quot;Indica&quot;.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-key" className="block text-sm font-medium text-gray-700 mb-1">
              Chiave Admin (X-Admin-API-Key)
            </label>
            <input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Inserisci la chiave"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Avvio in corso...' : 'Indica'}
          </button>
        </form>
        {result && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {result.message}
          </div>
        )}
        <p className="mt-4 text-gray-500 text-xs">
          La richiesta va direttamente al Search Engine (come la barra di ricerca). Nel .env serve{' '}
          <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SEARCH_API_URL</code> (es. http://35.152.141.53:8001). Sul server Search (AWS) imposta{' '}
          <code className="bg-gray-100 px-1 rounded">CORS_ORIGINS</code>=http://localhost:3000 (o l’URL del frontend).
        </p>
      </div>
    </main>
  );
}

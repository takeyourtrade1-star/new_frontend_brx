'use client';

import { useEffect, useState } from 'react';
import { AuctionMobilePairingUpload } from './AuctionMobilePairingUpload';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,256}$/;

type PairingCredentials = { sessionId: string; uploadToken: string };

export function GuestPhotoPairingEntry({
  context,
  helpText,
}: {
  context: 'auction' | 'listing';
  helpText: string;
}) {
  const [credentials, setCredentials] = useState<PairingCredentials | null | undefined>(undefined);

  useEffect(() => {
    // Capabilities live in the fragment: fragments are not sent in HTTP
    // requests, access logs or Referer headers. Remove it immediately after use.
    const params = new URLSearchParams(window.location.hash.replace(/^#\??/, ''));
    const sessionId = params.get('sid')?.trim() ?? '';
    const uploadToken = params.get('t')?.trim() ?? '';
    window.history.replaceState(null, '', window.location.pathname);
    setCredentials(
      UUID_RE.test(sessionId) && TOKEN_RE.test(uploadToken)
        ? { sessionId, uploadToken }
        : null,
    );
  }, []);

  if (credentials === undefined) {
    return <main className="min-h-dvh bg-white" aria-busy="true" />;
  }

  if (!credentials) {
    return (
      <main className="min-h-dvh bg-white px-4 py-10">
        <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
          <h1 className="font-semibold">Link non valido o scaduto</h1>
          <p className="mt-2 text-amber-900/90">{helpText}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <AuctionMobilePairingUpload
        sessionId={credentials.sessionId}
        uploadToken={credentials.uploadToken}
        context={context}
      />
    </main>
  );
}

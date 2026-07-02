'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

const TEST_DELAY_SECONDS = 60;

type PushTestStatus = 'idle' | 'working' | 'scheduled' | 'sent' | 'error';

type PushErrorKey =
  | 'push.errorUnsupported'
  | 'push.errorPermission'
  | 'push.errorNoSw'
  | 'push.errorGeneric';

/** Converte la chiave VAPID pubblica (base64url) nel formato richiesto da subscribe(). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function sameKey(existing: ArrayBuffer | null, expected: Uint8Array): boolean {
  if (!existing) return false;
  const bytes = new Uint8Array(existing);
  if (bytes.length !== expected.length) return false;
  return bytes.every((b, i) => b === expected[i]);
}

/**
 * Bottone di prova per le notifiche Web Push della PWA: chiede il permesso,
 * registra la subscription e chiede al server di inviare una push dopo 60s
 * (arriva anche con l'app in background/chiusa).
 * Su iOS funziona solo con l'app installata in Home (iOS 16.4+).
 */
export function PushTestButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PushTestStatus>('idle');
  const [errorKey, setErrorKey] = useState<PushErrorKey>('push.errorGeneric');

  const fail = (key: PushErrorKey) => {
    setErrorKey(key);
    setStatus('error');
  };

  const handleClick = async () => {
    if (status === 'working' || status === 'scheduled') return;
    setStatus('working');

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      fail('push.errorGeneric');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      fail('push.errorUnsupported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        fail('push.errorPermission');
        return;
      }

      // In dev il service worker Serwist è disabilitato: serve la build di produzione.
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration || !registration.active) {
        fail('push.errorNoSw');
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      let subscription = await registration.pushManager.getSubscription();
      if (subscription && !sameKey(subscription.options.applicationServerKey, applicationServerKey)) {
        // Subscription creata con una chiave VAPID diversa: va rifatta.
        await subscription.unsubscribe();
        subscription = null;
      }
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
      }

      // Da qui la notifica è in mano al server: l'utente può chiudere l'app.
      setStatus('scheduled');

      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          delaySeconds: TEST_DELAY_SECONDS,
        }),
      });
      if (!res.ok) {
        fail('push.errorGeneric');
        return;
      }
      setStatus('sent');
    } catch (err) {
      console.error('[push test] errore:', err);
      fail('push.errorGeneric');
    }
  };

  const statusMessage =
    status === 'scheduled'
      ? t('push.scheduled')
      : status === 'sent'
        ? t('push.sent')
        : status === 'error'
          ? t(errorKey)
          : null;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'working'}
        className={cn(className, 'w-full text-left disabled:cursor-wait disabled:opacity-60')}
      >
        <Bell
          className={cn(
            'h-6 w-6 shrink-0',
            status === 'scheduled' || status === 'sent' ? 'text-[#FF7300]' : 'text-gray-400'
          )}
          strokeWidth={1.5}
          aria-hidden
        />
        {t('push.testButton')}
      </button>
      {statusMessage && (
        <p
          className={cn(
            'px-5 pb-2 pl-[60px] text-[11px] leading-snug',
            status === 'error' ? 'text-red-500' : 'text-[#FF7300]'
          )}
          role="status"
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}

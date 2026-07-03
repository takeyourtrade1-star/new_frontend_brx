'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

const TEST_DELAY_SECONDS = 10;

type PushTestStatus = 'idle' | 'working' | 'scheduled' | 'sent' | 'error';

type PushErrorKey =
  | 'push.errorUnsupported'
  | 'push.errorPermission'
  | 'push.errorNoSw'
  | 'push.errorGeneric';

/**
 * Bottone di prova per le notifiche della PWA: chiede il permesso e mostra una
 * notifica locale via service worker dopo 10s, senza server né chiavi VAPID.
 * Il timer vive nella pagina: la notifica arriva con l'app aperta o in
 * background, non ad app chiusa (per quello serve una vera Web Push via server).
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

    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
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

      const title = t('push.notifTitle');
      const body = t('push.notifBody');
      setStatus('scheduled');
      window.setTimeout(() => {
        registration
          .showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            data: { url: '/' },
          })
          .then(() => setStatus('sent'))
          .catch((err) => {
            console.error('[push test] errore:', err);
            fail('push.errorGeneric');
          });
      }, TEST_DELAY_SECONDS * 1000);
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

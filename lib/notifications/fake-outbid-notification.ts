/**
 * TEST notifiche (fittizio): dopo che l'utente fa un'offerta su un'asta,
 * programma una notifica locale "sei stato superato" a 10 secondi, mostrata
 * dal service worker — nessun server né chiavi VAPID coinvolti.
 *
 * Stessi limiti di PushTestButton: in dev il SW Serwist è disabilitato (serve
 * la build di produzione), serve il permesso notifiche e il timer vive nella
 * pagina (app aperta o in background, non chiusa). Su iOS solo PWA installata.
 *
 * Da rimuovere quando arriveranno le vere notifiche push dal backend aste.
 */

const FAKE_OUTBID_DELAY_MS = 10_000;

const FAKE_BIDDER_NAMES = ['TizioX', 'CardShark99', 'MazzoRosso', 'LotusCollector'];

export async function scheduleFakeOutbidNotification({
  auctionId,
  auctionTitle,
}: {
  auctionId: number;
  auctionTitle: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.active) return false;

    const bidder = FAKE_BIDDER_NAMES[Math.floor(Math.random() * FAKE_BIDDER_NAMES.length)];

    window.setTimeout(() => {
      registration
        .showNotification('Sei stato superato! 🔨', {
          body: `${bidder} ha offerto di più su "${auctionTitle}". Torna a offrire!`,
          icon: '/logo.png',
          badge: '/logo.png',
          data: { url: `/aste/${auctionId}` },
        })
        .catch((err) => {
          console.warn('[fake outbid test] notifica non mostrata:', err);
        });
    }, FAKE_OUTBID_DELAY_MS);

    return true;
  } catch (err) {
    console.warn('[fake outbid test] errore:', err);
    return false;
  }
}

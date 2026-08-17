import {
  syncClient,
  type LinkCardtraderResponse,
  type SyncStartResponse,
  type WebhookUrlResponse,
} from '@/lib/api/sync-client';
import {
  getMarketplaceSyncStatus,
  type MarketplaceSyncStatus,
} from '@/lib/api/marketplace-client';

export type CardTraderFollowUp = 'webhook' | 'marketplace' | 'initial_sync';

export interface CardTraderLinkFlowResult {
  link: LinkCardtraderResponse;
  webhook: WebhookUrlResponse | null;
  marketplaceStatus: MarketplaceSyncStatus | null;
  syncStart: SyncStartResponse | null;
  followUpFailures: CardTraderFollowUp[];
}

export interface CardTraderLinkFlowDependencies {
  linkCardtrader: typeof syncClient.linkCardtrader;
  getWebhookUrl: typeof syncClient.getWebhookUrl;
  getMarketplaceSyncStatus: typeof getMarketplaceSyncStatus;
  startSync: typeof syncClient.startSync;
}

const defaultDependencies: CardTraderLinkFlowDependencies = {
  linkCardtrader: syncClient.linkCardtrader,
  getWebhookUrl: syncClient.getWebhookUrl,
  getMarketplaceSyncStatus,
  startSync: syncClient.startSync,
};

/**
 * Collega CardTrader e avvia l'import iniziale senza confondere un errore di
 * aggiornamento UI con un token rifiutato. Il link e i follow-up hanno esiti
 * separati: dopo che il backend ha salvato il token non mostriamo mai un falso
 * "collegamento fallito".
 */
export async function linkCardTraderAndStartImport(
  userId: string,
  accessToken: string,
  cardTraderToken: string,
  dependencies: CardTraderLinkFlowDependencies = defaultDependencies,
): Promise<CardTraderLinkFlowResult> {
  const link = await dependencies.linkCardtrader(
    { user_id: userId, cardtrader_token: cardTraderToken },
    accessToken,
  );

  const shouldStartImport = link.sync_status !== 'initial_sync';
  const [webhookResult, marketplaceResult, syncResult] = await Promise.allSettled([
    dependencies.getWebhookUrl(userId, accessToken),
    dependencies.getMarketplaceSyncStatus(),
    shouldStartImport
      ? dependencies.startSync(userId, accessToken)
      : Promise.resolve<SyncStartResponse | null>(null),
  ]);

  const followUpFailures: CardTraderFollowUp[] = [];
  if (webhookResult.status === 'rejected') followUpFailures.push('webhook');
  if (marketplaceResult.status === 'rejected') followUpFailures.push('marketplace');
  if (syncResult.status === 'rejected') followUpFailures.push('initial_sync');

  return {
    link,
    webhook: webhookResult.status === 'fulfilled' ? webhookResult.value : null,
    marketplaceStatus:
      marketplaceResult.status === 'fulfilled' ? marketplaceResult.value : null,
    syncStart: syncResult.status === 'fulfilled' ? syncResult.value : null,
    followUpFailures,
  };
}

/**
 * URL helpers for the guided sell flow (/vendi → catalog → product detail → VENDI tab).
 */

export const SELL_FLOW_PARAM = 'flow';
export const SELL_FLOW_VALUE = 'sell';
export const SELL_TAB_PARAM = 'tab';
export const SELL_TAB_VENDI = 'vendi';

export type SellFlowSearchParams = {
  get: (key: string) => string | null;
};

export function isSellFlow(params: SellFlowSearchParams | null | undefined): boolean {
  if (!params) return false;
  return params.get(SELL_FLOW_PARAM) === SELL_FLOW_VALUE;
}

export function shouldOpenVendiTab(params: SellFlowSearchParams | null | undefined): boolean {
  if (!params) return false;
  if (isSellFlow(params)) return true;
  const tab = params.get(SELL_TAB_PARAM)?.toLowerCase();
  return tab === SELL_TAB_VENDI || tab === 'vendi';
}

export type WithSellFlowOptions = {
  tab?: typeof SELL_TAB_VENDI;
  /** Preserve existing query params on relative paths that already include `?`. */
  preserveExisting?: boolean;
};

/**
 * Append sell-flow query params to a path (absolute within app).
 */
export function withSellFlow(href: string, options?: WithSellFlowOptions): string {
  const [pathPart, queryPart] = href.split('?');
  const params = new URLSearchParams(options?.preserveExisting !== false && queryPart ? queryPart : '');
  params.set(SELL_FLOW_PARAM, SELL_FLOW_VALUE);
  if (options?.tab === SELL_TAB_VENDI) {
    params.set(SELL_TAB_PARAM, SELL_TAB_VENDI);
  }
  const qs = params.toString();
  return qs ? `${pathPart}?${qs}` : pathPart;
}

export function getProductDetailHref(
  cardId: string,
  options?: { sellFlow?: boolean },
): string {
  const id = cardId.trim();
  if (!id) return '/products';
  const base = `/products/${encodeURIComponent(id)}`;
  if (options?.sellFlow) {
    return withSellFlow(base, { tab: SELL_TAB_VENDI });
  }
  return base;
}

/** Catalog / vendi entry paths with sell flow active. */
export function getVendiCatalogHref(path: string): string {
  return withSellFlow(path);
}

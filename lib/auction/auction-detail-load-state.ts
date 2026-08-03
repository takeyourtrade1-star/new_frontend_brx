export type AuctionDetailLoadState = 'loading' | 'error' | 'ready';

export function resolveAuctionDetailLoadState(options: {
  hasDetail: boolean;
  isLoading: boolean;
  isError: boolean;
  isValidAuctionId: boolean;
}): AuctionDetailLoadState {
  if (options.hasDetail) return 'ready';
  if (options.isError || !options.isValidAuctionId) return 'error';
  return options.isLoading ? 'loading' : 'error';
}

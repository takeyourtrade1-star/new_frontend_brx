export const auctionCreateKeys = {
  all: ['auction-create'] as const,
  pickerInventory: (userId: string) =>
    [...auctionCreateKeys.all, 'picker-inventory', userId] as const,
};

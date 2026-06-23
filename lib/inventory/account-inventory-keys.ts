export const accountInventoryKeys = {
  all: ['account-inventory'] as const,
  raw: (userId: string) => [...accountInventoryKeys.all, 'raw', userId] as const,
};

type ProxyArea = 'auctions' | 'orders' | 'disputes' | 'notifications' | 'saved-auctions';

type Rule = {
  methods: readonly string[];
  pattern: RegExp;
  public?: boolean;
};

const SEGMENT = '[A-Za-z0-9_%.-]{1,128}';
const ID = '\\d{1,18}';
const UUID = '[0-9a-fA-F-]{36}';

const RULES: Record<ProxyArea, readonly Rule[]> = {
  auctions: [
    { methods: ['GET'], pattern: new RegExp(`^${SEGMENT}$`), public: true },
    { methods: ['GET'], pattern: new RegExp(`^${SEGMENT}/(?:bids|minimum-bid)$`), public: true },
    { methods: ['POST'], pattern: new RegExp(`^${SEGMENT}/bids$`) },
    { methods: ['PATCH', 'DELETE'], pattern: new RegExp(`^${SEGMENT}$`) },
    { methods: ['PATCH', 'DELETE'], pattern: new RegExp(`^${SEGMENT}/proxy-limit$`) },
    { methods: ['POST'], pattern: /^photos\/(?:init|finalize|pairing-sessions|attach-listing)$/ },
    { methods: ['GET'], pattern: new RegExp(`^photos/pairing-sessions/${UUID}$`) },
    { methods: ['DELETE'], pattern: new RegExp(`^photos/pairing-sessions/${UUID}$`) },
    { methods: ['DELETE'], pattern: new RegExp(`^photos/${ID}$`) },
    { methods: ['GET'], pattern: new RegExp(`^photos/by-listing/${SEGMENT}$`), public: true },
    { methods: ['GET'], pattern: /^photos\/by-listings$/, public: true },
  ],
  orders: [
    { methods: ['GET'], pattern: /^(?:buyer|seller)$/ },
    { methods: ['GET'], pattern: new RegExp(`^${ID}(?:/history)?$`) },
  ],
  disputes: [
    { methods: ['GET'], pattern: new RegExp(`^${ID}$`) },
    { methods: ['GET', 'POST'], pattern: new RegExp(`^orders/${ID}/open$`) },
    { methods: ['GET', 'POST'], pattern: new RegExp(`^${ID}/messages$`) },
    { methods: ['POST'], pattern: new RegExp(`^${ID}/resolve/(?:reassign|cancel)$`) },
    { methods: ['POST'], pattern: new RegExp(`^${ID}/ws-ticket$`) },
  ],
  notifications: [
    { methods: ['GET'], pattern: /^unread-count$/ },
    { methods: ['PATCH'], pattern: /^read-all$/ },
    { methods: ['PATCH'], pattern: new RegExp(`^${ID}/read$`) },
  ],
  'saved-auctions': [
    { methods: ['GET'], pattern: /^me$/ },
    { methods: ['GET'], pattern: new RegExp(`^me/${ID}$`) },
    { methods: ['POST', 'DELETE'], pattern: new RegExp(`^${ID}$`) },
  ],
};

export function isAllowedAuctionProxyPath(
  area: ProxyArea,
  method: string,
  normalizedPath: string,
): boolean {
  return RULES[area].some(
    (rule) => rule.methods.includes(method.toUpperCase()) && rule.pattern.test(normalizedPath),
  );
}

export function isPublicAuctionProxyGet(normalizedPath: string): boolean {
  return RULES.auctions.some(
    (rule) => rule.public === true && rule.methods.includes('GET') && rule.pattern.test(normalizedPath),
  );
}

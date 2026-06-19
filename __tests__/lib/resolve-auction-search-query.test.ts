import { describe, expect, it } from 'vitest';

import { auctionMatchesSearchTerms } from '@/lib/auction/resolve-auction-search-query';

type AuctionLike = {
  title: string;
  setName?: string | null;
  seller: string;
  sellerDisplayName?: string;
};

const alphaLotus: AuctionLike = {
  title: 'Black Lotus — Limited Edition Alpha',
  setName: 'Limited Edition Alpha',
  seller: 'vend1-uuid',
  sellerDisplayName: 'CardMaster',
};
const betaLotus: AuctionLike = {
  title: 'Black Lotus — Limited Edition Beta',
  setName: 'Limited Edition Beta',
  seller: 'vend2-uuid',
  sellerDisplayName: 'CardPro',
};
const alphaBolt: AuctionLike = {
  title: 'Lightning Bolt — Limited Edition Alpha',
  setName: 'Limited Edition Alpha',
  seller: 'vend3-uuid',
  sellerDisplayName: 'BoltSeller',
};
const unlimitedLotus: AuctionLike = {
  title: 'Black Lotus — Unlimited Edition',
  setName: 'Unlimited Edition',
  seller: 'vend4-uuid',
  sellerDisplayName: 'UnlimitedShop',
};

const MATCH_TERMS_LOTUS = ['Black Lotus'];
const MATCH_TERMS_LOTUS_IT = ['Black Lotus', 'Loto Nero'];

describe('auctionMatchesSearchTerms — filtro edizione', () => {
  it('"black lotus alpha" mostra solo Alpha (non Beta)', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, MATCH_TERMS_LOTUS, 'black lotus alpha')).toBe(true);
    expect(auctionMatchesSearchTerms(betaLotus, MATCH_TERMS_LOTUS, 'black lotus alpha')).toBe(false);
  });

  it('"black lotus beta" mostra solo Beta', () => {
    expect(auctionMatchesSearchTerms(betaLotus, MATCH_TERMS_LOTUS, 'black lotus beta')).toBe(true);
    expect(auctionMatchesSearchTerms(alphaLotus, MATCH_TERMS_LOTUS, 'black lotus beta')).toBe(false);
  });

  it('"black lotus alpha" filtra Unlimited', () => {
    expect(auctionMatchesSearchTerms(unlimitedLotus, MATCH_TERMS_LOTUS, 'black lotus alpha')).toBe(false);
  });

  it('"black lotus" (senza edizione) mostra tutte le edizioni', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, MATCH_TERMS_LOTUS, 'black lotus')).toBe(true);
    expect(auctionMatchesSearchTerms(betaLotus, MATCH_TERMS_LOTUS, 'black lotus')).toBe(true);
    expect(auctionMatchesSearchTerms(unlimitedLotus, MATCH_TERMS_LOTUS, 'black lotus')).toBe(true);
  });

  it('"alpha" da solo mostra tutte le aste Alpha (qualsiasi carta)', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, MATCH_TERMS_LOTUS, 'alpha')).toBe(true);
    expect(auctionMatchesSearchTerms(alphaBolt, MATCH_TERMS_LOTUS, 'alpha')).toBe(true);
    expect(auctionMatchesSearchTerms(betaLotus, MATCH_TERMS_LOTUS, 'alpha')).toBe(false);
  });

  it('nome localizzato IT "loto nero" matcha Black Lotus Alpha', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, MATCH_TERMS_LOTUS_IT, 'loto nero')).toBe(true);
    expect(auctionMatchesSearchTerms(alphaBolt, MATCH_TERMS_LOTUS_IT, 'loto nero')).toBe(false);
  });

  it('match sul venditore (sellerDisplayName)', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, MATCH_TERMS_LOTUS, 'CardMaster')).toBe(true);
    expect(auctionMatchesSearchTerms(betaLotus, MATCH_TERMS_LOTUS, 'CardMaster')).toBe(false);
  });

  it('query vuota + matchTerms vuoti = mostra tutto', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, [], '')).toBe(true);
  });
});

describe('auctionMatchesSearchTerms — fallback (matchTerms vuoti, Meilisearch down)', () => {
  it('"black lotus alpha" usa token-AND: Alpha ok, Beta filtrato', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, [], 'black lotus alpha')).toBe(true);
    expect(auctionMatchesSearchTerms(betaLotus, [], 'black lotus alpha')).toBe(false);
  });

  it('"alpha" da solo matcha per titolo/set', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, [], 'alpha')).toBe(true);
    expect(auctionMatchesSearchTerms(betaLotus, [], 'alpha')).toBe(false);
  });

  it('seller match senza matchTerms', () => {
    expect(auctionMatchesSearchTerms(alphaLotus, [], 'CardMaster')).toBe(true);
    expect(auctionMatchesSearchTerms(betaLotus, [], 'CardMaster')).toBe(false);
  });
});

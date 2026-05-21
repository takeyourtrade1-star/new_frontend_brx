import { describe, it, expect, vi } from 'vitest';
import {
  buildFilterFallbackChain,
  buildReprintSearchStrategies,
  dedupeReprintHits,
  escapeMeiliFilterValue,
  fetchReprintsForCard,
  isValidReprintCardId,
  resolveReprintGameSlug,
} from '@/lib/reprints-search';

describe('isValidReprintCardId', () => {
  it('accepts mtg/op/pk print ids', () => {
    expect(isValidReprintCardId('mtg_40679')).toBe(true);
    expect(isValidReprintCardId('op_12')).toBe(true);
    expect(isValidReprintCardId('pk_99')).toBe(true);
  });

  it('rejects sealed and malformed ids', () => {
    expect(isValidReprintCardId('sealed_10')).toBe(false);
    expect(isValidReprintCardId('mtg_abc')).toBe(false);
    expect(isValidReprintCardId('')).toBe(false);
  });
});

describe('resolveReprintGameSlug', () => {
  it('does not map op to one-piece', () => {
    expect(resolveReprintGameSlug('op')).toBe('op');
    expect(resolveReprintGameSlug('  mtg ')).toBe('mtg');
  });
});

describe('escapeMeiliFilterValue', () => {
  it('escapes quotes and backslashes', () => {
    expect(escapeMeiliFilterValue('a"b\\c')).toBe('a\\"b\\\\c');
  });
});

describe('buildFilterFallbackChain', () => {
  it('progressively drops entity and category filters', () => {
    const filters = [
      'game_slug = "mtg"',
      'category_id = 1',
      'oracle_id = "uuid-1"',
    ];
    const chain = buildFilterFallbackChain(filters);
    expect(chain[0]).toContain('oracle_id');
    expect(chain[1]).not.toContain('oracle_id');
    expect(chain[chain.length - 1]).toBe('game_slug = "mtg"');
  });
});

describe('buildReprintSearchStrategies', () => {
  it('prefers oracle_id then card_id then name', () => {
    const strategies = buildReprintSearchStrategies({
      name: 'Lightning Bolt',
      game_slug: 'mtg',
      category_id: 1,
      oracle_id: 'oracle-uuid',
      card_id: null,
    });
    expect(strategies[0].filters.join(' ')).toContain('oracle_id');
    expect(strategies[0].serverEntityFilter).toBe(true);
  });

  it('uses card_id for OP when oracle_id absent', () => {
    const strategies = buildReprintSearchStrategies({
      name: 'Luffy',
      game_slug: 'op',
      category_id: 1,
      oracle_id: null,
      card_id: '42',
    });
    expect(strategies[0].filters.join(' ')).toContain('card_id = "42"');
  });
});

describe('dedupeReprintHits', () => {
  it('keeps first occurrence per id', () => {
    const hits = dedupeReprintHits([
      { id: 'mtg_1', set_name: 'A' },
      { id: 'mtg_1', set_name: 'B' },
      { id: 'mtg_2', set_name: 'C' },
    ]);
    expect(hits).toHaveLength(2);
    expect(hits[0].set_name).toBe('A');
  });
});

describe('fetchReprintsForCard', () => {
  it('excludes current card and dedupes results', async () => {
    const search = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      hits: [
        { id: 'mtg_1', name: 'Bolt', set_name: 'Alpha', oracle_id: 'o1' },
        { id: 'mtg_1', name: 'Bolt', set_name: 'Alpha dup' },
        { id: 'mtg_2', name: 'Bolt', set_name: 'Beta', oracle_id: 'o1' },
        { id: 'mtg_99', name: 'Bolt', set_name: 'Current', oracle_id: 'o1' },
      ],
    });

    const hits = await fetchReprintsForCard(
      {
        id: 'mtg_99',
        name: 'Bolt',
        game_slug: 'mtg',
        category_id: 1,
        oracle_id: 'o1',
        card_id: null,
      },
      search
    );

    expect(hits.map((h) => h.id).sort()).toEqual(['mtg_1', 'mtg_2']);
    expect(search).toHaveBeenCalled();
  });

  it('tries next filter on 400 without looping pages', async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 400, hits: [] })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        hits: [{ id: 'mtg_2', name: 'Bolt', set_name: 'Beta' }],
      });

    const hits = await fetchReprintsForCard(
      {
        id: 'mtg_99',
        name: 'Bolt',
        game_slug: 'mtg',
        category_id: 1,
        oracle_id: 'o1',
        card_id: null,
      },
      search
    );

    expect(hits).toHaveLength(1);
    expect(search.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty when card metadata incomplete', async () => {
    const search = vi.fn();
    const hits = await fetchReprintsForCard(
      { id: '', name: 'X', game_slug: 'mtg', category_id: 1, oracle_id: null, card_id: null },
      search
    );
    expect(hits).toEqual([]);
    expect(search).not.toHaveBeenCalled();
  });
});

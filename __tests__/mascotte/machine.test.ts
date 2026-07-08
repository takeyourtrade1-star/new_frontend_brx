import { describe, expect, it } from 'vitest';
import {
  ASSO_INITIAL_STATE,
  assoReducer,
  deriveExpression,
  isOverlayVisible,
  type AssoMachineState,
} from '@/components/mascotte/machine';

function run(...events: Parameters<typeof assoReducer>[1][]): AssoMachineState {
  return events.reduce(assoReducer, ASSO_INITIAL_STATE);
}

describe('assoReducer', () => {
  it('OPEN_CHAT apre la chat e resetta flip/sonno', () => {
    const state = run({ type: 'SET_FLIPPED', flipped: true }, { type: 'OPEN_CHAT' });
    expect(state.panel).toBe('chat');
    expect(state.flipped).toBe(false);
    expect(state.sleeping).toBe(false);
  });

  it('flusso bug: chat → transizione coding → modale → submit → chiusura', () => {
    let state = run({ type: 'OPEN_CHAT' }, { type: 'START_BUG_TRANSITION' });
    expect(state.panel).toBe('none');
    expect(state.codingTransition).toBe(true);
    expect(state.codingCompanion).toBe(true);

    state = assoReducer(state, { type: 'BUG_MODAL_READY' });
    expect(state.panel).toBe('bug');
    expect(state.codingTransition).toBe(false);

    state = assoReducer(state, { type: 'BUG_SUBMITTED' });
    expect(state.codingStatus).toBe('received');

    state = assoReducer(state, { type: 'CLOSE_BUG' });
    expect(state.panel).toBe('none');
    expect(state.codingCompanion).toBe(false);
    expect(state.codingStatus).toBe('compiling');
  });

  it('SLEEP parte solo in idle puro', () => {
    expect(run({ type: 'OPEN_CHAT' }, { type: 'SLEEP' }).sleeping).toBe(false);
    expect(run({ type: 'SET_FLIPPED', flipped: true }, { type: 'SLEEP' }).sleeping).toBe(false);
    expect(run({ type: 'SET_EXTERNAL_MODAL', open: true }, { type: 'SLEEP' }).sleeping).toBe(false);
    expect(run({ type: 'SLEEP' }).sleeping).toBe(true);
  });

  it('WAKE è un no-op referenziale se già sveglio (nessun re-render)', () => {
    const state = run({ type: 'SET_FLIPPED', flipped: true });
    expect(assoReducer(state, { type: 'WAKE' })).toBe(state);
  });

  it('TOGGLE_WARDROBE apre/chiude e riporta al fronte', () => {
    let state = run({ type: 'SET_FLIPPED', flipped: true }, { type: 'TOGGLE_WARDROBE' });
    expect(state.panel).toBe('wardrobe');
    expect(state.flipped).toBe(false);
    state = assoReducer(state, { type: 'TOGGLE_WARDROBE' });
    expect(state.panel).toBe('none');
  });

  it('modale esterna sveglia Asso e risulta overlay', () => {
    const state = run({ type: 'SLEEP' }, { type: 'SET_EXTERNAL_MODAL', open: true });
    expect(state.sleeping).toBe(false);
    expect(isOverlayVisible(state)).toBe(true);
  });
});

describe('deriveExpression', () => {
  it('catena di priorità: sleep > coding > bug(focus) > chat > normal', () => {
    expect(deriveExpression(ASSO_INITIAL_STATE)).toBe('normal');
    expect(deriveExpression(run({ type: 'SLEEP' }))).toBe('sleeping');
    expect(deriveExpression(run({ type: 'START_BUG_TRANSITION' }))).toBe('bugReport');
    expect(deriveExpression(run({ type: 'OPEN_BUG_DIRECT' }))).toBe('bugReport');
    expect(deriveExpression(run(
      { type: 'OPEN_BUG_DIRECT' },
      { type: 'SET_BUG_FORM_FOCUSED', focused: true },
    ))).toBe('bugFocus');
    expect(deriveExpression(run({ type: 'OPEN_CHAT' }))).toBe('wink');
  });
});

// Stato centrale della mascotte Asso (PLAN/13.1).
// Un solo reducer al posto dei ~45 useState del vecchio CardMascotte: gli stati
// mutuamente esclusivi (pannelli, sonno, flip, mini) vivono qui; gli effetti
// effimeri (particelle, tilt, sparkles) restano locali nei componenti foglia.

export type AssoPanel = 'none' | 'chat' | 'bug' | 'wardrobe';

export interface AssoMachineState {
  /** Pannello aperto (mutuamente esclusivi). */
  panel: AssoPanel;
  /** Transizione "coding" tra chat e modale bug. */
  codingTransition: boolean;
  /** Companion PC visibile accanto alla card durante il flusso bug. */
  codingCompanion: boolean;
  codingStatus: 'compiling' | 'received';
  /** Carta girata sul retro. */
  flipped: boolean;
  /** Sonno dopo inattività. */
  sleeping: boolean;
  /** Modalità mini (scale 0.3). */
  mini: boolean;
  /** Modale esterna (es. offerta asta) che nasconde Asso. */
  externalModalOpen: boolean;
  /** Campo del form bug con focus (espressione bugFocus). */
  bugFormFocused: boolean;
  /** Auto-scontro in corso: Asso si sdoppia e combatte contro di sé. */
  fighting: boolean;
}

export const ASSO_INITIAL_STATE: AssoMachineState = {
  panel: 'none',
  codingTransition: false,
  codingCompanion: false,
  codingStatus: 'compiling',
  flipped: false,
  sleeping: false,
  mini: false,
  externalModalOpen: false,
  bugFormFocused: false,
  fighting: false,
};

export type AssoMachineEvent =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'START_BUG_TRANSITION' } // chat → companion coding
  | { type: 'BUG_MODAL_READY' }      // fine transizione → modale bug
  | { type: 'OPEN_BUG_DIRECT' }      // da promo bubble, senza chat
  | { type: 'BUG_SUBMITTED' }
  | { type: 'CLOSE_BUG' }
  | { type: 'TOGGLE_WARDROBE' }
  | { type: 'CLOSE_WARDROBE' }
  | { type: 'SET_FLIPPED'; flipped: boolean }
  | { type: 'SLEEP' }
  | { type: 'WAKE' }
  | { type: 'TOGGLE_MINI' }
  | { type: 'SET_MINI'; mini: boolean }
  | { type: 'SET_EXTERNAL_MODAL'; open: boolean }
  | { type: 'SET_BUG_FORM_FOCUSED'; focused: boolean }
  | { type: 'START_FIGHT' }
  | { type: 'END_FIGHT' }
  | { type: 'CLOSE_ALL' };

export function assoReducer(state: AssoMachineState, event: AssoMachineEvent): AssoMachineState {
  switch (event.type) {
    case 'OPEN_CHAT':
      return {
        ...state,
        panel: 'chat',
        flipped: false,
        sleeping: false,
        codingTransition: false,
        codingCompanion: false,
        codingStatus: 'compiling',
      };
    case 'CLOSE_CHAT':
      return state.panel === 'chat' ? { ...state, panel: 'none' } : state;
    case 'START_BUG_TRANSITION':
      return {
        ...state,
        panel: 'none',
        codingTransition: true,
        codingCompanion: true,
        codingStatus: 'compiling',
      };
    case 'BUG_MODAL_READY':
      return { ...state, panel: 'bug', codingTransition: false };
    case 'OPEN_BUG_DIRECT':
      return {
        ...state,
        panel: 'bug',
        flipped: false,
        sleeping: false,
        codingTransition: false,
        codingCompanion: true,
        codingStatus: 'compiling',
      };
    case 'BUG_SUBMITTED':
      return { ...state, codingStatus: 'received' };
    case 'CLOSE_BUG':
      return {
        ...state,
        panel: state.panel === 'bug' ? 'none' : state.panel,
        codingTransition: false,
        codingCompanion: false,
        codingStatus: 'compiling',
        bugFormFocused: false,
      };
    case 'TOGGLE_WARDROBE':
      return {
        ...state,
        panel: state.panel === 'wardrobe' ? 'none' : 'wardrobe',
        flipped: false,
        sleeping: false,
      };
    case 'CLOSE_WARDROBE':
      return state.panel === 'wardrobe' ? { ...state, panel: 'none' } : state;
    case 'SET_FLIPPED':
      return { ...state, flipped: event.flipped, sleeping: false };
    case 'SLEEP':
      // Il sonno parte solo in idle puro: nessun pannello, non flipped.
      if (state.panel !== 'none' || state.flipped || state.externalModalOpen || state.fighting) return state;
      return { ...state, sleeping: true };
    case 'WAKE':
      return state.sleeping ? { ...state, sleeping: false } : state;
    case 'TOGGLE_MINI':
      return { ...state, mini: !state.mini };
    case 'SET_MINI':
      return { ...state, mini: event.mini };
    case 'SET_EXTERNAL_MODAL':
      return { ...state, externalModalOpen: event.open, sleeping: event.open ? false : state.sleeping };
    case 'SET_BUG_FORM_FOCUSED':
      return { ...state, bugFormFocused: event.focused };
    case 'START_FIGHT':
      if (state.panel !== 'none' || state.flipped) return state;
      return { ...state, fighting: true, sleeping: false };
    case 'END_FIGHT':
      return state.fighting ? { ...state, fighting: false } : state;
    case 'CLOSE_ALL':
      return {
        ...state,
        panel: 'none',
        codingTransition: false,
        codingCompanion: false,
        codingStatus: 'compiling',
        flipped: false,
        bugFormFocused: false,
      };
    default:
      return state;
  }
}

export type AssoExpression =
  | 'normal'
  | 'bugReport'
  | 'bugFocus'
  | 'wink'
  | 'sleeping';

/**
 * Espressione derivata dallo stato macchina (catena di priorità unica,
 * sostituisce l'effect fragile del vecchio componente).
 */
export function deriveExpression(state: AssoMachineState): AssoExpression {
  if (state.sleeping) return 'sleeping';
  if (state.codingTransition) return 'bugReport';
  if (state.panel === 'bug') return state.bugFormFocused ? 'bugFocus' : 'bugReport';
  if (state.panel === 'chat') return 'wink';
  return 'normal';
}

/** True se un overlay della mascotte è in primo piano (z-index alto). */
export function isOverlayVisible(state: AssoMachineState): boolean {
  return (
    state.panel === 'chat' ||
    state.panel === 'bug' ||
    state.codingTransition ||
    state.codingCompanion ||
    state.externalModalOpen ||
    state.fighting
  );
}

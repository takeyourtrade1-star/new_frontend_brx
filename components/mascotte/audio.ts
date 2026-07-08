// Audio della mascotte Asso (PLAN/13.2).
// Un solo AudioContext lazy condiviso (i browser ne limitano ~6 per pagina;
// il vecchio codice ne creava uno nuovo per ogni suono) + master gain con
// mute globale. Set suoni ridotto: open, success, flip, shutter.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function getContext(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      // Riparte solo su gesto utente: tutte le play* sono chiamate da handler.
      void ctx.resume();
    }
    return master ? { ctx, master } : null;
  } catch {
    return null;
  }
}

export function setAssoMuted(value: boolean): void {
  muted = value;
  if (master) master.gain.value = value ? 0 : 1;
}

export function isAssoMuted(): boolean {
  return muted;
}

/** Sospende il context (tab nascosta / idle lungo). */
export function suspendAssoAudio(): void {
  if (ctx && ctx.state === 'running') {
    void ctx.suspend();
  }
}

/** Pop morbido all'apertura della chat. */
export function playOpenSound(): void {
  const audio = getContext();
  if (!audio || muted) return;
  try {
    const now = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.connect(gain);
    gain.connect(audio.master);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Audio non disponibile: silenzioso.
  }
}

/** Accordo di conferma all'invio della segnalazione. */
export function playSuccessSound(): void {
  const audio = getContext();
  if (!audio || muted) return;
  try {
    const now = audio.ctx.currentTime;
    const gain = audio.ctx.createGain();
    gain.connect(audio.master);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    [523.25, 659.25].forEach((freq) => {
      const osc = audio.ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  } catch {
    // Audio non disponibile: silenzioso.
  }
}

/** Fruscio di carta al flip (rumore filtrato, senza layer bonus). */
export function playFlipSound(): void {
  const audio = getContext();
  if (!audio || muted) return;
  try {
    const now = audio.ctx.currentTime;
    const duration = 0.32;
    const bufferSize = Math.floor(audio.ctx.sampleRate * duration);
    const buffer = audio.ctx.createBuffer(1, bufferSize, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audio.ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = audio.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1800, now);
    bandpass.frequency.exponentialRampToValueAtTime(900, now + 0.28);
    bandpass.Q.value = 0.45;

    const gain = audio.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(audio.master);
    noise.start(now);
    noise.stop(now + duration);
  } catch {
    // Audio non disponibile: silenzioso.
  }
}

/** Click singolo per lo screenshot (sostituisce il synth a 5 layer). */
export function playShutterSound(): void {
  const audio = getContext();
  if (!audio || muted) return;
  try {
    const now = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const filter = audio.ctx.createBiquadFilter();
    const gain = audio.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Audio non disponibile: silenzioso.
  }
}

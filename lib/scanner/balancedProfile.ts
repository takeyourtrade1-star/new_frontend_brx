/**
 * Bilanciato: precisione + velocità + fluidità (Turbo V3).
 * - Fast path solo con match molto chiaro (alta conf + ampio margine).
 * - Voto 3/5 per la maggior parte dei casi.
 * - ORB /verify solo se top-1 e top-2 sono quasi pari.
 * - Accelerazione 2/5 se conf ≥ 84% e margine ≥ 6%.
 */

export const BALANCED = {
  /** Commit / hint floors (hook may raise user values to these mins). */
  confFloor: 0.8,
  hintConfFloor: 0.72,
  confDefault: 0.82,
  hintDefault: 0.75,

  /** Instant match — solo letture molto sicure. */
  fastCommitConf: 0.89,
  fastCommitMargin: 0.08,

  /** Consensus accelerato (2 frame uguali + separazione netta). */
  accelCommitConf: 0.84,
  accelCommitMargin: 0.06,
  accelVoteHits: 2,

  /** Voto classico — equilibrio precisione/ritardo. */
  voteWindow: 5,
  voteRequired: 3,

  /** Hint live: 1 frame se forte, altrimenti 2. */
  hintInstantConf: 0.86,
  hintStreakDefault: 2,
  hintStaleMs: 1100,

  /** ORB verify — disambiguazione, non su ogni frame. */
  verifyMarginMax: 0.04,
  verifyConfMin: 0.78,
  verifyConfMax: 0.89,

  /** Loop scan (dopo ogni frame, pausa adattiva). */
  scanGapMinMs: 140,
  scanGapMaxMs: 380,
  scanGapFactor: 0.32,
  captureIntervalMs: 220,

  /** Rete / FAISS */
  requestTimeoutMs: 3200,
  searchTopK: 5,
} as const;

export type TurboMatchInput = {
  finalConfidence: number;
  margin: number;
  voteHits: number;
  effectiveConf: number;
  voteRequired: number;
};

/** Decide se chiudere il match (ordine: fast → accel → vote). */
export function shouldCommitTurboMatch(input: TurboMatchInput): boolean {
  const { finalConfidence, margin, voteHits, effectiveConf, voteRequired } = input;

  if (finalConfidence >= BALANCED.fastCommitConf && margin >= BALANCED.fastCommitMargin) {
    return true;
  }
  if (
    finalConfidence >= BALANCED.accelCommitConf &&
    margin >= BALANCED.accelCommitMargin &&
    voteHits >= BALANCED.accelVoteHits
  ) {
    return true;
  }
  if (voteHits >= voteRequired && finalConfidence >= effectiveConf) {
    return true;
  }
  return false;
}

export function hintStreakRequired(confidence: number): number {
  return confidence >= BALANCED.hintInstantConf ? 1 : BALANCED.hintStreakDefault;
}

export function shouldRunOrbVerify(margin: number, topConf: number): boolean {
  return (
    margin < BALANCED.verifyMarginMax &&
    topConf >= BALANCED.verifyConfMin &&
    topConf < BALANCED.verifyConfMax
  );
}

/** Skip frame solo se la scena è identica e il voto sta già convergendo. */
export function shouldSkipDuplicateFrame(
  fp: number,
  lastFp: number,
  recentNames: string[],
  voteHitsForLeader: number,
): boolean {
  if (fp !== lastFp) return false;
  if (recentNames.length < 2) return false;
  return voteHitsForLeader >= 2;
}

export type ScannerServerTimings = Record<string, number>;

/**
 * Converte un header Server-Timing in una mappa semplice di durate.
 *
 * Il parser ignora metriche senza `dur` e valori non finiti. I nomi restano
 * quelli dichiarati dal BFF, così il client non deve conoscere in anticipo
 * tutte le fasi che il server può esporre.
 */
export function parseScannerServerTiming(
  header: string | null,
): ScannerServerTimings {
  if (!header) return {};

  const timings: ScannerServerTimings = {};
  for (const metric of header.split(',')) {
    const [rawName, ...parameters] = metric.trim().split(';');
    const name = rawName?.trim();
    if (!name) continue;

    const durationParameter = parameters.find((parameter) =>
      parameter.trim().toLowerCase().startsWith('dur='),
    );
    if (!durationParameter) continue;

    const duration = Number(durationParameter.trim().slice(4));
    if (Number.isFinite(duration) && duration >= 0) timings[name] = duration;
  }

  return timings;
}

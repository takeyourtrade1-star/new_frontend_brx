/**
 * Icona ufficiale degli Scambi.
 *
 * Coincide con l'icona usata nell'header (lucide `RefreshCcw`): è la singola
 * fonte di verità per rappresentare gli scambi in tutta l'app. Va usata SEMPRE
 * al posto di altre icone (ArrowLeftRight, ArrowRightLeft, SVG custom) e SENZA
 * animazioni di hover.
 *
 * NB: importiamo `RefreshCcw` col suo nome originale e lo ri-esportiamo come
 * costante. Il re-export con alias (`export { RefreshCcw as ScambiIcon }`)
 * non funziona perché il transform `modularizeImports` di Next userebbe il
 * nome dell'alias per costruire il path (`.../icons/scambi-icon`), inesistente.
 */
import { RefreshCcw } from 'lucide-react';

export const ScambiIcon = RefreshCcw;

/**
 * Feature flags per controllare visibilità funzionalità nel frontend.
 * Tutti i riferimenti agli scambi sono wrappati con queste costanti.
 */

export const FEATURES = {
  /** Se true, mostra la tab SCAMBIA nel dettaglio prodotto e il link Scambi nel nav.
   *  Se false, la tab diventa TORNEI LIVE e il link diventa TCG Express. */
  scambiEnabled: false,

  /** Se true, mostra la route /scambi. Se false, reindirizza a /tcg-express. */
  scambiRouteEnabled: false,
} as const;

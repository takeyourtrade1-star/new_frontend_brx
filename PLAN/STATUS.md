# Stato Esecuzione Piani

Questo file dice all'agente *quali piani sono già stati eseguiti* senza dover leggere ogni file.

| Piano | Titolo | Stato |
|---|---|---|
| 01 | Architettura & Split File Monolitici | **Completato** (chiuso 2026-06-23, diario esecuzione nel file) |
| 02 | Design System & UI Consistency | **Parziale** (review 2026-06-23 parti sicure; 2026-06-29 Skeleton adottato in 2 route loading. Resto: colori/z-index/scroll-lock/Radix rimandati, serve verifica visiva) |
| 03 | Sicurezza & Auth | **Parziale** (review 2026-06-23, solo 3.5/3.7/3.8, resto runtime-dipendente) |
| 04 | Performance & Bundle | **Parziale** (review 2026-06-23, solo parti isolate e verificabili) |
| 05 | SEO & Metadata | **Parziale** (review 2026-06-24, primo batch sicuro fatto) |
| 06 | i18n & Localizzazione | **Parziale** (2026-06-24: 6.8/6.1-easy/6.3-batch/6.5-subset; 2026-06-29: 6.6 pagine errore+offline localizzate. 6.2/6.4/6.7 saltati. Diario in fondo al file 6) |
| 07 | Accessibilità | **Completato** (review 2026-06-24, eseguite tutte le parti sicure + rimandati refactor ampi) |
| 08 | Test & Quality Assurance | **Parziale** (eseguito 2026-06-29: 8.7/8.9/8.10 già fatti, esteso 8.1 + nuovo test refresh proattivo; component test 8.2-8.5/8.8 rimandati. Diario in fondo al file 8) |
| 09 | Refactor auth-store (755 righe) | **Parziale** (eseguito 2026-06-29: 9.2 dead code rimosso, 9.3 drift token fixato; 9.4 già risolto via set atomico; 9.1 split rimandato (refactor ampio, romperebbe i test + serve verifica runtime)) |
| 10 | Bug Fix Specifici | **Parziale** (eseguito 2026-06-29, vedi diario in fondo al file 10) |
| 11 | Responsive & Mobile | **Completato** (eseguito 2026-06-29: 11.1/11.2/11.4/11.6/11.7/11.8; 11.3 già in Plan 7, 11.5 già implementato con OggettiMobileList) |
| 12 | Code Quality & Hygiene | **Quasi completato** (eseguito 2026-06-29: 12.1-12.4, 12.6, 12.8-12.12; 12.5/12.7 saltati per rischio runtime, 12.9 già ok) |
| 13 | Refactor Mascotte Asso | **Completato** (eseguito 2026-07-08, dettagli nel file e in memoria agente) |
| 14 | Backend Scambi | **Correzione ciclo inventario pronta, deploy pendente** (2026-07-14: base Ebartex-only/CardTrader online; nuova gestione “In scambio”, consumo finale, ricevuto non pubblicato, annullo sicuro e tracking corrieri completata e testata localmente. Serve deploy e collaudo reale) |

## Legenda

- **Completato** — piano revisionato, azioni eseguite, documentato nel file. Puoi saltare la lettura.
- **Parziale** — piano revisionato, azioni sicure eseguite, parti runtime-dipendenti rimandate. Leggi il file per i dettagli.
- **Originale** — piano mai toccato. Da verificare ed eseguire.

## Backup

I piani sono anche copiati in `C:\Users\xheta\Documents\GitHub\new_frontend_brx_backup\PLAN\` per sicurezza.

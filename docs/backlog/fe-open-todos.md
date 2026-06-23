# Frontend — TODO aperti (tracciamento)

Registro dei `// TODO` su flussi reali ancora incompleti. **Non rimuovere** i commenti
in codice finché il flusso non è collegato al backend/BFF.

| ID | File | Descrizione | Dipendenza |
|----|------|-------------|------------|
| FE-TODO-001 | `components/feature/registrati/registrati-form.tsx` | Persistenza dati step 1 registrazione prima del passo indirizzo | API auth/registrazione multi-step |
| FE-TODO-002 | `components/feature/registrati/indirizzo-form.tsx` | Persistenza indirizzo e avanzamento wizard registrazione | API auth/registrazione multi-step |
| FE-TODO-003 | `components/feature/account/CreditoContent.tsx` | Invio IBAN/BIC/conto bancario al backend | BFF account/payout |
| FE-TODO-004 | `components/feature/account/AttivaContoVenditore.tsx` | Invio telefono + dati bancari venditore | BFF seller onboarding |
| FE-TODO-005 | `components/feature/account/AttivaContoVenditore.tsx` | Validazione micro-depositi e attivazione conto venditore | BFF seller verification |

Origine: review `docs/reviews/2026-06-21-frontend.md` §12.2.

# Piano 9 — Refactor `lib/stores/auth-store.ts` (755 righe)

**Obiettivo:** Separare concerns, migliorare testabilità.

---

## 9.1 Split in 3 store

**File:** `lib/stores/auth-store.ts`

Azioni:

- `useAuthCore.ts` → token, user, isAuthenticated (stato base)
- `useAuthFlow.ts` → login, MFA, register (azioni)
- `useAuthBootstrap.ts` → initializeAuth, bridge (inizializzazione)

Ogni store ha la propria persistenza configurabile.

---

## 9.2 Rimuovere `AuthErrorBoundary` dead code

**File:** `components/providers.tsx:13-38`

`AuthErrorBoundary` dichiarato ma mai usato. Rimuovere o istanziare correttamente nel provider tree.

---

## 9.3 Allineare `fetchUser` con `authApi.setToken`

**File:** `lib/stores/auth-store.ts:194`

Dopo `set({ accessToken })`, chiamare `authApi.setToken(accessToken)` per evitare drift stato in-memory vs header Authorization.

---

## 9.4 Reset `flashMessage` su logout

**File:** `lib/stores/auth-store.ts` (funzione `logout`)

Aggiungere `set({ flashMessage: null })` per evitare race con `isAuthenticated`.

---

## Criteri di accettazione

- `auth-store.ts` diventa `useAuthCore.ts` (≤200 righe)
- `useAuthFlow.ts` e `useAuthBootstrap.ts` esistono e sono testabili indipendentemente
- Nessun `flashMessage` stale dopo logout (verificato con test)
- `npm run typecheck` e `npm run lint` restano a 0 errori

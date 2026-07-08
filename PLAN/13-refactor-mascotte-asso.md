# Piano 13 — Refactor completo mascotte Asso (codice + runtime + grafica)

> ✅ **ESEGUITO (2026-07-08).** Tutte le fasi 13.0–13.12 completate in un passaggio
> (riscrittura in `components/mascotte/` + swap del gate, non incrementale: gran
> parte del vecchio codice era da eliminare). Risultati misurati:
> - Chunk mascotte: **254.491 → 84.452 byte (−67%)**; ogni item wardrobe = chunk
>   lazy ~1,5 KB caricato solo a equip/pannello aperto.
> - `CardMascotte.tsx` (1935 righe, ~45 useState) → state machine (`machine.ts`)
>   + container `AssoRoot` (~700 righe totali core).
> - AudioContext singleton (prima: 1 nuovo per suono); suoni ridotti a 4
>   (open/success/flip/shutter 1-layer); mute globale sul retro carta.
> - Eyes-follow via rAF + 2 CSS vars; sleep = 1 idle-detector; animazioni in
>   pausa in sonno (`data-asso-sleeping`) e `prefers-reduced-motion` rispettato.
> - Guardaroba 29 → 12 item ridisegnati (tratto `#4a5548` come la faccia,
>   1 gradiente max — vedi `wardrobe/ART_DIRECTION.md`); droppati cigar-xl e
>   yugioh-deck (IP) come da decisione.
> - Gamification: tenuti flip/varianti retro/shiny; via combo, achievements,
>   album, confetti, fanfare, share, ore di sonno, russare.
> - CardLoader 3900 ms **eliminato**: click → chat immediata. Blink automatico
>   aggiunto (faccia meno "morta").
> - i18n: 27 chiavi nuove ×6 lingue (item, colori, mute, base); 14 chiavi orfane
>   rimosse; stringhe hardcoded IT eliminate. `brx_asso_v1` unica chiave storage
>   con migrazione dalle 6 legacy (+ pulizia item droppati).
> - Verifica: typecheck/lint/i18n:keys verdi, 225 test (19 nuovi su
>   machine/persistence/manifest), build ok, smoke dev server ok.

**Obiettivo:** Asso leggero, manutenibile e bello da vedere. Meno codice, meno CPU,
meno bundle, metà guardaroba ma di qualità alta. Si **mantiene** il design "charm"
con interno trasparente (scelta confermata dal product owner).

---

## Diagnosi (stato 2026-07-08)

Superficie totale: **~7.800 righe su 20 file** per un widget di supporto.

| Problema | Evidenza |
|---|---|
| God component | `components/dev/CardMascotte.tsx` — 1.935 righe, ~45 `useState`, ~20 `useRef`, refs che specchiano state (`isSleepingRef`, `totalSleepMsRef`) |
| Prop drilling estremo | `CardMascotteWidget` riceve **45+ props**; `CardMascotteOverlays` altre ~25 |
| SVG nel bundle JS | `mascotte-wardrobe-items.ts` — **1.865 righe** di stringhe SVG (29 item) caricate sempre, anche se il guardaroba non viene mai aperto; thumbnails = `encodeURIComponent` dell'intero SVG in memoria al mount |
| `dangerouslySetInnerHTML` ovunque | facce, item, 612 righe CSS (`CardMascotteStyles`) re-iniettate come stringa |
| Web Audio senza gestione | 8 funzioni suono (`playFlipSound`, `playShutterSound` a 5 layer, snore, fanfare…) — **ognuna crea un `new AudioContext`** mai chiuso; i browser ne limitano ~6 per pagina |
| Listener globali costosi | `document.mousemove` per eyes-follow con `querySelectorAll('.pupil')` + style write **a ogni evento**; 5 listener document per lo sleep timer; `MutationObserver` su `body`; `resize` |
| Animazioni sempre attive | `mascotteFloat` + `asso-pulse` infinite anche in sleep/tab nascosta, con doppio `drop-shadow` animato (paint costoso). Nessun rispetto di `prefers-reduced-motion` |
| Feature creep | flip + combo + shiny 5% + achievements + album + unlock retro + confetti + fanfare + contatore ore di sonno + russare sintetizzato — in un widget di segnalazione bug |
| UX pesante | click su Asso → `CardLoader` da **3.900 ms** prima della chat |
| i18n violata | stringhe IT hardcoded: `welcomeMessages`, `ACHIEVEMENTS`, `styleReactionMessages`, promo hints, testo share (regola CLAUDE.md §3) |
| Persistenza sparsa | 7+ chiavi `localStorage` (`brx_asso_interacted`, `brx_mascotte_flips`, `brx_mascotte_unlocked`, `brx_asso_sleep_muted`, `brx_asso_sleep_ms`, wardrobe, bug report ×4) |
| Posizione sbagliata | vive in `components/dev/` ma è feature di produzione montata in `app/layout.tsx` |

Cosa è **già** giusto e va preservato: `CardMascotteGate` (dynamic import `ssr:false`,
route escluse), `html2canvas` on-demand, cleanup timeout via `useTimeouts`.

---

## Ordine consigliato

`13.0 → 13.1 → 13.2 → 13.3 → 13.4 → 13.5/13.6 (grafica) → 13.7 → 13.8 → 13.9 → 13.10 → 13.11 → 13.12`

Le fasi 13.1–13.4 sono behavior-preserving (come Piano 01: un seam alla volta,
commit per passo, smoke test runtime tra i passi). Le fasi 13.5–13.8 cambiano
il prodotto e vanno validate visivamente.

---

## 13.0 Baseline e criteri di successo

Prima di toccare codice:

1. `npm run build` → annotare peso del chunk lazy di `CardMascotte` (First Load JS invariato, è dynamic).
2. DevTools Performance: 30 s di idle su `/home` con Asso visibile → annotare % CPU / long task (float + pulse + mousemove).
3. Elenco smoke test manuale: apertura chat, bug report + screenshot, wardrobe equip/unequip, flip, sleep dopo 15 s, wake, mobile (≤639 px) help button, hint bubble promo, hide su modale asta.

**Target di uscita:** chunk mascotte **−60%**, zero long task in idle, smoke test invariati (tranne i tagli deliberati di 13.7/13.8).

---

## 13.1 Stato: da 45 useState a una state machine

**File:** `components/dev/CardMascotte.tsx`

- Introdurre `useAssoMachine` (`useReducer`, no dipendenze nuove) con stati espliciti:
  `idle | sleeping | flipped | wardrobe | chat | bugReport | codingTransition`.
  La catena di priorità espressioni (cigar > sleep > coding > modal > chat > normal,
  oggi un effect fragile) diventa una **derivazione pura** dallo stato macchina.
- Sotto-stati UI effimeri (particelle, sparkles, combo, tilt) restano locali nei
  componenti foglia, non nel container.
- Eliminare i refs-specchio (`isSleepingRef`, `totalSleepMsRef`, `chatTypewriterCompleteRef`).
- Ridurre le props di `CardMascotteWidget`/`CardMascotteOverlays` passando lo stato
  macchina + dispatch (o un piccolo context locale), non 45 valori singoli.

**Verifica:** `grep -c "useState" components/mascotte/AssoRoot.tsx` ≤ 10;
`CardMascotteWidgetProps` ≤ 15 campi. Typecheck/lint verdi, smoke test 13.0 invariati.

## 13.2 Audio: un solo AudioContext, metà suoni

**Nuovo:** `components/mascotte/audio.ts`

- Singleton lazy: `getAssoAudioContext()` creato al primo gesto utente, riusato, `suspend()` in idle.
- Master `GainNode` + **mute globale unico** (sostituisce `brx_asso_sleep_muted`).
- Tenere: pop apertura, success submit, un suono flip. **Tagliare:** shutter a 5 layer
  (basta 1 click breve), fanfare 12 note, unlock 5 note, shiny 7 note, snore (il ronzio
  sintetico a schermo fermo è esattamente il "pesante" segnalato).

**Verifica:** `grep -c "new (window.AudioContext" components/` = 1.

## 13.3 Runtime: listener e animazioni a costo ~zero in idle

- **Eyes-follow:** un solo listener `mousemove` throttled via `requestAnimationFrame`
  che scrive **2 CSS custom properties** (`--asso-pupil-x/y`) sul container; le pupille
  le leggono in CSS. Niente `querySelectorAll` per evento. Disattivato su touch device
  e quando `document.hidden`.
- **Sleep:** un unico idle-detector (`pointerdown/keydown/scroll` con throttle) al posto
  dei 5 listener; in sleep mettere `animation-play-state: paused` su float/pulse.
- **`prefers-reduced-motion: reduce`:** float, pulse, particelle, confetti, typewriter → off.
- `visibilitychange`: pausa animazioni e sospendi AudioContext a tab nascosta.
- Ridurre i `drop-shadow` animati a un'ombra statica + glow via `box-shadow` su pseudo-elemento.

**Verifica:** trace Performance 30 s idle: 0 long task, scripting < 1%.

## 13.4 Vestiti fuori dal main chunk (lazy per item)

**Nuovi file:** `components/mascotte/wardrobe/manifest.ts` + `components/mascotte/wardrobe/items/<id>.tsx`

- `manifest.ts` = solo metadati leggeri: `{ id, nameKey, category, slot, anchor, zIndex }` (~50 righe).
- Ogni item = **componente React SVG** (non stringa) in un file proprio, caricato con
  `dynamic import` **solo se equipaggiato o se il wardrobe è aperto**. Le classi di
  animazione (`equipped-item-float`, `breathe`) restano applicabili perché è JSX vero.
- Thumbnails del pannello = rendering diretto del componente in scala (niente data-URI giganti).
- `WardrobePanel` stesso diventa `dynamic()` (oggi è nel chunk base della mascotte).
- Eliminare `mascotte-wardrobe-items.ts` a fine fase.

**Verifica:** chunk base mascotte senza alcun path SVG di item (`grep hoodieBody` sul
build output = 0 match); equip di un item scarica un chunk dedicato (Network tab).

## 13.5 Redesign guardaroba: 29 item → ~12, qualità alta

Decisione product: **metà item ma eccellenti** (confermato 2026-07-08).

**Art direction unica** (da scrivere in `components/mascotte/wardrobe/ART_DIRECTION.md`):

- Griglia di ancoraggio condivisa sul corpo 96×128: slot `head / eyes / body / hand-l / hand-r / float`, con coordinate documentate, così ogni item disegnato sulla griglia è allineato *by construction* (oggi: offset magici per item).
- Palette chiusa: arancio brand `#FF7300` + 2 accent + neutri; linea unica `#4a5548` (stessa delle facce) con halo chiaro `#faf9f6` — gli item devono sembrare **disegnati nello stesso tratto della faccia**, non "foto stampate sopra".
- Stroke: 2 pesi soli (2.5 / 3.2 come le facce), `stroke-linecap: round`.
- Luce: max 1 gradiente per item, direzione alto-sinistra, niente stack di 6 gradient come l'hoodie attuale.

**Proposta keep/redraw (12):** hoodie, tuxedo, bomber, cap-baseball, sunglasses-wayfarer,
glasses-round, headphones, laptop, coffee, trophy, camera, deck di carte (sostituisce
`yugioh-deck`, IP altrui).
**Drop (17):** leather-jacket, sweater, hawaiian, cardigan, poncho, earrings-hoop,
necklace-pendant, hair-bow, headband, bandana, ski-goggles, **cigar-xl** (off-brand),
smartphone, book, balloon, bag, ice-cream.
> Lista finale = decisione aperta (vedi fondo). Item droppati ma equipaggiati in
> localStorage → migrazione 13.10 li rimuove silenziosamente.

**Verifica:** review visiva su griglia (pagina dev temporanea che renderizza tutti gli
item equipaggiati su Asso, light/dark) + ok del product owner.

## 13.6 Redesign facce e animazioni

- Facce da stringhe → componenti React (`AssoFace` con prop `expression`), transizioni
  tra espressioni via morph CSS (opacity/transform), non swap secco di innerHTML.
- Nuovo set micro-animazioni (tutte solo `transform`/`opacity`):
  - **blink** automatico ogni 4–7 s (oggi assente: lo sguardo fisso contribuisce all'effetto "morto");
  - idle float ridotto (ampiezza 2 px, non 4) e più lento;
  - reaction "pop" 300 ms su equip item;
  - sleep: palpebre che si chiudono in morph + Zzz, niente promo bubble in sleep.
- Tilt 3D hover: tenere ma clampare (±8°) e disattivare con reduced-motion.

**Verifica:** smoke visivo; nessuna animazione basata su `filter`/`box-shadow` inline.

## 13.7 Dieta gamification

**Tenere:** flip con contatore, retro varianti sbloccabili (è il gancio col dominio carte), shiny 5%.
**Tagliare:** combo/streak, achievements toast + suono, album, golden confetti + fanfare
+ backflip a 100 flip, share, **contatore ore di sonno**, mute-sleep dedicato (assorbito
dal mute globale 13.2).

Stima: −500/600 righe e −4 chiavi localStorage.
> Perimetro esatto = decisione aperta (vedi fondo).

## 13.8 UX flussi

- `CardLoader` pre-chat: da 3.900 ms → **≤ 800 ms** (o rimosso: click → chat subito con
  typewriter). Il loader da 4 s è il singolo attrito più segnalabile.
- Chat: greeting + menu insieme, senza doppio timer typing→typewriter→menu.
- Mobile (≤639 px): invariato (help button → chat), ma stesso taglio del loader.

## 13.9 i18n completa

Portare in `t()` su **tutte e 6 le lingue**: welcome messages, style reactions, promo
hints, titoli flip/varianti retro (se sopravvivono a 13.7). Rimuovere le stringhe IT
hardcoded da `CardMascotte.tsx`.

**Verifica:** `npm run i18n:keys` verde; `grep -n "Bentornato\|Nuovo look" components/mascotte/` = 0.

## 13.10 Persistenza unificata

**Nuovo:** `components/mascotte/persistence.ts`

- Una chiave `brx_asso_v1` = JSON versionato `{ version, flips, unlockedVariants, wardrobe, muted, interacted }`.
- Migrazione one-shot dalle 7 chiavi legacy (+ pulizia item droppati) e `removeItem` delle vecchie.
- Test unit sulla migrazione (chiavi legacy presenti / assenti / corrotte).

## 13.11 Spostamento e rinomina

- `components/dev/CardMascotte*` + `card-mascotte/*` + hook `useAsso*` → **`components/mascotte/`**
  (è produzione, non dev). `MascotteLoader`/`CardLoader` restano in `dev/` solo se ancora usati altrove.
- Aggiornare la mappa rapida di `CLAUDE.md` con la riga `| Mascotte Asso | components/mascotte/ |`.
- Pulire `.next` dopo lo spostamento (trappola nota type generati stantii).

## 13.12 Test

- Unit: state machine (transizioni + priorità espressioni), migrazione persistenza,
  coerenza manifest (ogni item ha slot/anchor/categoria validi, id univoci).
- Component (facoltativo, pattern Piano 08): gate route nascoste, mount senza errori.

---

## Verifica finale (gate di chiusura piano)

```bash
npm run typecheck && npm run lint && npm run i18n:keys && npm run test && npm run build
```

+ bundle diff vs baseline 13.0 (target −60% chunk mascotte), trace idle pulita,
smoke test manuale completo desktop + mobile.

---

## Decisioni aperte (da confermare col product owner prima di 13.5/13.7)

1. **Lista definitiva 12 item** — proposta sopra; confermare o sostituire.
2. **Perimetro gamification** — proposta: tenere flip/retro/shiny, tagliare il resto.
3. **CardLoader** — ridurre a ~800 ms o eliminare del tutto (raccomandazione: eliminare).
4. **Suoni** — tenere 3 (open/success/flip) o zero di default con opt-in.

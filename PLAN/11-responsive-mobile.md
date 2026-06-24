# Piano 11 — Responsive & Mobile

**Obiettivo:** Migliorare esperienza mobile, rispettare iOS HIG.

---

## 11.1 TopBar login form overflow

**File:** `components/layout/TopBar.tsx:411-416, 704`

Su viewport 1024-1280px il form va in overflow. Nascondere sotto 1280px o spostare in dropdown.

---

## 11.2 `background-attachment: fixed` rimosso

Vedi **Piano 2.7**.

---

## 11.3 Touch target 44×44

Vedi **Piano 7.5**.

---

## 11.4 `CountrySelect` overflow mobile

**File:** `components/ui/CountrySelect.tsx:42`

`lg: h-16 pl-5 pr-5 text-lg` (64px) può rompere layout. Aggiungere `min-w-0 flex-1` o limitare larghezza.

---

## 11.5 `OggettiTable` mobile fallback

**File:** `components/feature/oggetti/OggettiTable.tsx`

Tabella con 9 colonne, su mobile no fallback. Aggiungere vista card mobile o `overflow-x-auto` con shadow gradient per indicare scroll.

---

## 11.6 `CardImageCameraPeek` dimensione touch target

**File:** `components/ui/CardImageCameraPeek.tsx:29`

`h-9 w-9` → `h-11 w-11` (iOS HIG 44×44).

---

## 11.7 `HamburgerMenu` drawer landscape mobile

**File:** `components/layout/HamburgerMenu.tsx:241`

`w-[min(100%,340px)]` in landscape 568px = 60% schermo. Verificare UX o ridurre a 280px.

---

## 11.8 `AsteInCorsoCarousel` aspect ratio

**File:** `components/feature/aste/AsteInCorsoCarousel.tsx:371-380`

Skeleton `aspect-[2/3]` ma immagini 63/88 = 0.71. Allineare a `aspect-[63/88]`.

---

## Criteri di accettazione

- Test manuale a 320, 375, 414, 768, 1024, 1280, 1920 px non mostra overflow orizzontale
- Touch target ≥ 44×44 px su tutti i bottoni interattivi
- Drawer mobile non supera 80% larghezza in landscape
- Aspect ratio card allineato a 63/88 (carte TCG standard)

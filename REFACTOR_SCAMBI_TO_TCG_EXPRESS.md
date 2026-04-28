# Refactor: Scambi → TCG Express / Tornei live

## Overview
This document documents the complete refactoring process that transformed the "Scambi" feature into "TCG Express" (now branded as "Tornei live") while preserving all original code for potential future reactivation.

## Objectives
- **Primary Goal**: Rebrand "Scambi" feature to "TCG Express"
- **Secondary Goal**: Add a comprehensive landing page at `/tcg-express` featuring the Neo-Tactile Arena mockup
- **Tertiary Goal**: Update UI to reflect "Tornei live" branding in navigation
- **Preservation**: Keep all original "scambi" code intact but hidden from end-users

## Changes Made

### 1. Route Changes
**File**: `app/scambi/page.tsx`
- Replaced entire page content with permanent redirect to `/tcg-express`
- Original content preserved but not accessible to users

**File**: `app/tcg-express/page.tsx` (NEW)
- Created new route for TCG Express landing page
- Includes Header, Footer, and TcgExpressLandingPage component
- Wrapped in Suspense boundaries for Next.js 15 compatibility

**File**: `app/sitemap.ts`
- Updated sitemap entry from `/scambi` to `/tcg-express`

### 2. Landing Page Creation
**File**: `components/feature/tcg-express/TcgExpressLandingPage.tsx` (NEW)
- Comprehensive landing page with multiple sections:
  - Hero section with branding
  - Ecosistema Phygital section
  - Acquisition Funnel section
  - Neo-Tactile Arena mockup integration
- Uses framer-motion for animations
- Uses lucide-react icons for visuals

**File**: `components/feature/tcg-express/NeoTactileMockup.tsx` (NEW)
- Detailed mockup of the Neo-Tactile Arena platform interface
- Features:
  - Left sidebar with workspace icons (Crown, Layers, ListPlus, Trophy, ShoppingBag, ShoppingCart, PackageOpen)
  - Center stage with stream controls, player rows, webcam overlays
  - Right sidebar with Judge Feed, Live Scoreboard, Spectator Chat, Cardmarket Value section
- Faithfully replicates the takeyourtrade landing design

### 3. Header/Navigation Updates
**File**: `components/layout/TopBar.tsx`
- **Desktop header**: Changed button label from "TCG Express" to "Tornei live" with Trophy icon
- **Mobile menu**: Updated link from `/scambi` to `/tcg-express` and label to "Tornei live"
- Icon semantically represents tournaments (Trophy)

### 4. Translation Files Updated
All translation files updated to remove "scambi" references and replace with appropriate terminology:

**Files**:
- `lib/i18n/messages/it.ts`
- `lib/i18n/messages/en.ts`
- `lib/i18n/messages/es.ts`
- `lib/i18n/messages/fr.ts`
- `lib/i18n/messages/de.ts`
- `lib/i18n/messages/pt.ts`

**Changes**:
- Removed auction-related references to "scambi" / "exchange"
- Updated to auction-focused terminology
- Maintained translation consistency across all languages

### 5. Meta Data Updates
**Files Updated**:
- `app/layout.tsx`
- `app/page.tsx`
- `app/home/magic/page.tsx`
- `app/home/pokemon/page.tsx`
- `app/home/one-piece/page.tsx`

**Changes**:
- Removed "scambia" references from meta descriptions
- Updated site metadata to reflect new branding

### 6. Component Updates
**File**: `components/feature/LandingWelcome.tsx`
- Replaced all "Scambi" references with "TCG Express"
- Updated links from `/scambi` to `/tcg-express`

**File**: `components/feature/acquisti/AcquistiContent.tsx`
- Removed scambi-related tabs
- Removed empty states for scambi functionality

**File**: `components/dev/CardMascotte.tsx`
- Updated promotional hints replacing scambi with TCG Express
- Changed routes accordingly

**File**: `components/dev/CardLoader.tsx`
- Changed displayed text from "Vendite, Scambi ed Aste" to "Vendite, Tornei ed Aste"

**File**: `components/feature/product/ProductDetailView.tsx`
- Renamed tab from 'SCAMBIA' to 'TORNEI LIVE'
- Updated TypeScript types to reflect change
- Replaced SCAMBIA tab content with mock live tournaments data

**File**: `app/aiuto/aiuto-content.tsx`
- Removed FAQ entry about how scambi work between users

### 7. Feature Flags (Preserved)
**File**: `lib/config/features.ts`
- Feature flags preserved but not currently used:
  - `scambiEnabled`: Can be toggled to re-enable scambi
  - `scambiRouteEnabled`: Can be toggled to re-enable scambi route

## Technical Details

### Suspense Boundary Addition
The `/tcg-express` page required Suspense boundaries due to Next.js 15's `useSearchParams()` requirements:
```tsx
<Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
  <Header />
</Suspense>
<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f6f8fb]">Caricamento...</div>}>
  <TcgExpressLandingPage />
</Suspense>
```

### Icon Mapping
The workspace sidebar uses these lucide-react icons:
- **Match Center**: Crown
- **Decklist**: Layers
- **Create Tournament**: ListPlus
- **Live Tournaments**: Trophy
- **Marketplace**: ShoppingBag
- **Cart**: ShoppingCart
- **Ready One Day**: PackageOpen

### Cardmarket Value Section
Added to right sidebar with these benefits:
- Riduzione esposizione spedizioni UPU
- Ready One Day: dispatch 24h da hub locali
- Zero CAPEX: margine extra con fulfillment gestito

## Files Modified Summary

### Created Files
- `app/tcg-express/page.tsx`
- `components/feature/tcg-express/TcgExpressLandingPage.tsx`
- `components/feature/tcg-express/NeoTactileMockup.tsx`

### Modified Files
- `app/scambi/page.tsx` (redirect only)
- `app/sitemap.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/home/magic/page.tsx`
- `app/home/pokemon/page.tsx`
- `app/home/one-piece/page.tsx`
- `components/layout/TopBar.tsx`
- `components/feature/LandingWelcome.tsx`
- `components/feature/acquisti/AcquistiContent.tsx`
- `components/dev/CardMascotte.tsx`
- `components/dev/CardLoader.tsx`
- `components/feature/product/ProductDetailView.tsx`
- `app/aiuto/aiuto-content.tsx`
- `lib/i18n/messages/it.ts`
- `lib/i18n/messages/en.ts`
- `lib/i18n/messages/es.ts`
- `lib/i18n/messages/fr.ts`
- `lib/i18n/messages/de.ts`
- `lib/i18n/messages/pt.ts`

## Reactivation Guide

To re-enable the "scambi" feature in the future:

1. **Restore Route**: Replace `app/scambi/page.tsx` redirect with original content
2. **Update Navigation**: Revert TopBar.tsx to show original "Scambi" links
3. **Restore Translations**: Revert translation files to include scambi terminology
4. **Update Feature Flags**: Set `scambiEnabled` and `scambiRouteEnabled` to `true` in `lib/config/features.ts`
5. **Restore Components**: Revert component changes that removed scambi tabs/sections

## Design System Compliance

All changes follow the Ebartex design system:
- **Tailwind CSS v3.4.0** for styling
- **Custom design tokens** from `tailwind.config.ts`
- **Shadcn/UI components** with CSS variables for theming
- **Framer Motion** for animations
- **Lucide React** for icons
- **Mobile-first** responsive design
- **Accessibility** considerations maintained

## Build Status
✅ Build successful with no errors
✅ All TypeScript types valid
✅ Suspense boundaries properly implemented
✅ All translations consistent

## Git History
- Commit: "Header: TCG Express → Tornei live with trophy icon; add Suspense wrapper to /tcg-express page"
- Commit: "NeoTactile mockup: add correct icons and Cardmarket Value section"

## Next Steps for Future AI
1. Consider adding interactive features to the Neo-Tactile mockup (drag-and-drop windows)
2. Implement actual tournament data integration
3. Add real-time chat functionality to the mockup
4. Consider adding mobile version of the Neo-Tactile interface

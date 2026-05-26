import type { ComponentType } from 'react';
import AT from 'country-flag-icons/react/3x2/AT';
import CH from 'country-flag-icons/react/3x2/CH';
import CN from 'country-flag-icons/react/3x2/CN';
import CZ from 'country-flag-icons/react/3x2/CZ';
import DE from 'country-flag-icons/react/3x2/DE';
import ES from 'country-flag-icons/react/3x2/ES';
import FR from 'country-flag-icons/react/3x2/FR';
import GB from 'country-flag-icons/react/3x2/GB';
import HU from 'country-flag-icons/react/3x2/HU';
import IT from 'country-flag-icons/react/3x2/IT';
import JP from 'country-flag-icons/react/3x2/JP';
import KR from 'country-flag-icons/react/3x2/KR';
import PL from 'country-flag-icons/react/3x2/PL';
import PT from 'country-flag-icons/react/3x2/PT';
import RO from 'country-flag-icons/react/3x2/RO';
import RU from 'country-flag-icons/react/3x2/RU';
import TW from 'country-flag-icons/react/3x2/TW';
import US from 'country-flag-icons/react/3x2/US';

export type IsoFlagComponent = ComponentType<{ className?: string; title?: string; 'aria-hidden'?: boolean }>;

/** Bandiere ISO 3x2 per lingue carta MTG (SVG, cross-browser). */
export const CARD_ISO_FLAG_COMPONENTS: Readonly<Record<string, IsoFlagComponent>> = {
  AT,
  CH,
  CN,
  CZ,
  DE,
  ES,
  FR,
  GB,
  HU,
  IT,
  JP,
  KR,
  PL,
  PT,
  RO,
  RU,
  TW,
  US,
  UK: GB,
  EN: GB,
};

export function getIsoFlagComponent(isoCode: string): IsoFlagComponent | null {
  const key = isoCode?.trim().toUpperCase();
  if (!key) return null;
  return CARD_ISO_FLAG_COMPONENTS[key] ?? null;
}

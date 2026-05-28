'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CATEGORY_SLUGS } from '@/lib/product-categories';
import { isSellFlow } from '@/lib/sell-flow/sell-flow';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { Coachmark } from './Coachmark';
import {
  isSellGuideSkippedThisSession,
  skipSellGuideForSession,
} from './useSellGuideSession';

export type SellGuideStepId = 'search' | 'vendi-tab' | 'details' | 'photos' | 'publish';

const STEP_ORDER: SellGuideStepId[] = ['search', 'vendi-tab', 'details', 'photos', 'publish'];

const STEP_MESSAGE: Record<SellGuideStepId, MessageKey> = {
  search: 'sellGuide.searchInHeader',
  'vendi-tab': 'sellGuide.vendiTab',
  details: 'sellGuide.details',
  photos: 'sellGuide.photos',
  publish: 'sellGuide.publish',
};

const STEP_ANCHOR: Record<SellGuideStepId, string> = {
  search: 'search',
  'vendi-tab': 'vendi-tab',
  details: 'sell-price',
  photos: 'sell-photos',
  publish: 'sell-publish',
};

type SellGuideContextValue = {
  isActive: boolean;
  currentStep: SellGuideStepId | null;
  skipSession: () => void;
  setStep: (step: SellGuideStepId) => void;
  advance: () => void;
  complete: () => void;
  notifyWizardStep: (step: 'details' | 'confirm') => void;
};

const SellGuideContext = createContext<SellGuideContextValue | null>(null);

export function useSellGuide(): SellGuideContextValue {
  const ctx = useContext(SellGuideContext);
  if (!ctx) {
    return {
      isActive: false,
      currentStep: null,
      skipSession: () => {},
      setStep: () => {},
      advance: () => {},
      complete: () => {},
      notifyWizardStep: () => {},
    };
  }
  return ctx;
}

function isProductDetailPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'products' || parts.length < 2) return false;
  const slug = parts[1] ?? '';
  return !CATEGORY_SLUGS.has(slug);
}

export function SellGuideProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sellFlow = isSellFlow(searchParams);
  const [skipped, setSkipped] = useState(() => isSellGuideSkippedThisSession());
  const [currentStep, setCurrentStep] = useState<SellGuideStepId | null>(null);
  const [completed, setCompleted] = useState(false);

  const isActive = sellFlow && !skipped && !completed;

  const skipSession = useCallback(() => {
    skipSellGuideForSession();
    setSkipped(true);
    setCurrentStep(null);
  }, []);

  const advance = useCallback(() => {
    setCurrentStep((prev) => {
      if (!prev) return prev;
      const idx = STEP_ORDER.indexOf(prev);
      if (idx < 0 || idx >= STEP_ORDER.length - 1) {
        setCompleted(true);
        return null;
      }
      return STEP_ORDER[idx + 1]!;
    });
  }, []);

  const setStep = useCallback((step: SellGuideStepId) => {
    if (!isSellGuideSkippedThisSession() && sellFlow) {
      setCurrentStep(step);
    }
  }, [sellFlow]);

  const complete = useCallback(() => {
    setCompleted(true);
    setCurrentStep(null);
  }, []);

  const notifyWizardStep = useCallback(
    (wizardStep: 'details' | 'confirm') => {
      if (!isActive) return;
      if (wizardStep === 'details') {
        setCurrentStep((prev) => {
          const idx = prev ? STEP_ORDER.indexOf(prev) : -1;
          const detailsIdx = STEP_ORDER.indexOf('details');
          if (idx < detailsIdx) return 'details';
          return prev;
        });
      } else if (wizardStep === 'confirm') {
        setCurrentStep((prev) => {
          const idx = prev ? STEP_ORDER.indexOf(prev) : -1;
          const photosIdx = STEP_ORDER.indexOf('photos');
          if (idx < photosIdx) return 'photos';
          return prev;
        });
      }
    },
    [isActive],
  );

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(null);
      return;
    }
    if (isProductDetailPath(pathname)) {
      setCurrentStep((prev) => {
        if (!prev || prev === 'search') return 'vendi-tab';
        return prev;
      });
    } else if (pathname.startsWith('/products/') || pathname.startsWith('/search')) {
      setCurrentStep((prev) => prev ?? 'search');
    }
  }, [pathname, isActive]);

  const value = useMemo(
    (): SellGuideContextValue => ({
      isActive,
      currentStep,
      skipSession,
      setStep,
      advance,
      complete,
      notifyWizardStep,
    }),
    [isActive, currentStep, skipSession, setStep, advance, complete, notifyWizardStep],
  );

  return (
    <SellGuideContext.Provider value={value}>
      {children}
      {isActive && currentStep ? (
        <Coachmark
          anchor={STEP_ANCHOR[currentStep]}
          messageKey={STEP_MESSAGE[currentStep]}
          onNext={currentStep === 'publish' ? undefined : advance}
          onSkip={skipSession}
          showNext={currentStep !== 'publish'}
          placement={currentStep === 'search' ? 'bottom' : 'top'}
        />
      ) : null}
    </SellGuideContext.Provider>
  );
}

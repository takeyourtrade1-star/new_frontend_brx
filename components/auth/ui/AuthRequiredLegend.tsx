'use client';



import { useTranslation } from '@/lib/i18n/useTranslation';

import { AUTH_REQUIRED_MARKER_CLASS } from './auth-styles';

import { AUTH_SPLIT_LEGEND_CLASS } from './auth-split-styles';



export function AuthRequiredLegend() {

  const { t } = useTranslation();



  return (

    <p className={AUTH_SPLIT_LEGEND_CLASS}>

      <span className={AUTH_REQUIRED_MARKER_CLASS} aria-hidden>

        *

      </span>{' '}

      {t('registerForm.requiredFieldsLegend')}

    </p>

  );

}



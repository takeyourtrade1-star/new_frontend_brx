/**
 * AuthErrorAlert - Elegant error display component for authentication errors
 * 
 * Features:
 * - Glassmorphism design matching Ebartex style system
 * - Icon indicators for different error types
 * - Countdown timer for rate limiting
 * - Dismissible with animation
 * - Accessible with proper ARIA attributes
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  ShieldAlert, 
  Clock, 
  WifiOff, 
  ServerOff,
  X,
  Lock,
  UserX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthError } from '@/lib/errors/useAuthError';
import { AUTH_ERROR_CODES } from '@/lib/errors/auth-error-codes';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AuthErrorAlertProps {
  error: ReturnType<typeof useAuthError>;
  className?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

// Error type configurations - translation keys for titles
const ERROR_CONFIGS: Record<string, { 
  icon: React.ElementType; 
  bgColor: string; 
  borderColor: string;
  iconColor: string;
  titleKey: string;
}> = {
  [AUTH_ERROR_CODES.LOGIN_INVALID_CREDENTIALS]: {
    icon: AlertCircle,
    bgColor: 'bg-red-50/80',
    borderColor: 'border-red-200/50',
    iconColor: 'text-red-500',
    titleKey: 'errors.titles.invalidCredentials',
  },
  [AUTH_ERROR_CODES.LOGIN_ACCOUNT_LOCKED]: {
    icon: Lock,
    bgColor: 'bg-amber-50/80',
    borderColor: 'border-amber-200/50',
    iconColor: 'text-amber-500',
    titleKey: 'errors.titles.accountLocked',
  },
  [AUTH_ERROR_CODES.LOGIN_ACCOUNT_LOCKED_RETRY]: {
    icon: Clock,
    bgColor: 'bg-amber-50/80',
    borderColor: 'border-amber-200/50',
    iconColor: 'text-amber-500',
    titleKey: 'errors.titles.accountLockedRetry',
  },
  [AUTH_ERROR_CODES.LOGIN_ACCOUNT_BANNED]: {
    icon: UserX,
    bgColor: 'bg-red-50/80',
    borderColor: 'border-red-200/50',
    iconColor: 'text-red-500',
    titleKey: 'errors.titles.accountBanned',
  },
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    icon: Clock,
    bgColor: 'bg-orange-50/80',
    borderColor: 'border-orange-200/50',
    iconColor: 'text-orange-500',
    titleKey: 'errors.titles.rateLimit',
  },
  [AUTH_ERROR_CODES.NETWORK_ERROR]: {
    icon: WifiOff,
    bgColor: 'bg-gray-50/80',
    borderColor: 'border-gray-200/50',
    iconColor: 'text-gray-500',
    titleKey: 'errors.titles.networkError',
  },
  [AUTH_ERROR_CODES.NETWORK_OFFLINE]: {
    icon: WifiOff,
    bgColor: 'bg-gray-50/80',
    borderColor: 'border-gray-200/50',
    iconColor: 'text-gray-500',
    titleKey: 'errors.titles.offline',
  },
  [AUTH_ERROR_CODES.SERVER_PROXY_ERROR]: {
    icon: ServerOff,
    bgColor: 'bg-red-50/80',
    borderColor: 'border-red-200/50',
    iconColor: 'text-red-500',
    titleKey: 'errors.titles.serverError',
  },
  [AUTH_ERROR_CODES.SERVER_UNAVAILABLE]: {
    icon: ServerOff,
    bgColor: 'bg-red-50/80',
    borderColor: 'border-red-200/50',
    iconColor: 'text-red-500',
    titleKey: 'errors.titles.serviceUnavailable',
  },
  default: {
    icon: ShieldAlert,
    bgColor: 'bg-red-50/80',
    borderColor: 'border-red-200/50',
    iconColor: 'text-red-500',
    titleKey: 'errors.titles.generic',
  },
};

function getErrorConfig(errorCode?: string) {
  return ERROR_CONFIGS[errorCode || ''] || ERROR_CONFIGS.default;
}

export function AuthErrorAlert({ 
  error, 
  className,
  onDismiss,
  showDismiss = true,
}: AuthErrorAlertProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const config = getErrorConfig(error.error?.code);
  const Icon = config.icon;
  const title = t(config.titleKey as any);

  // Show animation on mount
  useEffect(() => {
    if (error.hasError) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [error.hasError, error.error?.code]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      error.clearError();
      onDismiss?.();
    }, 200);
  };

  // Format countdown timer
  const formatCountdown = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || !error.hasError) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-200',
        config.bgColor,
        config.borderColor,
        isExiting ? 'opacity-0 translate-y-[-8px]' : 'opacity-100 translate-y-0',
        className
      )}
    >
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 bg-white/40" />
      
      <div className="relative flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          'bg-white/60 shadow-sm'
        )}>
          <Icon className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn('text-sm font-semibold', config.iconColor)}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
            {error.errorMessage}
          </p>
          
          {/* Rate limit countdown */}
          {error.isRateLimitError && error.retryAfter > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 font-medium">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('errors.titles.retryIn')} {formatCountdown(error.retryAfter)}</span>
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {showDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'shrink-0 rounded-lg p-1.5 transition-colors',
              'hover:bg-black/5 focus:outline-none focus-visible:ring-2',
              'focus-visible:ring-offset-1',
              config.iconColor.replace('text-', 'focus-visible:ring-')
            )}
            aria-label={t('errors.titles.closeError')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Progress bar for rate limiting */}
      {error.isRateLimitError && error.retryAfter > 0 && (
        <div className="relative h-1 w-full bg-orange-100/50">
          <div 
            className="absolute inset-y-0 left-0 bg-orange-400 transition-all duration-1000 ease-linear"
            style={{ 
              width: `${(error.retryAfter / (error.error?.retryAfterSeconds || 1)) * 100}%`,
              right: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline form errors
 */
interface AuthErrorInlineProps {
  message: string;
  className?: string;
}

export function AuthErrorInline({ message, className }: AuthErrorInlineProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-2 text-sm text-red-500',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Field error display for form validation
 */
interface AuthFieldErrorProps {
  error?: string;
  className?: string;
}

export function AuthFieldError({ error, className }: AuthFieldErrorProps) {
  if (!error) return null;

  return (
    <p className={cn('mt-1.5 text-xs text-red-500', className)} role="alert">
      {error}
    </p>
  );
}

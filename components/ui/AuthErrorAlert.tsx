/**
 * AuthErrorAlert - Modern animated error display component
 * 
 * Features:
 * - Smooth slide-in and bounce animations
 * - Vibrant gradient backgrounds
 * - Animated icons with pulse effects
 * - Glassmorphism with enhanced shadows
 * - Progress bar with gradient animation
 * - Better typography and spacing
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
  UserX,
  AlertTriangle,
  Info
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

// Enhanced error configurations with better styling
const ERROR_CONFIGS: Record<string, { 
  icon: React.ElementType; 
  gradient: string;
  shadow: string;
  iconBg: string;
  titleColor: string;
  titleKey: string;
  pulseColor: string;
}> = {
  [AUTH_ERROR_CODES.LOGIN_INVALID_CREDENTIALS]: {
    icon: AlertCircle,
    gradient: 'from-red-500/10 via-red-400/5 to-orange-400/10',
    shadow: 'shadow-red-500/20',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    titleColor: 'text-red-600',
    titleKey: 'errors.titles.invalidCredentials',
    pulseColor: 'bg-red-400',
  },
  [AUTH_ERROR_CODES.LOGIN_ACCOUNT_LOCKED]: {
    icon: Lock,
    gradient: 'from-amber-500/10 via-yellow-400/5 to-orange-400/10',
    shadow: 'shadow-amber-500/20',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    titleColor: 'text-amber-600',
    titleKey: 'errors.titles.accountLocked',
    pulseColor: 'bg-amber-400',
  },
  [AUTH_ERROR_CODES.LOGIN_ACCOUNT_LOCKED_RETRY]: {
    icon: Clock,
    gradient: 'from-amber-500/10 via-yellow-400/5 to-orange-400/10',
    shadow: 'shadow-amber-500/20',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    titleColor: 'text-amber-600',
    titleKey: 'errors.titles.accountLockedRetry',
    pulseColor: 'bg-amber-400',
  },
  [AUTH_ERROR_CODES.LOGIN_ACCOUNT_BANNED]: {
    icon: UserX,
    gradient: 'from-red-600/10 via-red-500/5 to-rose-400/10',
    shadow: 'shadow-red-600/30',
    iconBg: 'bg-gradient-to-br from-red-600 to-rose-600',
    titleColor: 'text-red-700',
    titleKey: 'errors.titles.accountBanned',
    pulseColor: 'bg-red-500',
  },
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    icon: Clock,
    gradient: 'from-orange-500/10 via-amber-400/5 to-yellow-400/10',
    shadow: 'shadow-orange-500/20',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    titleColor: 'text-orange-600',
    titleKey: 'errors.titles.rateLimit',
    pulseColor: 'bg-orange-400',
  },
  [AUTH_ERROR_CODES.NETWORK_ERROR]: {
    icon: WifiOff,
    gradient: 'from-gray-500/10 via-slate-400/5 to-gray-400/10',
    shadow: 'shadow-gray-500/20',
    iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600',
    titleColor: 'text-gray-600',
    titleKey: 'errors.titles.networkError',
    pulseColor: 'bg-gray-400',
  },
  [AUTH_ERROR_CODES.NETWORK_OFFLINE]: {
    icon: WifiOff,
    gradient: 'from-gray-500/10 via-slate-400/5 to-gray-400/10',
    shadow: 'shadow-gray-500/20',
    iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600',
    titleColor: 'text-gray-600',
    titleKey: 'errors.titles.offline',
    pulseColor: 'bg-gray-400',
  },
  [AUTH_ERROR_CODES.SERVER_PROXY_ERROR]: {
    icon: ServerOff,
    gradient: 'from-rose-500/10 via-red-400/5 to-pink-400/10',
    shadow: 'shadow-rose-500/20',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    titleColor: 'text-rose-600',
    titleKey: 'errors.titles.serverError',
    pulseColor: 'bg-rose-400',
  },
  [AUTH_ERROR_CODES.SERVER_UNAVAILABLE]: {
    icon: ServerOff,
    gradient: 'from-rose-500/10 via-red-400/5 to-pink-400/10',
    shadow: 'shadow-rose-500/20',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    titleColor: 'text-rose-600',
    titleKey: 'errors.titles.serviceUnavailable',
    pulseColor: 'bg-rose-400',
  },
  default: {
    icon: AlertTriangle,
    gradient: 'from-red-500/10 via-orange-400/5 to-red-400/10',
    shadow: 'shadow-red-500/20',
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    titleColor: 'text-red-600',
    titleKey: 'errors.titles.generic',
    pulseColor: 'bg-red-400',
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
  const [progress, setProgress] = useState(100);

  const config = getErrorConfig(error.error?.code);
  const Icon = config.icon;
  const title = t(config.titleKey as any);

  useEffect(() => {
    if (error.hasError) {
      setIsVisible(true);
      setIsExiting(false);
      setProgress(100);
    }
  }, [error.hasError, error.error?.code]);

  // Animate progress bar for rate limiting
  useEffect(() => {
    if (error.isRateLimitError && error.retryAfter > 0) {
      const totalSeconds = error.error?.retryAfterSeconds || error.retryAfter;
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = (error.retryAfter / totalSeconds) * 100;
          return newProgress;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [error.isRateLimitError, error.retryAfter, error.error?.retryAfterSeconds]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      error.clearError();
      onDismiss?.();
    }, 300);
  };

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
        'relative overflow-hidden rounded-xl border-0 backdrop-blur-xl',
        'bg-gradient-to-br',
        config.gradient,
        config.shadow,
        'shadow-lg',
        'transition-all duration-300 ease-out',
        isExiting 
          ? 'opacity-0 translate-y-[-20px] scale-95' 
          : 'opacity-100 translate-y-0 scale-100 animate-error-slide-in',
        className
      )}
    >
      {/* Animated pulse ring */}
      <div className={cn(
        'absolute inset-0 rounded-xl opacity-20',
        'animate-pulse-ring',
        config.pulseColor
      )} />
      
      {/* Inner glow */}
      <div className="absolute inset-0 bg-white/60" />
      
      <div className="relative flex items-start gap-4 p-5">
        {/* Animated icon container */}
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          config.iconBg,
          'shadow-lg',
          'animate-icon-bounce'
        )}>
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          
          {/* Ripple effect */}
          <div className={cn(
            'absolute inset-0 rounded-xl animate-ripple',
            config.pulseColor,
            'opacity-30'
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h3 className={cn('text-base font-bold', config.titleColor)}>
              {title}
            </h3>
            
            {/* Live indicator for rate limiting */}
            {error.isRateLimitError && (
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </div>
          
          <p className="mt-2 text-sm text-gray-700 leading-relaxed font-medium">
            {error.errorMessage}
          </p>
          
          {/* Enhanced countdown for rate limiting */}
          {error.isRateLimitError && error.retryAfter > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm">
                <Clock className="h-4 w-4 text-orange-500 animate-spin-slow" aria-hidden="true" />
                <span className="text-sm font-bold text-orange-600 tabular-nums">
                  {formatCountdown(error.retryAfter)}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {t('errors.titles.retryIn')}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced dismiss button */}
        {showDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'shrink-0 rounded-full p-2 transition-all duration-200',
              'hover:bg-black/10 hover:scale-110',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'focus-visible:ring-gray-400',
              'active:scale-95'
            )}
            aria-label={t('errors.titles.closeError')}
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Enhanced progress bar for rate limiting */}
      {error.isRateLimitError && error.retryAfter > 0 && (
        <div className="relative h-1.5 w-full overflow-hidden bg-gray-200/50">
          <div 
            className={cn(
              'absolute inset-y-0 left-0 rounded-r-full',
              'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500',
              'transition-all duration-1000 ease-linear'
            )}
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes error-slide-in {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          60% {
            transform: translateY(8px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes icon-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        @keyframes pulse-ring {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.1;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-error-slide-in {
          animation: error-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-icon-bounce {
          animation: icon-bounce 2s ease-in-out infinite;
        }

        .animate-ripple {
          animation: ripple 2s ease-out infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Compact inline error - enhanced version
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
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gradient-to-r from-red-50 to-red-100/50',
        'border border-red-200/50',
        'animate-inline-shake',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
      <span className="text-sm font-medium text-red-600">{message}</span>
    </div>
  );
}

/**
 * Field error - enhanced with animation
 */
interface AuthFieldErrorProps {
  error?: string;
  className?: string;
}

export function AuthFieldError({ error, className }: AuthFieldErrorProps) {
  if (!error) return null;

  return (
    <div 
      className={cn(
        'flex items-center gap-1.5 mt-2',
        'animate-fade-in-up',
        className
      )} 
      role="alert"
    >
      <Info className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden="true" />
      <p className="text-xs font-semibold text-red-500">{error}</p>
    </div>
  );
}

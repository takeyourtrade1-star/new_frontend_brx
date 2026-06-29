'use client';

import { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface SupportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTitle: string;
  orderId: string;
  onSubmit: (payload: { title: string; description: string }) => void;
}

export function SupportRequestModal({
  isOpen,
  onClose,
  orderTitle,
  orderId,
  onSubmit,
}: SupportRequestModalProps) {
  const { t } = useTranslation();
  const defaultTitle = t('support.titleDefault', { id: orderId.slice(0, 8) });
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError(t('support.errorDescription'));
      return;
    }
    setError(null);
    onSubmit({ title: title.trim(), description: description.trim() });
    setDescription('');
    setTitle(defaultTitle);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
            <h2 className="text-base font-bold uppercase tracking-wide text-gray-900">
              {t('support.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <div className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {t('support.orderLabel')} <span className="font-semibold text-gray-900">{orderTitle}</span>
          </div>

          <div className="mb-4">
            <label htmlFor="support-title" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700">
              {t('support.fieldTitle')}
            </label>
            <input
              id="support-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="support-description" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700">
              {t('support.fieldDescription')}
            </label>
            <textarea
              id="support-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('support.placeholder')}
              className={cn(
                'w-full resize-none rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1',
                error
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-300'
                  : 'border-gray-300 focus:border-[#FF7300] focus:ring-[#FF7300]',
              )}
            />
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#FF7300] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e56500] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
            >
              <Send className="h-4 w-4" aria-hidden />
              {t('support.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

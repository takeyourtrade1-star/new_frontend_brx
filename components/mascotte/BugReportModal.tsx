'use client';

import type { Dispatch, FormEvent, FocusEvent, SetStateAction } from 'react';
import { Bug, Camera, CheckCircle2, FileText, ImageIcon, Send, X } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import {
  getCapturedLogs,
  getRecentLogs,
} from '@/lib/dev/log-capture';
import { BUG_MODAL_FADE_MS } from '@/components/mascotte/constants';

export type BugFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  bugType: string;
  priority: string;
  url: string;
};

export interface BugReportModalProps {
  variant: 'mobile' | 'desktop';
  zIndex: number;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  submitted: boolean;
  bugForm: BugFormState;
  setBugForm: Dispatch<SetStateAction<BugFormState>>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onCancel: () => void;
  screenshot: string | null;
  onRemoveScreenshot: () => void;
  onCaptureScreenshot: () => void;
  isCapturing: boolean;
  hasConsoleLogs: boolean;
  showConsoleLogs: boolean;
  setShowConsoleLogs: Dispatch<SetStateAction<boolean>>;
  onFormFocusCapture?: (e: FocusEvent<HTMLFormElement>) => void;
  onFormBlurCapture?: (e: FocusEvent<HTMLFormElement>) => void;
}

export function BugReportModal({
  variant,
  zIndex,
  t,
  submitted,
  bugForm,
  setBugForm,
  onSubmit,
  onClose,
  onCancel,
  screenshot,
  onRemoveScreenshot,
  onCaptureScreenshot,
  isCapturing,
  hasConsoleLogs,
  showConsoleLogs,
  setShowConsoleLogs,
  onFormFocusCapture,
  onFormBlurCapture,
}: BugReportModalProps) {
  const isDesktop = variant === 'desktop';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      style={
        isDesktop
          ? {
              zIndex,
              animation: `bugModalBackdropIn ${BUG_MODAL_FADE_MS}ms ease-out forwards`,
            }
          : { zIndex }
      }
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
        style={
          isDesktop
            ? {
                animation: `bugModalPanelIn ${BUG_MODAL_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
              }
            : undefined
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-comodo text-lg tracking-wide text-black">{t('asso.bugReport.title')}</h3>
              <p className="text-xs text-gray-500">
                {isDesktop ? t('asso.bugReport.subtitleBrx') : t('asso.bugReport.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {!submitted ? (
          <form
            onSubmit={onSubmit}
            onFocusCapture={onFormFocusCapture}
            onBlurCapture={onFormBlurCapture}
            className="max-h-[70vh] overflow-y-auto pr-2"
          >
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">{t('asso.bugReport.nameLabel')}</label>
                <input
                  type="text"
                  required
                  value={bugForm.name}
                  onChange={(e) => setBugForm({ ...bugForm, name: e.target.value })}
                  placeholder={t('asso.bugReport.namePlaceholder')}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">{t('registerForm.emailLabel')}</label>
                <input
                  type="email"
                  required
                  value={bugForm.email}
                  onChange={(e) => setBugForm({ ...bugForm, email: e.target.value })}
                  placeholder={t('asso.bugReport.emailPlaceholder')}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            {isDesktop && (
              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">{t('asso.bugReport.typeLabel')}</label>
                  <select
                    value={bugForm.bugType}
                    onChange={(e) => setBugForm({ ...bugForm, bugType: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="functional">{t('asso.bugReport.type.functional')}</option>
                    <option value="visual">{t('asso.bugReport.type.visual')}</option>
                    <option value="performance">{t('asso.bugReport.type.performance')}</option>
                    <option value="payment">{t('asso.bugReport.type.payment')}</option>
                    <option value="other">{t('asso.bugReport.type.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">{t('asso.bugReport.priorityLabel')}</label>
                  <select
                    value={bugForm.priority}
                    onChange={(e) => setBugForm({ ...bugForm, priority: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="low">{t('asso.bugReport.priority.low')}</option>
                    <option value="medium">{t('asso.bugReport.priority.medium')}</option>
                    <option value="high">{t('asso.bugReport.priority.high')}</option>
                  </select>
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-700">{t('asso.bugReport.subjectLabel')}</label>
              <input
                type="text"
                required
                value={bugForm.subject}
                onChange={(e) => setBugForm({ ...bugForm, subject: e.target.value })}
                placeholder={t('asso.bugReport.subjectPlaceholder')}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-700">{t('asso.bugReport.descriptionLabel')}</label>
              <textarea
                required
                value={bugForm.message}
                onChange={(e) => setBugForm({ ...bugForm, message: e.target.value })}
                placeholder={t('asso.bugReport.descriptionPlaceholder')}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {isDesktop && (
              <>
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">{t('asso.bugReport.urlLabel')}</label>
                  <input
                    type="url"
                    value={bugForm.url}
                    onChange={(e) => setBugForm({ ...bugForm, url: e.target.value })}
                    placeholder={t('asso.bugReport.urlPlaceholder')}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('asso.bugReport.urlHint')}</p>
                </div>
                {screenshot && (
                  <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-gray-600">{t('asso.bugReport.screenshotAttached')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={onRemoveScreenshot}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        {t('asso.bugReport.removeScreenshot')}
                      </button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL screenshot preview */}
                    <img src={screenshot} alt={t('asso.bugReport.screenshotAlt')} className="max-h-32 rounded-lg object-contain" />
                  </div>
                )}
                {hasConsoleLogs && (
                  <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                          {t('asso.bugReport.consoleLogsAvailable', { count: getRecentLogs(60).length })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConsoleLogs(!showConsoleLogs)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {showConsoleLogs ? t('asso.bugReport.hideConsoleLogs') : t('asso.bugReport.showConsoleLogs')}
                      </button>
                    </div>
                    {showConsoleLogs && getCapturedLogs().length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded border border-blue-200 bg-white p-2 font-mono text-xs">
                        {getRecentLogs(60).map((log, i) => (
                          <div
                            key={i}
                            className={`mb-1 border-b border-gray-100 pb-1 last:border-0 ${
                              log.type === 'error'
                                ? 'text-red-600'
                                : log.type === 'warn'
                                  ? 'text-yellow-600'
                                  : 'text-gray-700'
                            }`}
                          >
                            <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                            <span className="opacity-75">[{log.type.toUpperCase()}]</span> {log.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onCaptureScreenshot}
                    disabled={isCapturing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {isCapturing ? t('asso.bugReport.capturing') : t('asso.bugReport.takeScreenshot')}
                  </button>
                </div>
              </>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={
                  !bugForm.message.trim() ||
                  !bugForm.name.trim() ||
                  !bugForm.email.trim() ||
                  !bugForm.subject.trim()
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isDesktop ? t('asso.bugReport.submit') : t('asso.bugReport.submitShort')}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              {isDesktop ? (
                <Send className="h-6 w-6 text-green-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
            </div>
            <p className="font-medium text-black">{t('asso.bugReport.successTitle')}</p>
            <p className="text-sm text-gray-500">{t('asso.bugReport.successBody')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

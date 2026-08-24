'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import {
  submitSupportCase,
  SupportCaseSubmissionError,
} from '@/lib/support/submit-support-case';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface SupportCaseFormProps {
  sectionId: string;
  sectionTitle: string;
  consultedFaqIds: readonly string[];
  responseTime?: string;
}

export function SupportCaseForm({
  sectionId,
  sectionTitle,
  consultedFaqIds,
  responseTime,
}: SupportCaseFormProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState(t('support.case.subjectDefault', { section: sectionTitle }));
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const createdCaseId = await submitSupportCase({
        category: 'general_support',
        subject: subject.trim(),
        description: description.trim(),
        referenceType: 'page',
        referenceId: `help:${sectionId}`.slice(0, 128),
        referenceLabel: sectionTitle.slice(0, 200),
        context: {
          sourcePath: '/aiuto',
          consultedFaqIds: [...consultedFaqIds],
        },
      });
      setCaseId(createdCaseId);
    } catch (caught) {
      setError(
        caught instanceof SupportCaseSubmissionError
          ? t(caught.code === 'unauthorized' ? 'support.case.loginRequired' : 'support.case.genericError')
          : t('support.case.genericError'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (caseId) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center" role="status">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        <div>
          <p className="font-semibold text-white">{t('support.case.sentTitle')}</p>
          <p className="mt-1 text-xs text-white/60">{t('support.case.caseCode', { id: caseId })}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">{t('support.case.title')}</h3>
        {responseTime ? (
          <p className="mt-1 text-sm text-white/60">{t('support.case.estimatedResponse', { time: responseTime })}</p>
        ) : null}
      </div>

      <label className="block text-sm text-white/80">
        {t('support.case.subjectLabel')}
        <input
          required
          minLength={3}
          maxLength={200}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#FF7300]"
        />
      </label>

      <label className="block text-sm text-white/80">
        {t('support.case.descriptionLabel')}
        <textarea
          required
          minLength={1}
          maxLength={5000}
          rows={6}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 w-full resize-y rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#FF7300]"
          placeholder={t('support.case.descriptionPlaceholder')}
        />
      </label>

      {error ? <p className="text-sm text-red-200" role="alert">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || subject.trim().length < 3 || !description.trim()}
        className="mx-auto flex items-center gap-2 rounded-xl bg-[#FF7300] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[#FF7300]/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitting ? t('support.case.sending') : t('support.case.send')}
      </button>
    </form>
  );
}

export type SupportCaseCategory = 'order_support' | 'bug_report' | 'general_support';

export interface SupportCasePayload {
  category: SupportCaseCategory;
  subject: string;
  description: string;
  referenceType?: 'order' | 'page' | 'account' | 'other';
  referenceId?: string;
  referenceLabel?: string;
  context?: {
    bugType?: 'functional' | 'visual' | 'performance' | 'payment' | 'other';
    clientPriority?: 'low' | 'medium' | 'high';
    sourcePath?: string;
    consultedFaqIds?: string[];
  };
}

export class SupportCaseSubmissionError extends Error {
  readonly code: 'unauthorized' | 'failed';

  constructor(code: 'unauthorized' | 'failed') {
    super(code);
    this.name = 'SupportCaseSubmissionError';
    this.code = code;
  }
}

export async function submitSupportCase(payload: SupportCasePayload): Promise<string> {
  const response = await fetch('/api/support/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({
      ...payload,
      idempotencyKey: crypto.randomUUID(),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    caseId?: string;
    detail?: string;
  };
  if (response.status === 401) {
    throw new SupportCaseSubmissionError('unauthorized');
  }
  if (!response.ok || !data.caseId) {
    throw new SupportCaseSubmissionError('failed');
  }
  return data.caseId;
}

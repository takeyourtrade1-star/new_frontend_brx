'use client';

import { Bug, HelpCircle, MessageSquare, X } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import type { useAssoTypewriter } from '@/hooks/useAssoTypewriter';

export type AssoChatMessage = { type: 'asso' | 'user'; text: string };

export type AssoChatStep = 'greeting' | 'menu' | 'bug' | 'contact';

type ChatTypewriter = Pick<
  ReturnType<typeof useAssoTypewriter>,
  'displayedText' | 'isTyping' | 'skip'
>;

export interface AssoChatModalProps {
  zIndex: number;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  chatMessages: AssoChatMessage[];
  isTyping: boolean;
  chatTypewriter: ChatTypewriter;
  chatStep: AssoChatStep;
  showFooter?: boolean;
  onClose: () => void;
  onFaqClick: () => void;
  onBugClick: () => void;
  onSupportClick: () => void;
}

export function AssoChatModal({
  zIndex,
  t,
  chatMessages,
  isTyping,
  chatTypewriter,
  chatStep,
  showFooter = false,
  onClose,
  onFaqClick,
  onBugClick,
  onSupportClick,
}: AssoChatModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-end p-4 sm:items-center sm:justify-center"
      style={{ zIndex }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <div>
              <h3 className="font-comodo text-base font-medium text-zinc-900">{t('asso.name')}</h3>
              <p className="text-xs text-zinc-500">{t('asso.assistantLabel')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[360px] min-h-[320px] overflow-y-auto bg-zinc-50 p-4">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex chat-message-in ${msg.type === 'asso' ? 'justify-start' : 'justify-end'}`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.type === 'asso'
                    ? 'rounded-tl-none bg-white text-zinc-800 border border-zinc-200'
                    : 'rounded-tr-none bg-primary text-white'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="mb-3 flex justify-start chat-message-in">
              <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white border border-zinc-200 px-4 py-3">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {chatTypewriter.isTyping && chatTypewriter.displayedText && (
            <div
              className="mb-3 flex cursor-pointer justify-start chat-message-in"
              role="button"
              tabIndex={0}
              onClick={() => chatTypewriter.skip()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') chatTypewriter.skip();
              }}
              title={t('asso.chat.showFullMessage')}
            >
              <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-zinc-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-zinc-800">
                {chatTypewriter.displayedText}
                <span className="asso-typewriter-cursor typing-cursor ml-0.5 inline-block h-4 w-0.5 bg-primary" />
              </div>
            </div>
          )}
          {chatStep === 'menu' && (
            <div className="mt-4 space-y-2">
              <button
                onClick={onFaqClick}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50 menu-option-in"
                style={{ animationDelay: '0ms' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{t('asso.chat.faq')}</p>
                  <p className="text-xs text-zinc-500">{t('asso.chat.faqHint')}</p>
                </div>
              </button>
              <button
                onClick={onBugClick}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50 menu-option-in"
                style={{ animationDelay: '80ms' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <Bug className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{t('asso.chat.bug')}</p>
                  <p className="text-xs text-zinc-500">{t('asso.chat.bugHint')}</p>
                </div>
              </button>
              <button
                onClick={onSupportClick}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50 menu-option-in"
                style={{ animationDelay: '160ms' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{t('asso.chat.support')}</p>
                  <p className="text-xs text-zinc-500">{t('asso.chat.supportHint')}</p>
                </div>
              </button>
            </div>
          )}
        </div>
        {showFooter && (
          <div className="border-t border-zinc-200 bg-white px-4 py-3">
            <p className="text-center text-xs text-zinc-400">{t('asso.chat.chooseOption')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

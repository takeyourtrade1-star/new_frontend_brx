'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Mail,
  HelpCircle,
  User,
  UserPlus,
  ShoppingCart,
  Tag,
  Gavel,
  ArrowLeftRight,
  Trophy,
  Zap,
  Truck,
  CreditCard,
  Shield,
  RefreshCw,
  Camera,
  Gem,
  Bug,
  CircleHelp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  SUPPORT_WORKFLOW,
  getSectionById,
  searchFAQs,
  type WorkflowSection,
  type FAQGroup,
  type FAQItem,
} from '@/lib/support-workflow-data';
import { SupportCaseForm } from '@/components/support/SupportCaseForm';

/* ──────────────────────────────────────────────────────────────────
   ICON MAP — maps JSON icon field → Lucide component
   ────────────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  user: User,
  'user-plus': UserPlus,
  'shopping-cart': ShoppingCart,
  tag: Tag,
  gavel: Gavel,
  'exchange-alt': ArrowLeftRight,
  trophy: Trophy,
  'shipping-fast': Zap,
  truck: Truck,
  'credit-card': CreditCard,
  'shield-alt': Shield,
  sync: RefreshCw,
  camera: Camera,
  gem: Gem,
  bug: Bug,
};

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? HelpCircle;
}

/* ──────────────────────────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────────────────────────── */
type ViewState =
  | { view: 'home' }
  | { view: 'section'; sectionId: string }
  | { view: 'decision-tree'; step: number }
  | { view: 'escalation'; sectionId: string; consultedFaqIds: string[] }
  | { view: 'search-results'; query: string };

/* ──────────────────────────────────────────────────────────────────
   GLASS CARD — reusable style wrapper
   ────────────────────────────────────────────────────────────────── */
function GlassCard({
  children,
  className = '',
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm ${
        animate ? 'animate-slide-up' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   FAQ ANSWER RENDERERS — handles each answer_type from the JSON
   ────────────────────────────────────────────────────────────────── */
function renderSteps(steps: string[]) {
  return (
    <ol className="space-y-2 pl-0">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF7300]/20 text-xs font-bold text-[#FF7300]">
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed text-white/90">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function renderChecklist(checklist: Array<{ check: string; detail: string }>) {
  return (
    <ul className="space-y-3">
      {checklist.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-white">{item.check}</p>
            <p className="text-xs text-white/60">{item.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function renderTips(tips: string[]) {
  return (
    <ul className="space-y-2">
      {tips.map((tip, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-white/90">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF7300]" />
          {tip}
        </li>
      ))}
    </ul>
  );
}

function renderTable(
  headers: string[],
  rows: Array<Record<string, string>>,
  keys: string[]
) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/70">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-b-0">
              {keys.map((k) => (
                <td key={k} className="px-4 py-2.5 text-white/80">
                  {row[k] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Renders any FAQ answer based on its answer_type + available fields */
function FAQAnswer({ faq }: { faq: FAQItem }) {
  return (
    <div className="space-y-4">
      {/* Urgency badge */}
      {faq.urgency === 'high' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Priorità alta</span>
        </div>
      )}

      {/* Warning */}
      {faq.warning && (
        <div className="rounded-lg bg-amber-500/15 px-4 py-3 text-sm text-amber-200">
          <span className="font-semibold">⚠️ Attenzione: </span>
          {faq.warning}
        </div>
      )}

      {/* Important note */}
      {faq.important_note && (
        <div className="rounded-lg bg-blue-500/15 px-4 py-3 text-sm text-blue-200">
          <span className="font-semibold">ℹ️ Nota: </span>
          {faq.important_note}
        </div>
      )}

      {/* Explanation / description */}
      {faq.explanation && (
        <p className="text-sm leading-relaxed text-white/80">{faq.explanation}</p>
      )}
      {faq.description && typeof faq.description === 'string' && (
        <p className="text-sm leading-relaxed text-white/80">{faq.description}</p>
      )}

      {/* Direct text answer */}
      {faq.answer && typeof faq.answer === 'string' && (
        <p className="text-sm leading-relaxed text-white/80">{faq.answer}</p>
      )}

      {/* Steps */}
      {faq.steps && faq.steps.length > 0 && renderSteps(faq.steps)}

      {/* Resolution steps */}
      {faq.resolution_steps && faq.resolution_steps.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Come risolvere
          </p>
          {renderSteps(faq.resolution_steps)}
        </div>
      )}

      {/* Checklist */}
      {faq.checklist && faq.checklist.length > 0 && renderChecklist(faq.checklist)}

      {/* Tips */}
      {faq.tips && faq.tips.length > 0 && renderTips(faq.tips)}

      {/* Uses / key_points / coverage / mechanism */}
      {faq.uses && renderTips(faq.uses)}
      {faq.key_points && renderTips(faq.key_points)}
      {faq.coverage && faq.coverage.length > 0 && renderTips(faq.coverage)}
      {faq.mechanism && renderTips(faq.mechanism)}
      {faq.security_measures && renderTips(faq.security_measures)}
      {faq.features && renderTips(faq.features)}
      {faq.components && renderTips(faq.components)}
      {faq.technical_details && renderTips(faq.technical_details)}
      {faq.prevention_tips && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Come prevenire
          </p>
          {renderTips(faq.prevention_tips)}
        </div>
      )}
      {faq.prevention && renderTips(faq.prevention)}

      {/* Flow (vendite pagamenti) */}
      {faq.flow && faq.flow.length > 0 && renderSteps(faq.flow)}

      {/* Workflow summary (BRX Express) */}
      {faq.workflow_summary && renderSteps(faq.workflow_summary)}

      {/* Definition */}
      {faq.definition && (
        <p className="text-sm italic text-white/70">{faq.definition}</p>
      )}
      {faq.cause && (
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white/90">Causa: </span>
          {faq.cause}
        </p>
      )}

      {/* How to */}
      {faq.how_to && (
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white/90">Come fare: </span>
          {faq.how_to}
        </p>
      )}
      {faq.how_to_access && (
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white/90">Come accedere: </span>
          {faq.how_to_access}
        </p>
      )}

      {/* Limitations */}
      {faq.limitations && (
        <p className="text-sm text-white/70 italic">{faq.limitations}</p>
      )}

      {/* Available filters */}
      {faq.available_filters && renderTips(faq.available_filters)}

      {/* Alternatives */}
      {faq.alternatives && faq.alternatives.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Alternative
          </p>
          {renderTips(faq.alternatives)}
        </div>
      )}

      {/* Options (shipping methods) */}
      {faq.options && Array.isArray(faq.options) && (
        <div className="space-y-3">
          {(faq.options as Array<{ method: string; description: string }>).map(
            (opt, i) => (
              <div
                key={i}
                className="rounded-lg bg-white/5 px-4 py-3"
              >
                <p className="text-sm font-semibold text-white">{opt.method}</p>
                <p className="text-xs text-white/70">{opt.description}</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Packaging requirements */}
      {faq.packaging_requirements && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Requisiti imballaggio
          </p>
          {renderTips(faq.packaging_requirements)}
        </div>
      )}

      {/* Materials needed */}
      {faq.materials_needed && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Materiali necessari
          </p>
          {renderTips(faq.materials_needed)}
        </div>
      )}

      {/* Tables — shipping times */}
      {faq.times && faq.times.length > 0 &&
        renderTable(
          ['Destinazione', 'Standard', 'BRX Express'],
          faq.times as unknown as Array<Record<string, string>>,
          ['destination', 'standard', 'brx_express']
        )}

      {/* Tables — fees */}
      {faq.fees && faq.fees.length > 0 &&
        renderTable(
          ['Tipo', 'Importo', 'Note'],
          faq.fees as unknown as Array<Record<string, string>>,
          ['type', 'amount', 'note']
        )}

      {/* Tables — costs */}
      {faq.costs && faq.costs.length > 0 &&
        renderTable(
          ['Voce', 'Costo', 'Note'],
          faq.costs as unknown as Array<Record<string, string>>,
          ['item', 'cost', 'note']
        )}

      {/* Tables — conditions */}
      {faq.conditions && faq.conditions.length > 0 &&
        renderTable(
          ['Codice', 'Nome', 'Descrizione', 'Prezzo'],
          faq.conditions as unknown as Array<Record<string, string>>,
          ['code', 'name', 'description', 'price_adjustment']
        )}

      {/* Tables — dispute timelines */}
      {faq.timelines && faq.timelines.length > 0 &&
        renderTable(
          ['Tipo caso', 'Tempo'],
          faq.timelines as unknown as Array<Record<string, string>>,
          ['type', 'time']
        )}

      {/* Timeline — dispute phases */}
      {faq.phases && faq.phases.length > 0 && (
        <div className="space-y-3">
          {faq.phases.map((phase, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF7300]/20">
                <Clock className="h-4 w-4 text-[#FF7300]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {phase.phase}
                  </p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                    {phase.time}
                  </span>
                </div>
                <p className="text-xs text-white/70">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Benefits list */}
      {faq.benefits && faq.benefits.length > 0 && (
        <div className="space-y-3">
          {faq.benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white">{b.benefit}</p>
                <p className="text-xs text-white/60">{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Methods list (payment) */}
      {faq.methods && Array.isArray(faq.methods) && faq.answer_type === 'list' && (
        <div className="space-y-3">
          {(faq.methods as unknown as Array<Record<string, string>>).map((m, i) => (
            <div key={i} className="rounded-lg bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{m.method}</p>
                <span className="text-xs text-[#FF7300]">{m.processing}</span>
              </div>
              <p className="text-xs text-white/70">{m.types}</p>
              {m.restriction && (
                <p className="mt-1 text-xs italic text-amber-300/70">
                  {m.restriction}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Methods table (shipping) */}
      {faq.methods && Array.isArray(faq.methods) && faq.answer_type === 'table' &&
        renderTable(
          ['Metodo', 'Italia', 'Europa', 'Tracking', 'Note'],
          faq.methods as unknown as Array<Record<string, string>>,
          ['method', 'time_it', 'time_eu', 'tracking', 'note']
        )}

      {/* Types list (tornei) */}
      {faq.types && Array.isArray(faq.types) && (
        <div className="space-y-3">
          {(faq.types as Array<{ type: string; description: string }>).map(
            (t, i) => (
              <div key={i} className="rounded-lg bg-white/5 px-4 py-3">
                <p className="text-sm font-semibold text-white">{t.type}</p>
                <p className="text-xs text-white/70">{t.description}</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Tabs (scambi) */}
      {faq.tabs && faq.tabs.length > 0 && (
        <div className="space-y-2">
          {faq.tabs.map((tab, i) => (
            <div key={i} className="rounded-lg bg-white/5 px-4 py-3">
              <p className="text-sm font-semibold text-white">{tab.name}</p>
              <p className="text-xs text-white/70">{tab.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Navigation (scambi) */}
      {faq.navigation && (
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white/90">Navigazione: </span>
          {faq.navigation}
        </p>
      )}

      {/* Protection list */}
      {faq.protection && renderTips(faq.protection as unknown as string[])}

      {/* Verification levels */}
      {faq.levels && faq.levels.length > 0 && (
        <div className="space-y-3">
          {faq.levels.map((level, i) => (
            <div key={i} className="rounded-lg bg-white/5 px-4 py-3">
              <p className="text-sm font-semibold text-white">{level.level}</p>
              <p className="text-xs text-white/70">{level.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Browsers */}
      {faq.browsers && faq.browsers.length > 0 &&
        renderTable(
          ['Browser', 'Stato', 'Versione minima'],
          faq.browsers as unknown as Array<Record<string, string>>,
          ['browser', 'status', 'min_version']
        )}
      {faq.not_supported && (
        <p className="text-sm text-red-300/80">❌ {faq.not_supported}</p>
      )}

      {/* Standard rule + exceptions */}
      {faq.standard_rule && (
        <p className="text-sm text-white/80">{faq.standard_rule}</p>
      )}
      {faq.exceptions && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/60">
            Eccezioni
          </p>
          {renderTips(faq.exceptions)}
        </div>
      )}

      {/* Exclusions */}
      {faq.exclusions && (
        <p className="mt-2 text-xs italic text-white/60">{faq.exclusions}</p>
      )}

      {/* Report template */}
      {faq.report_template && (
        <div className="rounded-lg bg-white/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Template segnalazione
          </p>
          <div className="space-y-2">
            {Object.entries(faq.report_template).map(([key, val]) => (
              <div key={key}>
                <span className="text-xs font-semibold text-[#FF7300]">
                  {key.replace(/_/g, ' ')}:
                </span>{' '}
                <span className="text-xs text-white/70">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {faq.where_to_send && (
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white/90">Dove inviare: </span>
          {faq.where_to_send}
        </p>
      )}
      {faq.welcome && (
        <p className="text-sm text-emerald-300/80">{faq.welcome}</p>
      )}

      {/* From TOS */}
      {faq.from_tos && (
        <blockquote className="border-l-2 border-white/20 pl-3 text-xs italic text-white/60">
          {faq.from_tos}
        </blockquote>
      )}

      {/* Importance label */}
      {faq.importance && (
        <p className="text-xs font-bold uppercase text-amber-300">{faq.importance}</p>
      )}

      {/* Golden rule */}
      {faq.golden_rule && (
        <div className="rounded-lg bg-[#FF7300]/15 px-4 py-3 text-sm text-[#FF7300]">
          <span className="font-bold">Regola d&apos;oro: </span>
          {faq.golden_rule}
        </div>
      )}

      {/* Grading companies */}
      {faq.grading_companies && renderTips(faq.grading_companies)}

      {/* Disclaimer */}
      {faq.disclaimer && (
        <p className="text-xs italic text-white/50">{faq.disclaimer}</p>
      )}

      {/* Warning points */}
      {faq.points && faq.answer_type === 'warning' && (
        <div className="rounded-lg bg-amber-500/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            ⚠️ Rischi e limitazioni
          </p>
          <ul className="space-y-2">
            {faq.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-200/80">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback */}
      {faq.fallback && (
        <p className="text-sm text-white/70">
          <span className="font-semibold text-white/90">Alternativa: </span>
          {faq.fallback}
        </p>
      )}

      {/* Timeline string */}
      {faq.timeline && (
        <p className="flex items-center gap-2 text-xs text-white/60">
          <Clock className="h-3.5 w-3.5" />
          {faq.timeline}
        </p>
      )}

      {/* Normal timeline */}
      {faq.normal_timeline && (
        <p className="flex items-center gap-2 text-xs text-white/60">
          <Clock className="h-3.5 w-3.5" />
          {faq.normal_timeline}
        </p>
      )}

      {/* Deadline */}
      {faq.deadline && (
        <p className="flex items-center gap-2 text-xs text-white/60">
          <Clock className="h-3.5 w-3.5" />
          {faq.deadline}
        </p>
      )}

      {/* Tip */}
      {faq.tip && (
        <p className="text-sm text-emerald-300/80">💡 {faq.tip}</p>
      )}

      {/* Troubleshooting */}
      {faq.troubleshooting && (
        <div className="rounded-lg bg-white/5 p-4">
          <p className="mb-2 text-sm font-semibold text-white">
            {faq.troubleshooting.title}
          </p>
          {renderChecklist(
            faq.troubleshooting.checks.map((c) => ({
              check: c,
              detail: '',
            }))
          )}
        </div>
      )}

      {/* Note */}
      {faq.note && (
        <p className="mt-2 text-xs text-white/50">📌 {faq.note}</p>
      )}

      {/* Escalation hint */}
      {faq.escalation && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-white/60">
            <span className="font-semibold text-white/80">
              Se il problema persiste:{' '}
            </span>
            {faq.escalation}
          </p>
        </div>
      )}
      {faq.escalation_info && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-white/60">
            <span className="font-semibold text-white/80">
              Info per il supporto:{' '}
            </span>
            {faq.escalation_info}
          </p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   FAQ ACCORDION ITEM
   ────────────────────────────────────────────────────────────────── */
function FAQAccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
      >
        <span className="pr-4 text-sm font-medium text-white">
          {faq.question}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5">
          <FAQAnswer faq={faq} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   SEARCH BAR
   ────────────────────────────────────────────────────────────────── */
function SearchBar({
  onSearch,
  initialQuery,
}: {
  onSearch: (query: string) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca nel centro assistenza..."
          className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/40 backdrop-blur-sm transition-all duration-200 focus:border-[#FF7300]/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
            }}
            className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#FF7300] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#FF7300]/90 disabled:opacity-50"
          disabled={query.trim().length < 2}
        >
          Cerca
        </button>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────────────
   BREADCRUMB
   ────────────────────────────────────────────────────────────────── */
function Breadcrumb({
  items,
  onNavigate,
}: {
  items: Array<{ label: string; onClick?: () => void }>;
  onNavigate: (index: number) => void;
}) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-white/60">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.onClick ? (
            <button
              onClick={() => {
                item.onClick?.();
                onNavigate(i);
              }}
              className="hover:text-white transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-white/90 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────
   HOME VIEW — Category grid + search
   ────────────────────────────────────────────────────────────────── */
function HomeView({
  onSelectSection,
  onSearch,
  onStartDecisionTree,
}: {
  onSelectSection: (sectionId: string) => void;
  onSearch: (query: string) => void;
  onStartDecisionTree: () => void;
}) {
  const entrypoint = SUPPORT_WORKFLOW.workflow.entrypoint;

  return (
    <div className="animate-slide-up space-y-10">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF7300]/20">
          <HelpCircle className="h-8 w-8 text-[#FF7300]" />
        </div>
        <h1 className="mb-3 font-display text-3xl font-bold text-white md:text-4xl">
          Come possiamo aiutarti?
        </h1>
        <p className="mx-auto max-w-lg text-sm text-white/70">
          {entrypoint.greeting}
        </p>
      </div>

      {/* Search */}
      <SearchBar onSearch={onSearch} />

      {/* Categories grid */}
      <div>
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-white/50">
          {entrypoint.first_question}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {entrypoint.options.map((option) => {
            const section = getSectionById(option.target_section);
            const IconComp = section ? getIcon(section.icon) : CircleHelp;
            const isAltro = option.id === 'altro';

            return (
              <button
                key={option.id}
                onClick={() =>
                  isAltro
                    ? onStartDecisionTree()
                    : onSelectSection(option.target_section)
                }
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-center backdrop-blur-sm transition-all duration-200 hover:border-[#FF7300]/30 hover:bg-white/[0.12] hover:shadow-lg hover:shadow-[#FF7300]/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-[#FF7300]/20">
                  <IconComp className="h-5 w-5 text-white/80 transition-colors group-hover:text-[#FF7300]" />
                </div>
                <span className="text-xs font-medium leading-snug text-white/80 group-hover:text-white">
                  {/* Show short label from section title, or full label for "altro" */}
                  {section ? section.title : option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   SECTION VIEW — FAQ groups + escalation gating
   ────────────────────────────────────────────────────────────────── */
function SectionView({
  section,
  onBack,
  onEscalate,
}: {
  section: WorkflowSection;
  onBack: () => void;
  onEscalate: (sectionId: string, consultedFaqIds: string[]) => void;
}) {
  const [openFAQId, setOpenFAQId] = useState<string | null>(null);
  const [consultedFaqIds, setConsultedFaqIds] = useState<Set<string>>(
    new Set()
  );
  const [showEscalateHint, setShowEscalateHint] = useState(false);

  const IconComp = getIcon(section.icon);

  const handleToggleFAQ = useCallback(
    (faqId: string) => {
      setOpenFAQId((prev) => (prev === faqId ? null : faqId));
      // Mark as consulted when opened
      setConsultedFaqIds((prev) => new Set(prev).add(faqId));
    },
    []
  );

  const hasConsultedAny = consultedFaqIds.size > 0;

  // Show escalation hint after consulting at least 1 FAQ
  useEffect(() => {
    if (hasConsultedAny) {
      const timer = setTimeout(() => setShowEscalateHint(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hasConsultedAny]);

  return (
    <div className="animate-slide-up space-y-6">
      <Breadcrumb
        items={[
          { label: 'Centro Assistenza', onClick: onBack },
          { label: section.title },
        ]}
        onNavigate={() => {}}
      />

      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7300]/20">
          <IconComp className="h-6 w-6 text-[#FF7300]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            {section.title}
          </h2>
          <p className="text-sm text-white/60">
            {section.faq_groups.reduce(
              (acc, g) => acc + g.faqs.length,
              0
            )}{' '}
            domande frequenti
          </p>
        </div>
      </div>

      {/* FAQ groups */}
      {section.faq_groups.map((group) => (
        <GlassCard key={group.group_title}>
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              {group.group_title}
            </h3>
          </div>
          <div>
            {group.faqs.map((faq) => (
              <FAQAccordionItem
                key={faq.id}
                faq={faq}
                isOpen={openFAQId === faq.id}
                onToggle={() => handleToggleFAQ(faq.id)}
              />
            ))}
          </div>
        </GlassCard>
      ))}

      {/* Escalation gate */}
      {showEscalateHint && (
        <div className="animate-slide-up">
          <GlassCard className="border-[#FF7300]/20 bg-[#FF7300]/5">
            <div className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF7300]/20">
                <Mail className="h-6 w-6 text-[#FF7300]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  Il tuo problema non è stato risolto?
                </p>
                <p className="text-xs text-white/60">
                  Se hai già consultato le FAQ senza trovare soluzione, puoi
                  contattare il nostro team.
                </p>
              </div>
              <button
                onClick={() =>
                  onEscalate(section.id, Array.from(consultedFaqIds))
                }
                className="shrink-0 rounded-xl bg-[#FF7300] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#FF7300]/90 hover:shadow-lg hover:shadow-[#FF7300]/20"
              >
                Contattaci
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Back button */}
      <div className="pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Torna alle categorie
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   DECISION TREE VIEW
   ────────────────────────────────────────────────────────────────── */
function DecisionTreeView({
  onSelectSection,
  onBack,
}: {
  onSelectSection: (sectionId: string) => void;
  onBack: () => void;
}) {
  const tree = SUPPORT_WORKFLOW.workflow.albero_decisionale;
  const [currentStep, setCurrentStep] = useState(1);

  const step = tree.steps.find((s) => s.step === currentStep);

  if (!step) return null;

  const handleBranch = (branch: { answer: string; action?: string; next_step?: number }) => {
    if (branch.next_step) {
      setCurrentStep(branch.next_step);
    } else if (branch.action) {
      // Parse "redirigi a <section_id>"
      const sectionId = branch.action.replace('redirigi a ', '');
      onSelectSection(sectionId);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <Breadcrumb
        items={[
          { label: 'Centro Assistenza', onClick: onBack },
          { label: 'Aiutami a scegliere' },
        ]}
        onNavigate={() => {}}
      />

      <GlassCard>
        <div className="p-6 sm:p-8">
          {/* Progress */}
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF7300]/20 text-sm font-bold text-[#FF7300]">
              {currentStep}
            </span>
            <div className="h-1 flex-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FF7300] transition-all duration-500"
                style={{
                  width: `${(currentStep / tree.steps.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-white/50">
              {currentStep}/{tree.steps.length}
            </span>
          </div>

          {/* Question */}
          <h3 className="mb-6 text-lg font-semibold text-white">
            {step.question}
          </h3>

          {/* Branches */}
          <div className="space-y-3">
            {step.branches.map((branch, i) => (
              <button
                key={i}
                onClick={() => handleBranch(branch)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm text-white/90 transition-all hover:border-[#FF7300]/30 hover:bg-white/10"
              >
                <span>{branch.answer}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/40" />
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Torna alle categorie
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   SEARCH RESULTS VIEW
   ────────────────────────────────────────────────────────────────── */
function SearchResultsView({
  query,
  onBack,
  onSelectSection,
}: {
  query: string;
  onBack: () => void;
  onSelectSection: (sectionId: string) => void;
}) {
  const results = useMemo(() => searchFAQs(query), [query]);
  const [openFAQId, setOpenFAQId] = useState<string | null>(null);

  return (
    <div className="animate-slide-up space-y-6">
      <Breadcrumb
        items={[
          { label: 'Centro Assistenza', onClick: onBack },
          { label: `Risultati per "${query}"` },
        ]}
        onNavigate={() => {}}
      />

      <SearchBar onSearch={() => {}} initialQuery={query} />

      {results.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <Search className="h-12 w-12 text-white/20" />
            <div>
              <p className="text-lg font-semibold text-white">
                Nessun risultato trovato
              </p>
              <p className="text-sm text-white/60">
                Prova con parole diverse o sfoglia le categorie
              </p>
            </div>
            <button
              onClick={onBack}
              className="mt-2 rounded-xl bg-[#FF7300] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#FF7300]/90"
            >
              Sfoglia categorie
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
          <p className="text-sm text-white/60">
            {results.length} risultat{results.length === 1 ? 'o' : 'i'}{' '}
            trovat{results.length === 1 ? 'o' : 'i'}
          </p>

          {/* Group by section */}
          {(() => {
            const grouped = new Map<
              string,
              {
                section: WorkflowSection;
                items: Array<{ group: FAQGroup; faq: FAQItem }>;
              }
            >();
            for (const r of results) {
              if (!grouped.has(r.section.id)) {
                grouped.set(r.section.id, {
                  section: r.section,
                  items: [],
                });
              }
              grouped.get(r.section.id)!.items.push({
                group: r.group,
                faq: r.faq,
              });
            }
            return Array.from(grouped.values()).map(({ section, items }) => {
              const IconComp = getIcon(section.icon);
              return (
                <GlassCard key={section.id}>
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <IconComp className="h-4 w-4 text-[#FF7300]" />
                      <span className="text-sm font-semibold text-white/80">
                        {section.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectSection(section.id)}
                      className="text-xs text-[#FF7300] hover:underline"
                    >
                      Vedi tutto
                    </button>
                  </div>
                  <div>
                    {items.map(({ faq }) => (
                      <FAQAccordionItem
                        key={faq.id}
                        faq={faq}
                        isOpen={openFAQId === faq.id}
                        onToggle={() =>
                          setOpenFAQId((prev) =>
                            prev === faq.id ? null : faq.id
                          )
                        }
                      />
                    ))}
                  </div>
                </GlassCard>
              );
            });
          })()}
        </>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Torna alle categorie
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   ESCALATION VIEW — Contact support (gated)
   ────────────────────────────────────────────────────────────────── */
function EscalationView({
  sectionId,
  consultedFaqIds,
  onBack,
}: {
  sectionId: string;
  consultedFaqIds: string[];
  onBack: () => void;
}) {
  const escalation = SUPPORT_WORKFLOW.escalation;
  const section = getSectionById(sectionId);
  const emailChannel = escalation.channels.find(
    (c) => c.channel === 'Email principale'
  );

  return (
    <div className="animate-slide-up space-y-6">
      <Breadcrumb
        items={[
          { label: 'Centro Assistenza', onClick: onBack },
          { label: section?.title ?? 'Supporto', onClick: () => onBack() },
          { label: 'Contattaci' },
        ]}
        onNavigate={() => {}}
      />

      {/* Summary card */}
      <GlassCard>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Hai consultato {consultedFaqIds.length} FAQ
              </p>
              <p className="text-xs text-white/60">
                nella sezione &quot;{section?.title}&quot;
              </p>
            </div>
          </div>
          <p className="text-sm text-white/70">
            {escalation.final_note}
          </p>
        </div>
      </GlassCard>

      {/* Prerequisites */}
      <GlassCard>
        <div className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
            {escalation.prerequisites.title}
          </h3>
          <ul className="space-y-2.5">
            {escalation.prerequisites.required_info.map((info, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF7300]/15 text-xs font-bold text-[#FF7300]">
                  {i + 1}
                </span>
                {info}
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>

      {/* Contact */}
      {emailChannel && (
        <GlassCard className="border-[#FF7300]/20">
          <SupportCaseForm
            sectionId={sectionId}
            sectionTitle={section?.title ?? 'Supporto'}
            consultedFaqIds={consultedFaqIds}
            responseTime={emailChannel.response_time}
          />
        </GlassCard>
      )}

      {/* Response times */}
      <GlassCard>
        <div className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
            Tempi di risposta stimati
          </h3>
          <div className="space-y-3">
            {Object.values(escalation.response_times).map((rt) => (
              <div
                key={rt.type}
                className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white/80">{rt.type}</p>
                  <p className="text-xs text-white/50">
                    Priorità: {rt.priority}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                  {rt.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Legal */}
      <p className="text-center text-[11px] leading-relaxed text-white/40">
        {escalation.legal_note}
      </p>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Torna alle categorie
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   MAIN CONTENT COMPONENT (inner)
   ────────────────────────────────────────────────────────────────── */
function AiutoContentInner() {
  const searchParams = useSearchParams();
  const [viewState, setViewState] = useState<ViewState>({ view: 'home' });

  // Handle query params on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    const section = searchParams.get('section');
    if (section) {
      const found = getSectionById(section);
      if (found) {
        setViewState({ view: 'section', sectionId: section });
      }
    } else if (tab === 'contact') {
      // Legacy support: if ?tab=contact, we still show home since contact now requires gating
      setViewState({ view: 'home' });
    }
  }, [searchParams]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewState]);

  const navigateHome = useCallback(
    () => setViewState({ view: 'home' }),
    []
  );

  const navigateSection = useCallback(
    (sectionId: string) => setViewState({ view: 'section', sectionId }),
    []
  );

  const navigateSearch = useCallback(
    (query: string) => setViewState({ view: 'search-results', query }),
    []
  );

  const navigateDecisionTree = useCallback(
    () => setViewState({ view: 'decision-tree', step: 1 }),
    []
  );

  const navigateEscalation = useCallback(
    (sectionId: string, consultedFaqIds: string[]) =>
      setViewState({ view: 'escalation', sectionId, consultedFaqIds }),
    []
  );

  return (
    <div
      className="min-h-screen font-sans text-white"
      style={{ backgroundColor: '#3D65C6' }}
    >
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Back to home link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        {/* View Router */}
        {viewState.view === 'home' && (
          <HomeView
            onSelectSection={navigateSection}
            onSearch={navigateSearch}
            onStartDecisionTree={navigateDecisionTree}
          />
        )}

        {viewState.view === 'section' && (() => {
          const section = getSectionById(viewState.sectionId);
          if (!section) return null;
          return (
            <SectionView
              section={section}
              onBack={navigateHome}
              onEscalate={navigateEscalation}
            />
          );
        })()}

        {viewState.view === 'decision-tree' && (
          <DecisionTreeView
            onSelectSection={navigateSection}
            onBack={navigateHome}
          />
        )}

        {viewState.view === 'search-results' && (
          <SearchResultsView
            query={viewState.query}
            onBack={navigateHome}
            onSelectSection={navigateSection}
          />
        )}

        {viewState.view === 'escalation' && (
          <EscalationView
            sectionId={viewState.sectionId}
            consultedFaqIds={viewState.consultedFaqIds}
            onBack={navigateHome}
          />
        )}
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   WRAPPER with Suspense for useSearchParams
   ────────────────────────────────────────────────────────────────── */
export function AiutoContent() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen font-sans text-white"
          style={{ backgroundColor: '#3D65C6' }}
        >
          <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          </main>
        </div>
      }
    >
      <AiutoContentInner />
    </Suspense>
  );
}

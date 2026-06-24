/* ──────────────────────────────────────────────────────────────────
   Support Workflow Data — Types & Helpers
   Imports the JSON workflow and provides typed access + search.
   ────────────────────────────────────────────────────────────────── */

import rawData from './support-workflow.json';

// ── TypeScript Interfaces ────────────────────────────────────────

export interface WorkflowMetadata {
  version: string;
  last_updated: string;
  platform: string;
  company: string;
  status: string;
  total_sections: number;
  total_faqs: number;
  languages: string[];
}

export interface WorkflowOption {
  id: string;
  label: string;
  target_section: string;
}

export interface DecisionBranch {
  answer: string;
  action?: string;
  next_step?: number;
}

export interface DecisionStep {
  step: number;
  question: string;
  branches: DecisionBranch[];
}

export interface FAQTroubleshooting {
  title: string;
  checks: string[];
}

export interface ChecklistItem {
  check: string;
  detail: string;
}

export interface ShippingTime {
  destination: string;
  standard: string;
  brx_express: string;
}

export interface FeeItem {
  type: string;
  amount: string;
  note: string;
}

export interface CostItem {
  item: string;
  cost: string;
  note: string;
}

export interface BenefitItem {
  benefit: string;
  detail: string;
}

export interface ShippingMethod {
  method: string;
  time_it: string;
  time_eu: string;
  tracking: string;
  note: string;
}

export interface PaymentMethod {
  method: string;
  types: string;
  processing: string;
  restriction?: string;
}

export interface DisputePhase {
  phase: string;
  time: string;
  description: string;
}

export interface DisputeTimeline {
  type: string;
  time: string;
}

export interface ConditionEntry {
  code: string;
  name: string;
  description: string;
  price_adjustment: string;
}

export interface BrowserEntry {
  browser: string;
  status: string;
  min_version: string;
}

export interface TabEntry {
  name: string;
  description: string;
}

export interface TournamentType {
  type: string;
  description: string;
}

export interface ShippingOption {
  method: string;
  description: string;
}

export interface VerificationLevel {
  level: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer_type: string;
  // Fields vary by answer_type — all optional
  steps?: string[];
  troubleshooting?: FAQTroubleshooting;
  escalation?: string;
  resolution_steps?: string[];
  checklist?: ChecklistItem[];
  explanation?: string;
  urgency?: string;
  answer?: string;
  tips?: string[];
  note?: string;
  uses?: string[];
  alternatives?: string[];
  description?: string;
  how_to?: string;
  limitations?: string;
  how_to_access?: string;
  available_filters?: string[];
  coverage?: string[];
  times?: ShippingTime[];
  warning?: string;
  timeline?: string;
  fees?: FeeItem[];
  methods?: (ShippingMethod | PaymentMethod)[];
  costs?: CostItem[];
  benefits?: BenefitItem[];
  workflow_summary?: string[];
  normal_timeline?: string;
  standard_rule?: string;
  exceptions?: string[];
  security_measures?: string[];
  features?: string[];
  flow?: string[];
  escalation_info?: string;
  components?: string[];
  exclusions?: string;
  phases?: DisputePhase[];
  timelines?: DisputeTimeline[];
  deadline?: string;
  technical_details?: string[];
  cause?: string;
  prevention_tips?: string[];
  definition?: string;
  points?: string[];
  disclaimer?: string;
  conditions?: ConditionEntry[];
  golden_rule?: string;
  grading_companies?: string[];
  browsers?: BrowserEntry[];
  not_supported?: string;
  important_note?: string;
  fallback?: string;
  key_points?: string[];
  navigation?: string;
  tabs?: TabEntry[];
  tip?: string;
  types?: TournamentType[];
  options?: ShippingOption[];
  packaging_requirements?: string[];
  mechanism?: string[];
  levels?: VerificationLevel[];
  from_tos?: string;
  prevention?: string[];
  welcome?: string;
  report_template?: Record<string, string>;
  where_to_send?: string;
  materials_needed?: string[];
  importance?: string;
  protection?: unknown[];
  troubleshooting_list?: unknown[];
}

export interface FAQGroup {
  group_title: string;
  faqs: FAQItem[];
}

export interface WorkflowSection {
  id: string;
  title: string;
  icon: string;
  priority: number;
  faq_groups: FAQGroup[];
}

export interface EscalationChannel {
  channel: string;
  value: string;
  response_time: string;
  best_for: string;
}

export interface ResponseTime {
  type: string;
  time: string;
  priority: string;
}

export interface EscalationConfig {
  id: string;
  title: string;
  description: string;
  prerequisites: {
    title: string;
    required_info: string[];
  };
  channels: EscalationChannel[];
  response_times: Record<string, ResponseTime>;
  final_note: string;
  legal_note: string;
}

export interface SupportWorkflowData {
  metadata: WorkflowMetadata;
  workflow: {
    entrypoint: {
      greeting: string;
      first_question: string;
      options: WorkflowOption[];
    };
    albero_decisionale: {
      title: string;
      description: string;
      steps: DecisionStep[];
    };
  };
  sections: WorkflowSection[];
  escalation: EscalationConfig;
}

// ── Exported Data ────────────────────────────────────────────────

/**
 * The full support workflow data, typed from the JSON.
 * Contains metadata, workflow entry/decision-tree, 15 sections with 62 FAQs,
 * and escalation configuration.
 */
export const SUPPORT_WORKFLOW = rawData as unknown as SupportWorkflowData;

// ── Helpers ──────────────────────────────────────────────────────

/** Look up a section by its `id` field. */
export function getSectionById(id: string): WorkflowSection | undefined {
  return SUPPORT_WORKFLOW.sections.find((s) => s.id === id);
}

/**
 * Full-text search across all FAQ questions and text content.
 * Returns matches grouped by section and group.
 */
export function searchFAQs(
  query: string
): Array<{ section: WorkflowSection; group: FAQGroup; faq: FAQItem }> {
  if (!query || query.trim().length < 2) return [];

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (terms.length === 0) return [];

  const results: Array<{
    section: WorkflowSection;
    group: FAQGroup;
    faq: FAQItem;
  }> = [];

  for (const section of SUPPORT_WORKFLOW.sections) {
    for (const group of section.faq_groups) {
      for (const faq of group.faqs) {
        // Build searchable text from all text fields
        const searchableFields = [
          faq.question,
          faq.answer,
          faq.description,
          faq.explanation,
          faq.definition,
          faq.cause,
          faq.how_to,
          faq.how_to_access,
          faq.standard_rule,
          faq.important_note,
          faq.fallback,
          faq.tip,
          faq.golden_rule,
          faq.welcome,
          faq.where_to_send,
          faq.navigation,
          faq.note,
          faq.escalation,
          faq.escalation_info,
          ...(faq.steps ?? []),
          ...(faq.resolution_steps ?? []),
          ...(faq.tips ?? []),
          ...(faq.uses ?? []),
          ...(faq.alternatives ?? []),
          ...(faq.coverage ?? []),
          ...(faq.exceptions ?? []),
          ...(faq.security_measures ?? []),
          ...(faq.features ?? []),
          ...(faq.flow ?? []),
          ...(faq.components ?? []),
          ...(faq.key_points ?? []),
          ...(faq.mechanism ?? []),
          ...(faq.available_filters ?? []),
          ...(faq.technical_details ?? []),
          ...(faq.prevention_tips ?? []),
          ...(faq.prevention ?? []),
          ...(faq.grading_companies ?? []),
          ...(faq.workflow_summary ?? []),
          ...(faq.packaging_requirements ?? []),
          ...(faq.materials_needed ?? []),
          ...(faq.points ?? []),
          ...(faq.checklist?.map((c) => `${c.check} ${c.detail}`) ?? []),
          ...(faq.troubleshooting?.checks ?? []),
        ].filter(Boolean);

        const haystack = searchableFields.join(' ').toLowerCase();

        // All terms must match (AND logic)
        if (terms.every((term) => haystack.includes(term))) {
          results.push({ section, group, faq });
        }
      }
    }
  }

  return results;
}

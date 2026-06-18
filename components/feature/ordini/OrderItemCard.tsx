'use client';

/**
 * Card ordine/vendita unica e riutilizzabile.
 *
 * Un solo linguaggio visivo per "I miei acquisti" e "Le mie vendite":
 * superficie bianca neutra, bordo sottile, titolo navy, prezzo navy, UN solo
 * pallino di stato colorato (niente pillole piene multicolore) e UN tag canale
 * discreto. Supporta due layout: lista (riga) e griglia (colonna).
 *
 * Ogni sorgente dati (ordini reali, marketplace, mock, vendite) viene mappata
 * su `OrderItemModel` dal rispettivo wrapper: la card resta agnostica.
 */

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OrderViewMode = 'list' | 'grid';

/** Tono dello stato: pochi stati, un colore coerente ciascuno (solo nel pallino). */
export type OrderStatusTone = 'waiting' | 'action' | 'progress' | 'done' | 'cancelled';

const STATUS_DOT: Record<OrderStatusTone, string> = {
  waiting: 'bg-amber-400',
  action: 'bg-[#FF7300]',
  progress: 'bg-sky-400',
  done: 'bg-emerald-500',
  cancelled: 'bg-gray-300',
};

export interface OrderItemModel {
  id: string;
  title: string;
  /** Link a prodotto/asta (opzionale). */
  href?: string | null;
  imageUrl?: string | null;
  /** Icona di fallback quando non c'è immagine. */
  fallbackIcon?: LucideIcon;
  /** Riga secondaria (es. set · condizione). */
  subtitle?: string;
  /** Controparte (venditore/acquirente). */
  counterparty?: { label: string; name: string };
  priceLabel: string;
  status: { label: string; tone: OrderStatusTone };
  /** Avviso breve in rosso (es. "Scaduto", "In ritardo"). */
  alert?: string;
  /** Tag canale discreto (es. "Asta", "Marketplace", "Demo"). */
  channel?: string;
  /** Riga di dettaglio attenuata (es. data, qtà, tracking). */
  metaLine?: string;
  /** Pulsanti azione (usa OrderActionButton per restare coerenti). */
  actions?: ReactNode;
}

function StatusDot({ status }: { status: OrderItemModel['status'] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
      <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status.tone])} aria-hidden />
      {status.label}
    </span>
  );
}

function AlertText({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-red-500">{children}</span>
  );
}

function ChannelTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
      {children}
    </span>
  );
}

function Thumb({
  imageUrl,
  title,
  fallbackIcon: Icon = Package,
  size,
}: {
  imageUrl?: string | null;
  title: string;
  fallbackIcon?: LucideIcon;
  size: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg bg-[#F5F4F0] ring-1 ring-black/5',
        size === 'sm' ? 'h-12 w-12' : 'h-14 w-14',
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={title} fill className="object-contain p-1" sizes="56px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#1D3160]/35">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      )}
    </div>
  );
}

function Title({ title, href }: { title: string; href?: string | null }) {
  const cls = 'block truncate text-sm font-semibold text-[#1D3160]';
  if (href) {
    return (
      <Link href={href} className={cn(cls, 'transition-colors hover:text-[#FF7300] hover:underline')}>
        {title}
      </Link>
    );
  }
  return <h3 className={cls}>{title}</h3>;
}

export function OrderItemCard({
  model,
  layout = 'list',
}: {
  model: OrderItemModel;
  layout?: OrderViewMode;
}) {
  const { title, href, imageUrl, fallbackIcon, subtitle, counterparty, priceLabel, status, alert, channel, metaLine, actions } =
    model;

  if (layout === 'grid') {
    return (
      <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300">
        <div className="mb-2 flex items-center gap-2">
          <StatusDot status={status} />
          {alert && <AlertText>{alert}</AlertText>}
          {channel && <span className="ml-auto"><ChannelTag>{channel}</ChannelTag></span>}
        </div>

        <div className="flex gap-3">
          <Thumb imageUrl={imageUrl} title={title} fallbackIcon={fallbackIcon} size="md" />
          <div className="min-w-0 flex-1">
            <Title title={title} href={href} />
            {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
            {counterparty && (
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {counterparty.label}: <span className="font-medium text-gray-700">{counterparty.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
          {metaLine ? <span className="truncate text-[11px] text-gray-400">{metaLine}</span> : <span />}
          <span className="shrink-0 text-sm font-bold tabular-nums text-[#1D3160]">{priceLabel}</span>
        </div>

        {actions && <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300">
      <div className="flex items-start gap-3">
        <Thumb imageUrl={imageUrl} title={title} fallbackIcon={fallbackIcon} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Title title={title} href={href} />
            <span className="shrink-0 text-sm font-bold tabular-nums text-[#1D3160]">{priceLabel}</span>
          </div>
          {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
          {counterparty && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {counterparty.label}: <span className="font-medium text-gray-700">{counterparty.name}</span>
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusDot status={status} />
              {alert && <AlertText>{alert}</AlertText>}
            </div>
            {channel && <ChannelTag>{channel}</ChannelTag>}
          </div>
        </div>
      </div>

      {(metaLine || actions) && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
          {metaLine ? <span className="text-[11px] text-gray-400">{metaLine}</span> : <span />}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
    </article>
  );
}

/** Pulsante azione coerente per le card ordine. Colore semantico, mai casuale. */
export function OrderActionButton({
  variant = 'primary',
  icon: Icon,
  children,
  onClick,
  disabled,
}: {
  variant?: 'primary' | 'positive' | 'danger' | 'neutral';
  icon?: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-[#FF7300] text-white hover:bg-[#e56500]',
    positive: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
    neutral: 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </button>
  );
}

/** Classe contenitore coerente: griglia responsiva o stack verticale. */
export function ordersWrapperClass(view: OrderViewMode): string {
  return view === 'grid'
    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'
    : 'space-y-3';
}

export interface AuctionFloatingNoticeData {
  kind: 'success' | 'warning';
  message: string;
}

export interface AuctionFloatingNoticeProps {
  /** Posizione verticale (sotto l'header sticky). */
  top: number;
  notice: AuctionFloatingNoticeData;
}

/** Toast fluttuante per esiti offerta/proxy nel dettaglio asta. */
export function AuctionFloatingNotice({ top, notice }: AuctionFloatingNoticeProps) {
  return (
    <div
      className="fixed left-1/2 z-30 w-[min(92vw,640px)] -translate-x-1/2 px-1"
      style={{ top: top + 8 }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-2xl border px-4 py-3 text-center shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 ${
          notice.kind === 'warning'
            ? 'border-rose-200/80 bg-rose-50/75 text-rose-900'
            : 'border-emerald-200/80 bg-white/70 text-[#16324f]'
        }`}
      >
        <p className="text-sm font-semibold tracking-[0.01em] sm:text-[15px]">{notice.message}</p>
      </div>
    </div>
  );
}

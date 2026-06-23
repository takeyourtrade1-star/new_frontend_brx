import { Smartphone, Globe } from 'lucide-react';
import { CALENDAR_MENU_ITEM_CLASS, CALENDAR_MENU_BADGE_CLASS } from '@/lib/auction/auction-detail-utils';

/** Dropdown "Aggiungi al calendario" (iOS ICS + Google). Markup condiviso tra mobile e desktop. */
export function CalendarAddMenu({
  menuClassName,
  onIos,
  onGoogle,
}: {
  menuClassName: string;
  onIos: () => void;
  onGoogle: () => void;
}) {
  return (
    <div className={menuClassName} role="menu" aria-label="Opzioni calendario">
      <button type="button" onClick={onIos} className={CALENDAR_MENU_ITEM_CLASS} role="menuitem">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/35">
            <Smartphone className="h-4 w-4" />
          </span>
          <span>Calendario iOS</span>
        </span>
        <span className={CALENDAR_MENU_BADGE_CLASS}>ICS</span>
      </button>
      <button type="button" onClick={onGoogle} className={`${CALENDAR_MENU_ITEM_CLASS} mt-1`} role="menuitem">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/35">
            <Globe className="h-4 w-4" />
          </span>
          <span>Google Calendar</span>
        </span>
        <span className={CALENDAR_MENU_BADGE_CLASS}>WEB</span>
      </button>
    </div>
  );
}

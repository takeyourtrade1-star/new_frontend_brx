'use client';

import { useState } from 'react';

/** Reusable pill-shaped toggle. OFF = knob left, ON = knob right. */
export function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
}: {
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      onClick={onChange}
      disabled={disabled}
      className="relative inline-flex h-[22px] w-[48px] shrink-0 items-center rounded-full bg-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50"
      aria-checked={checked}
      aria-label={checked ? 'Attivo' : 'Disattivo'}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-0.5'
        }`}
        aria-hidden
      />
    </button>
  );
}

/** Thick black empty circular ring, transparent interior. */
export function RingIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block h-10 w-10 shrink-0 rounded-full border-[4px] border-black bg-transparent ${className ?? ''}`}
      aria-hidden
    />
  );
}

/** One group: ring on top, two toggles below. */
export function ControlGroup({
  toggle1Checked = false,
  toggle2Checked = false,
  onToggle1Change,
  onToggle2Change,
}: {
  toggle1Checked?: boolean;
  toggle2Checked?: boolean;
  onToggle1Change?: () => void;
  onToggle2Change?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <RingIcon />
      <div className="flex flex-col gap-4">
        <ToggleSwitch
          checked={toggle1Checked}
          onChange={onToggle1Change}
        />
        <ToggleSwitch
          checked={toggle2Checked}
          onChange={onToggle2Change}
        />
      </div>
    </div>
  );
}

const DEFAULT_GROUPS = 4;

/**
 * Full view: vertical gradient background + centered column of control groups.
 * Each group has one ring and two toggle switches (all OFF by default).
 */
export function ToggleControlColumn() {
  const [groups, setGroups] = useState<boolean[][]>(
    Array.from({ length: DEFAULT_GROUPS }, () => [false, false])
  );

  const setGroupToggle = (groupIndex: number, toggleIndex: 0 | 1) => {
    setGroups((prev) =>
      prev.map((row, i) =>
        i === groupIndex
          ? [toggleIndex === 0 ? !row[0] : row[0], toggleIndex === 1 ? !row[1] : row[1]]
          : [...row]
      )
    );
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center py-16 px-4"
      style={{
        background: 'linear-gradient(to bottom, #3154B1 0%, #1e293b 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-12">
        {groups.map((toggles, i) => (
          <ControlGroup
            key={i}
            toggle1Checked={toggles[0]}
            toggle2Checked={toggles[1]}
            onToggle1Change={() => setGroupToggle(i, 0)}
            onToggle2Change={() => setGroupToggle(i, 1)}
          />
        ))}
      </div>
    </div>
  );
}

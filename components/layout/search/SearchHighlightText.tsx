'use client';

import { HIGHLIGHT_ORANGE } from '@/lib/search/global-search-highlight';

export function RenderHighlightedText({ value }: { value: string }) {
  const parts = value.split(/(<em>|<\/em>)/i).filter(Boolean);
  const segments: Array<{ type: 'plain' | 'highlight'; text: string }> = [];
  let current = '';
  let inEm = false;
  for (const part of parts) {
    if (/^<em>$/i.test(part)) {
      if (current) {
        segments.push({ type: 'plain', text: current });
        current = '';
      }
      inEm = true;
    } else if (/^<\/em>$/i.test(part)) {
      if (current) {
        segments.push({ type: inEm ? 'highlight' : 'plain', text: current });
        current = '';
      }
      inEm = false;
    } else {
      current += part;
    }
  }
  if (current) segments.push({ type: inEm ? 'highlight' : 'plain', text: current });

  return (
    <span>
      {segments.map((seg, i) =>
        seg.type === 'highlight' ? (
          <mark
            key={i}
            className="rounded px-0.5 font-medium"
            style={{ backgroundColor: HIGHLIGHT_ORANGE }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

export function HighlightQueryInText({ text, query }: { text: string; query: string }) {
  const q = (query ?? '').trim();
  if (!q) return <span>{text}</span>;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="rounded px-0.5 font-medium"
            style={{ backgroundColor: HIGHLIGHT_ORANGE }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

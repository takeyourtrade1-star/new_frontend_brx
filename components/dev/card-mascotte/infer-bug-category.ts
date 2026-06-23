import { FACE_COLOR_OPTIONS, type FaceColorId } from '../mascotte-wardrobe';

export function isValidFaceColorId(value: unknown): value is FaceColorId {
  return typeof value === 'string' && FACE_COLOR_OPTIONS.some((option) => option.id === value);
}

export function inferBugCategory(url: string): string {
  const path = url.toLowerCase();
  if (path.includes('/account') || path.includes('/login') || path.includes('/register')) return 'account';
  if (path.includes('/search') || path.includes('/product') || path.includes('/carta')) return 'search';
  if (path.includes('/cart') || path.includes('/checkout')) return 'payment';
  if (path.includes('/auction') || path.includes('/asta')) return 'auction';
  if (path.includes('/acquisti') || path.includes('/ordini')) return 'orders';
  if (path.includes('/vendi') || path.includes('/inventory')) return 'selling';
  if (path.includes('/messaggi') || path.includes('/chat')) return 'messaging';
  if (path.includes('/games')) return 'games';
  return 'functional';
}

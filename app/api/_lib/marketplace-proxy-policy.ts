type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const ID = '[A-Za-z0-9._~%-]{1,128}';
const INTEGER = '[1-9][0-9]{0,18}';

const RULES: ReadonlyArray<{ method: Method; path: RegExp; public?: boolean }> = [
  { method: 'GET', path: /^sync\/status$/ },
  { method: 'PUT', path: /^sync\/mode$/ },
  { method: 'GET', path: /^sync\/events$/ },
  { method: 'GET', path: /^listings$/ },
  { method: 'POST', path: /^listings$/ },
  { method: 'PATCH', path: new RegExp(`^listings/${ID}$`) },
  { method: 'DELETE', path: new RegExp(`^listings/${ID}$`) },
  {
    method: 'GET',
    path: new RegExp(`^listings/public/by-blueprint/${INTEGER}$`),
    public: true,
  },
  { method: 'GET', path: /^listings\/public\/best-sellers$/, public: true },
  { method: 'GET', path: /^orders$/ },
  { method: 'GET', path: /^collections$/ },
];

export function marketplaceProxyPolicy(path: string, method: string): { allowed: boolean; public: boolean } {
  const rule = RULES.find((candidate) => candidate.method === method && candidate.path.test(path));
  return { allowed: Boolean(rule), public: Boolean(rule?.public) };
}

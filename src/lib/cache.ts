const DEFAULT_TTL = Number(process.env.NEXT_PUBLIC_CACHE_TTL_SECONDS ?? 300) * 1000;
const PREFIX = "finance_cache:";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function isServer() {
  return typeof window === "undefined";
}

export const cache = {
  get<T>(key: string): T | null {
    if (isServer()) return null;
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
    if (isServer()) return;
    try {
      const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttl };
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      // localStorage may be full; silently skip caching
    }
  },

  invalidate(key: string): void {
    if (isServer()) return;
    localStorage.removeItem(PREFIX + key);
  },

  invalidatePrefix(prefix: string): void {
    if (isServer()) return;
    const fullPrefix = PREFIX + prefix;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(fullPrefix))
      .forEach((k) => localStorage.removeItem(k));
  },

  clear(): void {
    if (isServer()) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};

// The device-level profile ID (no auth) is persisted separately, not via the TTL cache.
const PROFILE_ID_KEY = "finance_profile_id";

export function getProfileId(): string {
  if (isServer()) return "";
  let id = localStorage.getItem(PROFILE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PROFILE_ID_KEY, id);
  }
  return id;
}

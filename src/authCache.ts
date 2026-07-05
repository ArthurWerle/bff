import { AuthUser } from './services/IdentityService';

const DEFAULT_TTL_MS = 60_000;

type CacheEntry = {
  user: AuthUser;
  cachedAt: number;
};

// In-memory, positive-only cache of validated sessions. Avoids a validate
// round-trip to identity for every request; the trade-off is that a
// force-logout takes up to the TTL to propagate. AUTH_CACHE_TTL_MS=0
// disables caching entirely.
export class AuthCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs: number) {}

  get(sessionId: string): AuthUser | null {
    if (this.ttlMs <= 0) return null;

    const entry = this.entries.get(sessionId);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.entries.delete(sessionId);
      return null;
    }

    return entry.user;
  }

  set(sessionId: string, user: AuthUser): void {
    if (this.ttlMs <= 0) return;
    this.entries.set(sessionId, { user, cachedAt: Date.now() });
  }

  invalidate(sessionId: string): void {
    this.entries.delete(sessionId);
  }

  clear(): void {
    this.entries.clear();
  }
}

export const authCache = new AuthCache(
  Number(process.env.AUTH_CACHE_TTL_MS ?? DEFAULT_TTL_MS)
);

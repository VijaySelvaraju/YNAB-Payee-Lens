const PREFIX = "ynab_pa_";
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // quota exceeded or storage unavailable
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// TTL cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  _ts: number;
  _ttl: number;
  data: T;
}

export function cacheSet<T>(name: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  try {
    const payload: CacheEntry<T> = { _ts: Date.now(), _ttl: ttlMs, data };
    safeSet(`cache_${name}`, JSON.stringify(payload));
  } catch {
    // ignore serialisation errors
  }
}

export function cacheGet<T>(name: string): T | null {
  try {
    const raw = safeGet(`cache_${name}`);
    if (!raw) return null;
    const payload = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - payload._ts > payload._ttl) {
      safeRemove(`cache_${name}`);
      return null;
    }
    return payload.data;
  } catch {
    return null;
  }
}

export function cacheClear(name: string): void {
  safeRemove(`cache_${name}`);
}

// ---------------------------------------------------------------------------
// API token persistence
// ---------------------------------------------------------------------------

export function saveApiToken(token: string): void {
  safeSet("api_token", token);
}

export function loadApiToken(): string | null {
  return safeGet("api_token");
}

export function clearApiToken(): void {
  safeRemove("api_token");
}

// ---------------------------------------------------------------------------
// Remember-token preference
// ---------------------------------------------------------------------------

export function setRememberToken(value: boolean): void {
  safeSet("remember_token", value ? "1" : "0");
}

export function getRememberToken(): boolean {
  return safeGet("remember_token") === "1";
}

// ---------------------------------------------------------------------------
// Selected budget persistence
// ---------------------------------------------------------------------------

export function saveSelectedBudget(budgetId: string): void {
  safeSet("selected_budget", budgetId);
}

export function loadSelectedBudget(): string | null {
  return safeGet("selected_budget");
}

export function clearSelectedBudget(): void {
  safeRemove("selected_budget");
}

// ---------------------------------------------------------------------------
// Clear everything
// ---------------------------------------------------------------------------

export function clearAll(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

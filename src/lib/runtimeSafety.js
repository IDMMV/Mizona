export const asArray = value => Array.isArray(value) ? value : [];
export const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
export const asString = (value, fallback = '') => typeof value === 'string' ? value : fallback;

export function safeJsonParse(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export function safeStorageGet(storage, key, fallback = null) {
  try {
    const value = storage?.getItem?.(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeStorageSet(storage, key, value) {
  try { storage?.setItem?.(key, value); return true; } catch { return false; }
}

export function safeStorageRemove(storage, key) {
  try { storage?.removeItem?.(key); return true; } catch { return false; }
}

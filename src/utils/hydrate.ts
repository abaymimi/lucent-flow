// src/utils/hydrate.ts

export const hydrate = async <T>(
    key: string,
    storage: { getItem: (key: string) => Promise<string | null> | string | null },
    setState: (value: T) => void
  ) => {
    try {
      const saved = await storage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(parsed);
      }
    } catch (err) {
      console.error('[Hydrate] Failed to load persisted state:', err);
    }
  };
  
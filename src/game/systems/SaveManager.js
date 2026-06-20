export const SAVE_KEY = "tmux-trek-save";
export const SAVE_VERSION = 2;

export function saveGame(snapshot, storage = globalThis.localStorage) {
  try {
    storage?.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: SAVE_VERSION,
        ...snapshot,
      }),
    );
  } catch {
    // Saving is best-effort only.
  }
}

export function loadGame(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed.v === SAVE_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSave(storage = globalThis.localStorage) {
  storage?.removeItem(SAVE_KEY);
}

export function hasSave(storage = globalThis.localStorage) {
  return storage?.getItem(SAVE_KEY) !== null;
}

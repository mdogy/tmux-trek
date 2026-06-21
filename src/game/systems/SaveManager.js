const INDEX_KEY = "tmux-trek:saves";
const SLOT_PREFIX = "tmux-trek:save:";
export const SAVE_VERSION = 3;

function emptyIndex() {
  return { version: SAVE_VERSION, activeId: null, slots: [] };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeIndex(parsed) {
  if (parsed?.version !== SAVE_VERSION || !Array.isArray(parsed.slots)) {
    return emptyIndex();
  }

  const slots = parsed.slots
    .filter((slot) => typeof slot?.id === "string" && slot.id)
    .map((slot) => ({
      id: slot.id,
      name:
        typeof slot.name === "string" && slot.name.trim()
          ? slot.name
          : "New Game",
      updatedAt: Number.isFinite(slot.updatedAt) ? slot.updatedAt : Date.now(),
    }));
  const activeId = slots.some((slot) => slot.id === parsed.activeId)
    ? parsed.activeId
    : null;

  return { version: SAVE_VERSION, activeId, slots };
}

function readIndex(storage) {
  try {
    const raw = storage?.getItem(INDEX_KEY);
    if (!raw) return emptyIndex();
    return normalizeIndex(JSON.parse(raw));
  } catch {
    return emptyIndex();
  }
}

function writeIndex(index, storage) {
  try {
    storage?.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    /* storage full */
  }
}

// Migrate a v2 single-slot save to the v3 slot index format.
export function migrate(storage = globalThis.localStorage) {
  const legacy = storage?.getItem("tmux-trek-save");
  if (!legacy) return;

  try {
    const parsed = JSON.parse(legacy);
    const index = readIndex(storage);
    if (parsed.v === 2 && index.slots.length === 0) {
      // Reject saves where a known-object key is present but the wrong type.
      // Absent keys are fine — each system's restore() handles undefined gracefully.
      const objectKeys = ["engine", "mission", "inventory"];
      const isCorrupt = objectKeys.some(
        (key) => key in parsed && (parsed[key] === null || typeof parsed[key] !== "object"),
      );
      if (isCorrupt) {
        storage?.removeItem("tmux-trek-save");
        return;
      }
      const id = uid();
      storage.setItem(
        SLOT_PREFIX + id,
        JSON.stringify({ ...parsed, v: SAVE_VERSION }),
      );
      writeIndex(
        {
          version: SAVE_VERSION,
          activeId: id,
          slots: [{ id, name: "default", updatedAt: Date.now() }],
        },
        storage,
      );
    }
  } catch {
    /* corrupt legacy save — discard silently */
  }
  storage?.removeItem("tmux-trek-save");
}

export function listSlots(storage = globalThis.localStorage) {
  return readIndex(storage).slots;
}

export function getActiveSlotId(storage = globalThis.localStorage) {
  return readIndex(storage).activeId;
}

export function setActiveSlotId(id, storage = globalThis.localStorage) {
  const index = readIndex(storage);
  if (!index.slots.some((slot) => slot.id === id)) {
    return false;
  }

  index.activeId = id;
  writeIndex(index, storage);
  return true;
}

export function newSlot(name, storage = globalThis.localStorage) {
  const id = uid();
  const index = readIndex(storage);
  index.slots.push({
    id,
    name: typeof name === "string" && name.trim() ? name.trim() : "New Game",
    updatedAt: Date.now(),
  });
  index.activeId = id;
  writeIndex(index, storage);
  return id;
}

export function renameSlot(id, name, storage = globalThis.localStorage) {
  const index = readIndex(storage);
  const slot = index.slots.find((s) => s.id === id);
  const nextName = typeof name === "string" ? name.trim() : "";
  if (slot && nextName) {
    slot.name = nextName;
    writeIndex(index, storage);
  }
}

export function deleteSlot(id, storage = globalThis.localStorage) {
  const index = readIndex(storage);
  index.slots = index.slots.filter((s) => s.id !== id);
  if (index.activeId === id) index.activeId = index.slots[0]?.id ?? null;
  writeIndex(index, storage);
  try {
    storage?.removeItem(SLOT_PREFIX + id);
  } catch {
    /* ignore */
  }
}

export function clearAllSlots(storage = globalThis.localStorage) {
  const index = readIndex(storage);
  for (const slot of index.slots) {
    try {
      storage?.removeItem(SLOT_PREFIX + slot.id);
    } catch {
      /* ignore */
    }
  }
  writeIndex(emptyIndex(), storage);
}

export function saveGame(snapshot, storage = globalThis.localStorage) {
  const index = readIndex(storage);
  const id = index.activeId;
  const slot = index.slots.find((s) => s.id === id);
  if (!id || !slot) return;

  try {
    storage?.setItem(
      SLOT_PREFIX + id,
      JSON.stringify({ v: SAVE_VERSION, ...snapshot }),
    );
    slot.updatedAt = Date.now();
    writeIndex(index, storage);
  } catch {
    /* storage full */
  }
}

export function loadGame(storage = globalThis.localStorage) {
  const id = getActiveSlotId(storage);
  if (!id) return null;
  try {
    const raw = storage?.getItem(SLOT_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.v === SAVE_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function hasSave(storage = globalThis.localStorage) {
  return loadGame(storage) !== null;
}

// Backward-compat alias — clears all slots.
export function clearSave(storage = globalThis.localStorage) {
  clearAllSlots(storage);
}

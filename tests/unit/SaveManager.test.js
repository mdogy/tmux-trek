import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllSlots,
  deleteSlot,
  getActiveSlotId,
  hasSave,
  listSlots,
  loadGame,
  migrate,
  newSlot,
  renameSlot,
  saveGame,
  setActiveSlotId,
} from "../../src/game/systems/SaveManager.js";

function createStorage() {
  const store = new Map();
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
}

describe("SaveManager (multi-slot)", () => {
  let storage;

  beforeEach(() => {
    storage = createStorage();
  });

  it("creates a slot and round-trips a snapshot", () => {
    newSlot("run-1", storage);
    saveGame({ mission: { currentActId: "act-01" } }, storage);
    expect(loadGame(storage)?.mission.currentActId).toBe("act-01");
    expect(hasSave(storage)).toBe(true);
  });

  it("lists slots and tracks the active id", () => {
    const id = newSlot("test", storage);
    expect(listSlots(storage)).toHaveLength(1);
    expect(getActiveSlotId(storage)).toBe(id);
  });

  it("clearAllSlots wipes all data", () => {
    newSlot("a", storage);
    saveGame({ mission: {} }, storage);
    clearAllSlots(storage);
    expect(listSlots(storage)).toHaveLength(0);
    expect(loadGame(storage)).toBeNull();
    expect(hasSave(storage)).toBe(false);
  });

  it("deleteSlot removes slot and falls back active to next", () => {
    const a = newSlot("a", storage);
    const b = newSlot("b", storage);
    deleteSlot(a, storage);
    expect(listSlots(storage)).toHaveLength(1);
    expect(getActiveSlotId(storage)).toBe(b);
  });

  it("deleteSlot falls back when the active slot is deleted", () => {
    const a = newSlot("a", storage);
    const b = newSlot("b", storage);
    setActiveSlotId(a, storage);
    deleteSlot(a, storage);
    expect(getActiveSlotId(storage)).toBe(b);
  });

  it("renameSlot changes the display name", () => {
    const id = newSlot("old", storage);
    renameSlot(id, "new", storage);
    expect(listSlots(storage)[0].name).toBe("new");
  });

  it("renameSlot ignores unknown ids and blank names", () => {
    const id = newSlot("stable", storage);
    renameSlot("missing", "ignored", storage);
    renameSlot(id, "   ", storage);
    expect(listSlots(storage)[0].name).toBe("stable");
  });

  it("setActiveSlotId switches the active slot", () => {
    const a = newSlot("a", storage);
    const b = newSlot("b", storage);
    setActiveSlotId(a, storage);
    expect(getActiveSlotId(storage)).toBe(a);
    setActiveSlotId(b, storage);
    expect(getActiveSlotId(storage)).toBe(b);
  });

  it("setActiveSlotId ignores unknown slots", () => {
    const id = newSlot("a", storage);
    expect(setActiveSlotId("missing", storage)).toBe(false);
    expect(getActiveSlotId(storage)).toBe(id);
  });

  it("loadGame returns null for a wrong-version slot", () => {
    const id = newSlot("x", storage);
    storage.setItem(`tmux-trek:save:${id}`, JSON.stringify({ v: 0 }));
    expect(loadGame(storage)).toBeNull();
    expect(hasSave(storage)).toBe(false);
  });

  it("loadGame returns null for a corrupt active slot", () => {
    const id = newSlot("x", storage);
    storage.setItem(`tmux-trek:save:${id}`, "{not json");
    expect(loadGame(storage)).toBeNull();
    expect(hasSave(storage)).toBe(false);
  });

  it("saveGame without an active slot is a no-op", () => {
    saveGame({ mission: {} }, storage);
    expect(loadGame(storage)).toBeNull();
  });

  it("saveGame ignores a corrupt active index instead of writing an orphan save", () => {
    storage.setItem(
      "tmux-trek:saves",
      JSON.stringify({ version: 3, activeId: "missing", slots: [] }),
    );
    saveGame({ mission: { currentActId: "act-01" } }, storage);
    expect(storage.getItem("tmux-trek:save:missing")).toBeNull();
  });

  it("listSlots normalizes corrupt or malformed index data", () => {
    storage.setItem("tmux-trek:saves", "{not json");
    expect(listSlots(storage)).toEqual([]);

    storage.setItem(
      "tmux-trek:saves",
      JSON.stringify({ version: 3, activeId: "ghost", slots: {} }),
    );
    expect(listSlots(storage)).toEqual([]);
    expect(getActiveSlotId(storage)).toBeNull();
  });

  it("migrate converts a v2 single-slot save to a default slot", () => {
    storage.setItem(
      "tmux-trek-save",
      JSON.stringify({ v: 2, mission: { currentActId: "act-01" } }),
    );
    migrate(storage);
    expect(listSlots(storage)).toHaveLength(1);
    expect(listSlots(storage)[0].name).toBe("default");
    expect(loadGame(storage)?.mission.currentActId).toBe("act-01");
    expect(storage.getItem("tmux-trek-save")).toBeNull();
  });

  it("migrate does not overwrite an existing v3 slot index", () => {
    const id = newSlot("current", storage);
    saveGame({ mission: { currentActId: "current-act" } }, storage);
    storage.setItem(
      "tmux-trek-save",
      JSON.stringify({ v: 2, mission: { currentActId: "legacy-act" } }),
    );

    migrate(storage);

    expect(listSlots(storage)).toHaveLength(1);
    expect(getActiveSlotId(storage)).toBe(id);
    expect(loadGame(storage)?.mission.currentActId).toBe("current-act");
    expect(storage.getItem("tmux-trek-save")).toBeNull();
  });

  it("migrate discards a non-v2 legacy save", () => {
    storage.setItem("tmux-trek-save", JSON.stringify({ v: 1, mission: {} }));
    migrate(storage);
    expect(listSlots(storage)).toHaveLength(0);
    expect(storage.getItem("tmux-trek-save")).toBeNull();
  });
});

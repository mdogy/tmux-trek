import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSave,
  hasSave,
  loadGame,
  saveGame,
} from "../../src/game/systems/SaveManager.js";

function createStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

describe("SaveManager", () => {
  let storage;

  beforeEach(() => {
    storage = createStorage();
  });

  it("round-trips a snapshot", () => {
    saveGame(
      {
        mission: { currentActId: "act-01" },
      },
      storage,
    );

    expect(loadGame(storage)?.mission.currentActId).toBe("act-01");
    expect(hasSave(storage)).toBe(true);
  });

  it("clears a save", () => {
    saveGame({ mission: {} }, storage);
    clearSave(storage);

    expect(loadGame(storage)).toBeNull();
  });

  it("returns null for a wrong-version payload", () => {
    storage.setItem("tmux-trek-save", JSON.stringify({ v: 0 }));
    expect(loadGame(storage)).toBeNull();
  });
});

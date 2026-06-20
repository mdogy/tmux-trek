import { beforeEach, describe, expect, it } from "vitest";
import {
  InventorySystem,
  INVENTORY_ITEMS,
} from "../../src/game/systems/InventorySystem.js";

describe("InventorySystem", () => {
  let inventory;

  beforeEach(() => {
    inventory = new InventorySystem();
  });

  it("collects items once and exposes membership checks", () => {
    expect(inventory.collect(INVENTORY_ITEMS.RIFT_CODE)).toBe(true);
    expect(inventory.collect(INVENTORY_ITEMS.RIFT_CODE)).toBe(false);
    expect(inventory.has(INVENTORY_ITEMS.RIFT_CODE)).toBe(true);
  });

  it("restores a saved inventory snapshot", () => {
    inventory.restore({
      items: [INVENTORY_ITEMS.ARMORY_WEAPON],
    });

    expect(inventory.has(INVENTORY_ITEMS.ARMORY_WEAPON)).toBe(true);
  });
});

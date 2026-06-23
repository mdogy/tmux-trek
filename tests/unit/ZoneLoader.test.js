import { describe, expect, it } from "vitest";
import { getZone, getZones, normalizeV2Zone } from "../../src/game/data/zoneLoader.js";
import surfaceV2Zone from "../../src/data/zones/v2/surface.json";
import { buildBlockedTiles, getCellSemantics } from "../../src/game/data/zoneSemantics.js";

describe("zoneLoader", () => {
  it("returns legacy zones by default", () => {
    const bridge = getZone("bridge", { useV2Zones: false });
    expect(bridge.map.columns).toBe(20);
    expect(bridge.terminals).toHaveLength(1);
  });

  it("normalizes v2 bridge zones into the legacy scene shape", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    expect(bridge.renderMode).toBe("v2");
    expect(bridge.map.columns).toBe(15);
    expect(bridge.map.rows).toBe(11);
    expect(bridge.playerStart).toEqual({ column: 7, row: 9 });
    expect(bridge.terminals).toHaveLength(1);
    expect(bridge.objects.map((object) => object.type)).toContain("console");
    expect(bridge.npcs[0]).toHaveProperty("column");
    expect(bridge.obstacles.tiles.length).toBeGreaterThan(0);
  });

  it("preserves the normalized structure for all v2 zones", () => {
    const zones = getZones({ useV2Zones: true });
    expect(zones.bridge.renderMode).toBe("v2");
    expect(zones.surface.objects.map((object) => object.type)).toContain(
      "market_stall",
    );
    expect(zones.armory.objects.map((object) => object.type)).toContain(
      "weapon_stand",
    );
  });

  it("normalizing a v2 zone keeps blockers and items available", () => {
    const surface = normalizeV2Zone(surfaceV2Zone);
    expect(surface.blockers).toHaveLength(1);
    expect(surface.items[0].item).toBe("RIFT_CODE");
  });

  it("builds blocked tiles from v2 tile and object semantics", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    const blocked = buildBlockedTiles(bridge);
    expect(blocked.has("0,0")).toBe(true);
    expect(blocked.has("7,5")).toBe(true);
  });

  it("resolves cell semantics from v2 tile, object, and location data", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    const semantics = getCellSemantics(bridge, 10, 7);
    expect(semantics?.objectType).toBe("rift_terminal");
    expect(semantics?.verbs).toContain("use");
    expect(semantics?.description).toContain("Rift terminal");
  });
});

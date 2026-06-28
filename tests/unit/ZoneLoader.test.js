import { describe, expect, it } from "vitest";
import {
  getZone,
  getZones,
  normalizeV2Zone,
} from "../../src/game/data/zoneLoader.js";
import surfaceV2Zone from "../../src/data/zones/v2/surface.json";
import {
  buildBlockedTiles,
  getCellSemantics,
  getObjectFootprint,
  toFootprintTiles,
} from "../../src/game/data/zoneSemantics.js";

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
    expect(bridge.playerStart).toEqual({ column: 7, row: 8 });
    expect(bridge.terminals).toHaveLength(1);
    expect(bridge.objects.map((object) => object.type)).toContain("console");
    expect(bridge.npcs[0]).toHaveProperty("column");
    expect(bridge.obstacles.tiles.length).toBeGreaterThan(0);
  });

  it("keeps bridge semantic stations aligned to the generated bridge art", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    const objectAt = (id) => bridge.objects.find((object) => object.id === id);

    expect(objectAt("chair")?.at).toEqual([7, 7]);
    expect(objectAt("helm")?.at).toEqual([4, 3]);
    expect(objectAt("nav")?.at).toEqual([10, 3]);
    expect(objectAt("ops")?.at).toEqual([5, 6]);
    expect(objectAt("science")?.at).toEqual([10, 6]);
    expect(objectAt("comms")?.at).toEqual([4, 8]);
    expect(bridge.terminals[0]).toMatchObject({
      id: "rift-terminal",
      column: 10,
      row: 6,
    });
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

  it("normalizes object and blocker footprints through the shared registry helper", () => {
    const surface = normalizeV2Zone(surfaceV2Zone);
    const marketStall = surface.objects.find(
      (object) => object.type === "market_stall",
    );
    const overflow = surface.blockers.find(
      (blocker) => blocker.id === "overflow",
    );
    expect(marketStall?.footprint).toEqual(getObjectFootprint("market_stall"));
    expect(overflow?.tiles).toEqual(
      toFootprintTiles([36, 15], getObjectFootprint("overflow_blocker")),
    );
  });

  it("expands footprint rectangles deterministically", () => {
    expect(toFootprintTiles([2, 3], [2, 2])).toEqual([
      [2, 3],
      [3, 3],
      [2, 4],
      [3, 4],
    ]);
  });

  it("builds blocked tiles from v2 tile and object semantics", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    const blocked = buildBlockedTiles(bridge);
    expect(blocked.has("0,0")).toBe(true);
    expect(blocked.has("7,7")).toBe(true);
  });

  it("resolves cell semantics from v2 tile, object, and location data", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    const semantics = getCellSemantics(bridge, 10, 6);
    expect(semantics?.objectType).toBe("rift_terminal");
    expect(semantics?.verbs).toContain("use");
    expect(semantics?.description).toContain("Rift terminal");
  });

  it("places bridge crew aft of their consoles facing the viewscreen", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    const npcById = Object.fromEntries(bridge.npcs.map((n) => [n.id, n]));
    expect(npcById["helm-officer"]).toMatchObject({
      column: 4,
      row: 4,
      facing: "up",
    });
    expect(npcById["comms-officer"]).toMatchObject({
      column: 4,
      row: 9,
      facing: "up",
    });
    expect(npcById["first-officer"]).toMatchObject({
      column: 9,
      row: 3,
      facing: "up",
    });
  });

  it("prefers named location descriptions over generic floor descriptions", () => {
    const surface = getZone("surface", { useV2Zones: true });
    const semantics = getCellSemantics(surface, 16, 12);
    expect(semantics?.locationId).toBe("square");
    expect(semantics?.description).toContain("town square");
  });

  it("bridge zone declares playerStartFacing up so the captain faces the viewscreen", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    expect(bridge.playerStartFacing).toBe("up");
  });

  it("bridge NPCs carry a facing field that survives normalizeV2Zone", () => {
    const bridge = getZone("bridge", { useV2Zones: true });
    const npcById = Object.fromEntries(bridge.npcs.map((n) => [n.id, n]));
    expect(npcById["helm-officer"].facing).toBe("up");
    expect(npcById["comms-officer"].facing).toBe("up");
    expect(npcById["first-officer"].facing).toBe("up");
  });
});

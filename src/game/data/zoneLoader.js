import armoryLegacyZone from "../../data/zones/zone-armory.json";
import bridgeLegacyZone from "../../data/zones/zone-bridge.json";
import surfaceLegacyZone from "../../data/zones/zone-village.json";
import armoryV2Zone from "../../data/zones/v2/armory.json";
import bridgeV2Zone from "../../data/zones/v2/bridge.json";
import surfaceV2Zone from "../../data/zones/v2/surface.json";
import { buildBlockedTiles } from "./zoneSemantics.js";

const LEGACY_ZONES = {
  bridge: bridgeLegacyZone,
  surface: surfaceLegacyZone,
  armory: armoryLegacyZone,
};

const V2_ZONES = {
  bridge: bridgeV2Zone,
  surface: surfaceV2Zone,
  armory: armoryV2Zone,
};

function hasQueryFlag(name) {
  return new URLSearchParams(window.location.search).get(name) === "1";
}

function toPoint([column, row]) {
  return { column, row };
}

function toFootprintTiles([column, row], [width, height]) {
  const tiles = [];
  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      tiles.push([column + columnOffset, row + rowOffset]);
    }
  }
  return tiles;
}

function getZoneMap(zone) {
  return {
    width: zone.size.cols * zone.tileSize,
    height: zone.size.rows * zone.tileSize,
    tileSize: zone.tileSize,
    columns: zone.size.cols,
    rows: zone.size.rows,
  };
}

export function normalizeV2Zone(zone) {
  if (zone?.renderMode === "v2") {
    return zone;
  }

  const objects = [];
  const terminals = [];
  const blockers = [];
  const items = [];
  const npcs = [];

  for (const object of zone.objects ?? []) {
    const [column, row] = object.at;

    if (object.type === "rift_terminal") {
      terminals.push({
        id: object.id,
        name: "Rift Terminal",
        column,
        row,
      });
      continue;
    }

    if (object.type === "overflow_blocker") {
      blockers.push({
        id: object.id,
        name: "Overflow Buffer",
        column,
        row,
        clearedByObjective: object.clearedByObjective ?? "clear-overflow",
        tiles: toFootprintTiles(object.at, [1, 1]),
      });
      continue;
    }

    objects.push({
      id: object.id,
      type: object.type,
      name: object.type,
      at: object.at,
      blocks: true,
      footprint: [1, 1],
    });
  }

  for (const npc of zone.npcs ?? []) {
    npcs.push({
      ...npc,
      column: npc.home?.[0] ?? npc.column ?? 0,
      row: npc.home?.[1] ?? npc.row ?? 0,
    });
  }

  for (const item of zone.items ?? []) {
    items.push({
      id: item.id,
      name: item.type === "item" ? item.item : item.name,
      item: item.item,
      column: item.at[0],
      row: item.at[1],
      note: item.note,
    });
  }

  return {
    ...zone,
    renderMode: "v2",
    map: getZoneMap(zone),
    playerStart: toPoint(zone.playerStart),
    terminals,
    blockers,
    items,
    npcs,
    objects,
    obstacles: {
      tiles: Array.from(buildBlockedTiles(zone)).map((entry) =>
        entry.split(",").map((value) => Number.parseInt(value, 10)),
      ),
    },
  };
}

export function shouldUseV2Zones() {
  return hasQueryFlag("useV2Zones") || hasQueryFlag("v2Zones");
}

export function getZone(zoneId, { useV2Zones = shouldUseV2Zones() } = {}) {
  const zones = useV2Zones ? V2_ZONES : LEGACY_ZONES;
  const zone = zones[zoneId];
  return useV2Zones ? normalizeV2Zone(zone) : zone;
}

export function getZones(options = {}) {
  return {
    bridge: getZone("bridge", options),
    surface: getZone("surface", options),
    armory: getZone("armory", options),
  };
}

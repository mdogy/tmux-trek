import objectRegistry from "../../data/tiles/object-registry.json";
import tileRegistry from "../../data/tiles/tile-registry.json";

function toTileKey(zone, column, row) {
  const tileId = zone.grid?.[row]?.[column];
  if (!tileId || !zone.legend) {
    return null;
  }
  return zone.legend[tileId] ?? null;
}

export function toFootprintTiles([column, row], [width, height]) {
  const tiles = [];
  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      tiles.push([column + columnOffset, row + rowOffset]);
    }
  }
  return tiles;
}

export function getObjectFootprint(type) {
  return objectRegistry.objects[type]?.footprint ?? [1, 1];
}

function isInRect([column, row], [left, top, right, bottom]) {
  return column >= left && column <= right && row >= top && row <= bottom;
}

function getObjectAt(zone, column, row) {
  for (const object of zone.objects ?? []) {
    const spec = objectRegistry.objects[object.type];
    const footprint = getObjectFootprint(object.type);
    const tiles = toFootprintTiles(object.at, footprint);
    if (tiles.some(([tileColumn, tileRow]) => tileColumn === column && tileRow === row)) {
      return { ...object, spec, footprint };
    }
  }
  return null;
}

function getTerminalAt(zone, column, row) {
  for (const terminal of zone.terminals ?? []) {
    if (terminal.column === column && terminal.row === row) {
      return {
        ...terminal,
        type: "rift_terminal",
        spec: objectRegistry.objects.rift_terminal,
        footprint: getObjectFootprint("rift_terminal"),
      };
    }
  }
  return null;
}

function getBlockerAt(zone, column, row) {
  for (const blocker of zone.blockers ?? []) {
    if ((blocker.tiles ?? []).some(([tileColumn, tileRow]) => tileColumn === column && tileRow === row)) {
      return {
        ...blocker,
        type: "overflow_blocker",
        spec: objectRegistry.objects.overflow_blocker,
        footprint: getObjectFootprint("overflow_blocker"),
      };
    }
  }
  return null;
}

function getLocationAt(zone, column, row) {
  for (const location of zone.locations ?? []) {
    if (isInRect([column, row], location.rect)) {
      return location;
    }
  }
  return null;
}

function getLegacyBlockedTiles(zone) {
  const blocked = new Set();
  for (const [column, row] of zone.obstacles?.tiles ?? []) {
    blocked.add(`${column},${row}`);
  }
  for (const blocker of zone.blockers ?? []) {
    for (const [column, row] of blocker.tiles ?? []) {
      blocked.add(`${column},${row}`);
    }
  }
  return blocked;
}

function getV2BlockedTiles(zone) {
  const blocked = new Set();
  for (let row = 0; row < zone.size.rows; row += 1) {
    for (let column = 0; column < zone.size.cols; column += 1) {
      const tileKey = toTileKey(zone, column, row);
      if (!tileRegistry.tiles[tileKey]?.walkable) {
        blocked.add(`${column},${row}`);
      }
    }
  }

  for (const object of zone.objects ?? []) {
    const spec = objectRegistry.objects[object.type];
    if (!spec?.blocks) {
      continue;
    }

    const footprint = getObjectFootprint(object.type);
    for (const [column, row] of toFootprintTiles(object.at, footprint)) {
      blocked.add(`${column},${row}`);
    }
  }

  for (const terminal of zone.terminals ?? []) {
    const footprint = getObjectFootprint("rift_terminal");
    for (const [column, row] of toFootprintTiles([terminal.column, terminal.row], footprint)) {
      blocked.add(`${column},${row}`);
    }
  }

  for (const blocker of zone.blockers ?? []) {
    for (const [column, row] of blocker.tiles ?? []) {
      blocked.add(`${column},${row}`);
    }
  }

  return blocked;
}

export function buildBlockedTiles(zone) {
  if (zone?.renderMode === "v2" || zone?.legend) {
    return getV2BlockedTiles(zone);
  }

  return getLegacyBlockedTiles(zone);
}

export function getCellSemantics(zone, column, row) {
  const tileKey = toTileKey(zone, column, row);
  if (!tileKey) {
    return null;
  }

  const tileSpec = tileRegistry.tiles[tileKey];
  const object = getObjectAt(zone, column, row);
  const terminal = getTerminalAt(zone, column, row);
  const blocker = getBlockerAt(zone, column, row);
  const location = getLocationAt(zone, column, row);
  const interactive = terminal ?? blocker ?? object;
  const objectVerbs = interactive?.spec?.verbs ?? [];
  const tileVerbs = tileSpec?.verbs ?? [];
  const locationVerbs = location?.verbs ?? [];
  const verbs = [...new Set([...objectVerbs, ...tileVerbs, ...locationVerbs])];

  return {
    tileKey,
    objectType: interactive?.type ?? null,
    locationId: location?.id ?? null,
    verbs,
    description:
      interactive?.spec?.description ??
      location?.description ??
      tileSpec?.description ??
      "",
  };
}

export function getFacingFromDelta(deltaColumn, deltaRow) {
  if (deltaRow < 0) return "up";
  if (deltaRow > 0) return "down";
  if (deltaColumn < 0) return "left";
  if (deltaColumn > 0) return "right";
  return "down";
}

export function getActorScale(actorId) {
  if (actorId === "captain") {
    return 0.14;
  }

  return 0.12;
}

export function getActorAnchor(actorId) {
  return actorId === "captain"
    ? { x: 0.5, y: 0.9 }
    : { x: 0.5, y: 0.9 };
}

export function getActorYOffset() {
  return -2;
}

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
    ? { x: 0.5, y: 1 }
    : { x: 0.5, y: 1 };
}

export function getActorOffset(actorId) {
  if (actorId === "captain") {
    return { x: 0, y: 2 };
  }

  return { x: 0, y: 0 };
}

export function getActorMoveDuration() {
  return 720;
}

export function getActorWalkFrameRate() {
  return 2;
}

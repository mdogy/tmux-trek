export function getFacingFromDelta(deltaColumn, deltaRow) {
  if (deltaRow < 0) return "up";
  if (deltaRow > 0) return "down";
  if (deltaColumn < 0) return "left";
  if (deltaColumn > 0) return "right";
  return "down";
}

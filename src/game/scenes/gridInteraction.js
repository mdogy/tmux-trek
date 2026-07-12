export const INTERACT_RADIUS = 2;

// Chebyshev distance: diagonal steps count the same as cardinal steps.
export function getChebyshevDistance(a, b) {
  return Math.max(Math.abs(a.column - b.column), Math.abs(a.row - b.row));
}

export function findNearestInteractiveTarget(
  targets,
  playerGrid,
  radius = INTERACT_RADIUS,
) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const target of targets) {
    const dist = getChebyshevDistance(target, playerGrid);
    if (dist <= radius && dist < nearestDist) {
      nearest = target;
      nearestDist = dist;
    }
  }
  return nearest;
}

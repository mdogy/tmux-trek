import { describe, expect, it } from "vitest";
import {
  INTERACT_RADIUS,
  findNearestInteractiveTarget,
  getChebyshevDistance,
} from "../../src/game/scenes/gridInteraction.js";

const player = { column: 5, row: 5 };

describe("gridInteraction target lookup", () => {
  it("uses Chebyshev distance (diagonals count as one step)", () => {
    expect(getChebyshevDistance({ column: 7, row: 7 }, player)).toBe(2);
    expect(getChebyshevDistance({ column: 5, row: 8 }, player)).toBe(3);
  });

  it("finds a target at Chebyshev distance 2 (TG-6)", () => {
    const target = { id: "console", column: 7, row: 7 };
    expect(findNearestInteractiveTarget([target], player)).toBe(target);
  });

  it("does not find a target at Chebyshev distance 3 (TG-6)", () => {
    const target = { id: "console", column: 8, row: 5 };
    expect(findNearestInteractiveTarget([target], player)).toBeNull();
  });

  it("returns the nearest of several in-range targets", () => {
    const far = { id: "far", column: 7, row: 7 };
    const near = { id: "near", column: 6, row: 5 };
    expect(findNearestInteractiveTarget([far, near], player)).toBe(near);
  });

  it("returns null when there are no targets", () => {
    expect(findNearestInteractiveTarget([], player)).toBeNull();
  });

  it("exports the radius used by GridScene", () => {
    expect(INTERACT_RADIUS).toBe(2);
  });
});

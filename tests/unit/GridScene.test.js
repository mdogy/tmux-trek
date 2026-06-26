import { describe, expect, it } from "vitest";
import {
  getActorAnchor,
  getActorScale,
  getActorYOffset,
  getFacingFromDelta,
} from "../../src/game/scenes/actorMotion.js";

describe("GridScene movement facing", () => {
  it("maps vertical deltas to up and down", () => {
    expect(getFacingFromDelta(0, -1)).toBe("up");
    expect(getFacingFromDelta(0, 1)).toBe("down");
  });

  it("maps horizontal deltas to left and right", () => {
    expect(getFacingFromDelta(-1, 0)).toBe("left");
    expect(getFacingFromDelta(1, 0)).toBe("right");
  });

  it("defaults to down when no movement delta is present", () => {
    expect(getFacingFromDelta(0, 0)).toBe("down");
  });

  it("uses a stable top-down anchor and offset", () => {
    expect(getActorScale("captain")).toBeLessThan(0.2);
    expect(getActorScale("zrix")).toBeLessThan(0.2);
    expect(getActorAnchor("captain")).toEqual({ x: 0.5, y: 0.9 });
    expect(getActorYOffset()).toBe(-2);
  });
});

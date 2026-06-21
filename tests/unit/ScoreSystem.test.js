import { describe, expect, it } from "vitest";
import { ScoreSystem } from "../../src/game/systems/ScoreSystem.js";

describe("ScoreSystem", () => {
  it("awards objective and act-complete points once", () => {
    const score = new ScoreSystem();

    expect(
      score.awardObjective({ actId: "act-01-sessions", objectiveId: "open-rift" }),
    ).toBe(100);
    expect(
      score.awardObjective({ actId: "act-01-sessions", objectiveId: "open-rift" }),
    ).toBe(0);
    expect(score.awardActComplete({ actId: "act-01-sessions" })).toBe(250);
    expect(score.awardActComplete({ actId: "act-01-sessions" })).toBe(0);

    expect(score.getSnapshot()).toMatchObject({
      total: 350,
      byAct: { "act-01-sessions": 350 },
    });
  });

  it("restores a prior score snapshot", () => {
    const score = new ScoreSystem();

    score.restore({
      total: 450,
      byAct: { "act-01-sessions": 450 },
      awardedEvents: ["objective:open-rift"],
    });

    expect(score.getSnapshot()).toMatchObject({
      total: 450,
      byAct: { "act-01-sessions": 450 },
      awardedEvents: ["objective:open-rift"],
    });
  });
});

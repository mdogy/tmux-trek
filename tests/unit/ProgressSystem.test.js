import { describe, expect, it, vi } from "vitest";
import { ProgressSystem } from "../../src/game/systems/ProgressSystem.js";

const TEST_ACT = {
  id: "act-01-sessions",
  title: "First Descent",
  objectives: [{ id: "a" }, { id: "b" }],
};

describe("ProgressSystem", () => {
  it("tracks objective completion and act completion timing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T12:00:00Z"));

    const progress = new ProgressSystem([TEST_ACT]);
    progress.ensureActStarted("act-01-sessions");
    progress.markObjectiveComplete({
      actId: "act-01-sessions",
      objectiveId: "a",
    });

    vi.setSystemTime(new Date("2026-06-21T12:01:10Z"));
    progress.markObjectiveComplete({
      actId: "act-01-sessions",
      objectiveId: "b",
    });
    progress.completeAct({ actId: "act-01-sessions" });

    expect(progress.getActSummary("act-01-sessions")).toMatchObject({
      completedObjectives: 2,
      totalObjectives: 2,
      isComplete: true,
      elapsedMs: 70_000,
    });

    vi.useRealTimers();
  });

  it("restores saved progress state", () => {
    const progress = new ProgressSystem([TEST_ACT]);
    progress.restore({
      acts: {
        "act-01-sessions": {
          startedAt: 100,
          completedAt: 200,
          completedObjectiveIds: ["a", "b"],
        },
      },
    });

    expect(progress.getOverallSummary("act-01-sessions")).toMatchObject({
      totalActs: 1,
      completedActs: 1,
    });
  });
});

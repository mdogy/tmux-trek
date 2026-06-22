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

  it("clamps a future startedAt to null on restore (CR-10)", () => {
    const progress = new ProgressSystem([TEST_ACT]);
    progress.restore({
      acts: {
        "act-01-sessions": {
          startedAt: 9_999_999_999_999,
          completedAt: 9_999_999_999_999,
          completedObjectiveIds: [],
        },
      },
    });

    const summary = progress.getActSummary("act-01-sessions");
    expect(summary.startedAt).toBeNull();
    expect(summary.completedAt).toBeNull();
    expect(summary.elapsedMs).toBe(0);
  });

  it("clamps a completedAt that precedes startedAt to null (CR-10)", () => {
    const past = Date.now() - 10_000;
    const progress = new ProgressSystem([TEST_ACT]);
    progress.restore({
      acts: {
        "act-01-sessions": {
          startedAt: past,
          completedAt: past - 1,
          completedObjectiveIds: [],
        },
      },
    });

    const summary = progress.getActSummary("act-01-sessions");
    expect(summary.startedAt).toBe(past);
    expect(summary.completedAt).toBeNull();
  });
});

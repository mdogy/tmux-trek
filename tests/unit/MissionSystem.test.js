import { beforeEach, describe, expect, it } from "vitest";
import { MissionSystem } from "../../src/game/systems/MissionSystem.js";

const TEST_ACT = {
  id: "act-test",
  objectives: [
    {
      id: "open-rift",
      missionText: "Open the first rift.",
      unlocks: ["tmux"],
      trigger: {
        event: "session:created",
        name: "0",
      },
    },
    {
      id: "collect-code",
      missionText: "Collect the glyph.",
      unlocks: ["tmux new -s armory"],
      trigger: {
        event: "inventory:collected",
        item: "RIFT_CODE",
      },
    },
  ],
};

describe("MissionSystem", () => {
  let missions;

  beforeEach(() => {
    missions = new MissionSystem([TEST_ACT]);
    missions.loadAct("act-test");
  });

  it("loads the first incomplete objective for an act", () => {
    expect(missions.getCurrentObjective()?.id).toBe("open-rift");
  });

  it("advances objectives from matching events", () => {
    expect(
      missions.handleEvent("session:created", {
        name: "0",
      }),
    ).toBe(true);

    expect(missions.getCurrentObjective()?.id).toBe("collect-code");
    expect(missions.isUnlocked("tmux")).toBe(true);
  });

  it("ignores unrelated events", () => {
    expect(
      missions.handleEvent("session:created", {
        name: "armory",
      }),
    ).toBe(false);

    expect(missions.getCurrentObjective()?.id).toBe("open-rift");
  });

  it("restores progression snapshots", () => {
    missions.restore({
      currentActId: "act-test",
      currentObjectiveId: "collect-code",
      completedObjectives: ["open-rift"],
    });

    expect(missions.getCurrentObjective()?.id).toBe("collect-code");
    expect(missions.isUnlocked("tmux")).toBe(true);
  });

  it("notifies subscribers immediately on subscribe and again on objective completion", () => {
    const snapshots = [];
    missions.subscribe((snapshot) => snapshots.push(snapshot));

    missions.handleEvent("session:created", { name: "0" });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].completedObjectives).toHaveLength(0);
    expect(snapshots[1].completedObjectives).toContain("open-rift");
  });

  it("returns null for getCurrentObjective when all objectives are complete", () => {
    missions.handleEvent("session:created", { name: "0" });
    missions.handleEvent("inventory:collected", { item: "RIFT_CODE" });

    expect(missions.getCurrentObjective()).toBeNull();
  });

  it("notifies subscribers when state is restored", () => {
    const snapshots = [];
    missions.subscribe((snapshot) => snapshots.push(snapshot));

    missions.restore({
      currentActId: "act-test",
      currentObjectiveId: "collect-code",
      completedObjectives: ["open-rift"],
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[1].currentObjectiveId).toBe("collect-code");
  });
});

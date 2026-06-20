import { beforeEach, describe, expect, it, vi } from "vitest";
import { TmuxEvents } from "../../src/engine/TmuxEvents.js";
import { TransitionSystem } from "../../src/game/systems/TransitionSystem.js";

describe("TransitionSystem", () => {
  let events;
  let onTransition;
  let system;

  beforeEach(() => {
    events = new TmuxEvents();
    onTransition = vi.fn();
    system = new TransitionSystem({ events, onTransition });
    system.registerRoute("0", { sceneKey: "surface", zoneId: "surface" });
    system.registerRoute("armory", { sceneKey: "armory", zoneId: "armory" });
  });

  it("transitions to a registered route on session:attached", () => {
    events.emit("session:attached", { name: "0" });
    expect(onTransition).toHaveBeenCalledWith({
      sceneKey: "surface",
      zoneId: "surface",
    });
  });

  it("transitions to the armory route when the armory session attaches", () => {
    events.emit("session:attached", { name: "armory" });
    expect(onTransition).toHaveBeenCalledWith({
      sceneKey: "armory",
      zoneId: "armory",
    });
  });

  it("ignores session:attached for unregistered session names", () => {
    events.emit("session:attached", { name: "unknown" });
    expect(onTransition).not.toHaveBeenCalled();
  });

  it("always transitions to the bridge on session:detached", () => {
    events.emit("session:detached", {});
    expect(onTransition).toHaveBeenCalledWith({
      sceneKey: "bridge",
      zoneId: "bridge",
    });
  });

  it("fires exactly once per session:attached (no double-fire from create+attach)", () => {
    events.emit("session:attached", { name: "0" });
    expect(onTransition).toHaveBeenCalledTimes(1);
  });

  it("stops firing after dispose", () => {
    system.dispose();
    events.emit("session:attached", { name: "0" });
    events.emit("session:detached", {});
    expect(onTransition).not.toHaveBeenCalled();
  });

  it("routes can be registered after construction", () => {
    system.registerRoute("rescue", { sceneKey: "rescue", zoneId: "rescue" });
    events.emit("session:attached", { name: "rescue" });
    expect(onTransition).toHaveBeenCalledWith({
      sceneKey: "rescue",
      zoneId: "rescue",
    });
  });
});

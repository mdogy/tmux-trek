import { beforeEach, describe, expect, it } from "vitest";
import { SessionManager } from "../../src/engine/SessionManager.js";

describe("SessionManager", () => {
  let manager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  it("creates a named session", () => {
    manager.createSession("clulix");

    expect(manager.getSession("clulix")).toMatchObject({
      name: "clulix",
      attached: false,
    });
  });

  it("allocates numbered sessions when no name is given", () => {
    manager.createSession();

    expect(manager.getSession("0")).toBeDefined();
  });

  it("attaches and detaches a session while preserving it", () => {
    manager.createSession("clulix");
    manager.attachSession("clulix");
    manager.detachSession();

    expect(manager.getActiveSession()).toBeNull();
    expect(manager.getSession("clulix")).toMatchObject({
      attached: false,
    });
  });

  it("renames a session and updates the active reference", () => {
    manager.createSession("alpha");
    manager.attachSession("alpha");
    manager.renameSession("alpha", "clulix");

    expect(manager.getSession("alpha")).toBeUndefined();
    expect(manager.getSession("clulix")).toBeDefined();
    expect(manager.getActiveSession().name).toBe("clulix");
  });

  it("kills a session", () => {
    manager.createSession("clulix");
    manager.killSession("clulix");

    expect(manager.getSession("clulix")).toBeUndefined();
  });
});

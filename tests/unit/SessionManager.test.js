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

  it("creates and switches between windows in the active session", () => {
    manager.createSession("clulix");
    manager.attachSession("clulix");

    const created = manager.createWindow();
    const previous = manager.selectNextWindow(-1);

    expect(created.id).toBe(1);
    expect(manager.listWindows()).toHaveLength(2);
    expect(previous.id).toBe(0);
  });

  it("splits and closes panes without closing the active window", () => {
    manager.createSession("clulix");
    manager.attachSession("clulix");

    manager.splitActivePane("vertical");
    manager.splitActivePane("horizontal");
    const closed = manager.closeActivePane();
    const activeWindow = manager.getActiveSession().windows[0];

    expect(closed.id).toBe(2);
    expect(activeWindow.panes).toHaveLength(2);
    expect(activeWindow.activePaneId).toBe(1);
  });
});

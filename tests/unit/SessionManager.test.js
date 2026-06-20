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

  it("serializes and restores session snapshots", () => {
    manager.createSession();
    manager.createSession("armory");
    manager.attachSession("armory");

    const restored = new SessionManager();
    restored.restore(manager.toSnapshot());

    expect(restored.getActiveSession()?.name).toBe("armory");
    expect(restored.getSession("0")).toBeDefined();
    expect(restored.getSession("armory")).toBeDefined();
  });

  it("reset clears all sessions and active state", () => {
    manager.createSession("clulix");
    manager.attachSession("clulix");
    manager.reset();

    expect(manager.listSessions()).toHaveLength(0);
    expect(manager.getActiveSession()).toBeNull();
  });

  it("createSession throws for a duplicate name", () => {
    manager.createSession("clulix");
    expect(() => manager.createSession("clulix")).toThrow("duplicate session name");
  });

  it("detachSession throws when no session is active", () => {
    expect(() => manager.detachSession()).toThrow("no active session");
  });

  it("killSession throws for a non-existent session", () => {
    expect(() => manager.killSession("ghost")).toThrow("no session named ghost");
  });

  it("killSession clears the active session when the active session is killed", () => {
    manager.createSession("clulix");
    manager.attachSession("clulix");
    manager.killSession("clulix");

    expect(manager.getActiveSession()).toBeNull();
    expect(manager.listSessions()).toHaveLength(0);
  });

  it("closeActivePane throws when the active window has only one pane", () => {
    manager.createSession("clulix");
    manager.attachSession("clulix");
    expect(() => manager.closeActivePane()).toThrow("cannot close the only pane");
  });

  it("unnamed session allocation skips numbers already in use", () => {
    manager.createSession("0");
    manager.createSession("1");
    manager.createSession();

    expect(manager.getSession("2")).toBeDefined();
  });

  it("renameSession throws for a non-existent session", () => {
    expect(() => manager.renameSession("ghost", "clulix")).toThrow("no session named ghost");
  });

  it("renameSession throws when the new name is already taken", () => {
    manager.createSession("alpha");
    manager.createSession("beta");
    expect(() => manager.renameSession("alpha", "beta")).toThrow("duplicate session name");
  });

  it("createWindow throws when no session is active", () => {
    expect(() => manager.createWindow()).toThrow("no active session");
  });
});

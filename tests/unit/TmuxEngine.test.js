import { beforeEach, describe, expect, it } from "vitest";
import { TmuxEngine } from "../../src/engine/TmuxEngine.js";

describe("TmuxEngine", () => {
  let engine;

  beforeEach(() => {
    engine = new TmuxEngine();
  });

  it("opens an unnamed session with tmux", () => {
    const result = engine.execute("tmux");

    expect(result.ok).toBe(true);
    expect(result.status.activeSessionName).toBe("0");
  });

  it("creates and attaches a named session", () => {
    engine.execute("tmux");
    const result = engine.execute("tmux new -s clulix");

    expect(result.ok).toBe(true);
    expect(result.status.activeSessionName).toBe("clulix");
    expect(result.status.sessions).toHaveLength(2);
  });

  it("detaches with Ctrl+b d", () => {
    engine.execute("tmux new -s clulix");
    const result = engine.handleKeybinding("d");

    expect(result.ok).toBe(true);
    expect(result.status.activeSessionName).toBeNull();
  });

  it("lists and reattaches sessions", () => {
    engine.execute("tmux new -s clulix");
    engine.handleKeybinding("d");

    const listing = engine.execute("tmux ls");
    const attach = engine.execute("tmux attach -t clulix");

    expect(listing.output[0]).toContain("clulix");
    expect(attach.status.activeSessionName).toBe("clulix");
  });

  it("returns a tmux-style error for unknown sessions", () => {
    const result = engine.execute("tmux attach -t ghost");

    expect(result.ok).toBe(false);
    expect(engine.getLastError()).toContain("no session named ghost");
  });

  it("creates, lists, and switches windows for the Act 2 rescue", () => {
    engine.execute("tmux new -s clulix");

    const created = engine.handleKeybinding("c");
    const listing = engine.handleKeybinding("w");
    const previous = engine.handleKeybinding("p");

    expect(created.status.activeWindowId).toBe(1);
    expect(listing.output).toHaveLength(2);
    expect(previous.status.activeWindowId).toBe(0);
  });

  it("splits and closes panes for the Act 3 scanner", () => {
    engine.execute("tmux new -s clulix");

    engine.handleKeybinding("%");
    const split = engine.handleKeybinding('"');
    const closed = engine.handleKeybinding("x");

    expect(split.status.sessions[0].windows[0].panes).toHaveLength(3);
    expect(closed.status.sessions[0].windows[0].panes).toHaveLength(2);
    expect(closed.status.activePaneId).toBe(1);
  });

  it("restores persisted engine state", () => {
    engine.execute("tmux");
    engine.execute("tmux new -s armory");
    const snapshot = engine.getSnapshot();

    const restored = new TmuxEngine();
    restored.restore(snapshot);

    expect(restored.getStatus().activeSessionName).toBe("armory");
    expect(restored.getStatus().sessions).toHaveLength(2);
  });

  it("kills a session with tmux kill-session -t", () => {
    engine.execute("tmux new -s clulix");
    engine.handleKeybinding("d");
    const result = engine.execute("tmux kill-session -t clulix");

    expect(result.ok).toBe(true);
    expect(result.status.sessions).toHaveLength(0);
  });

  it("returns a fail result for an unknown command", () => {
    const result = engine.execute("not-a-command");

    expect(result.ok).toBe(false);
    expect(engine.getLastError()).toContain("unknown command");
  });

  it("reattaches to the first detached session when tmux is run with sessions present", () => {
    engine.execute("tmux new -s alpha");
    engine.handleKeybinding("d");
    engine.execute("tmux new -s beta");
    engine.handleKeybinding("d");

    const result = engine.execute("tmux");

    expect(result.ok).toBe(true);
    expect(result.status.activeSessionName).toBe("alpha");
  });

  it("getLastError is empty after a successful command", () => {
    engine.execute("not-a-command");
    engine.execute("tmux");

    expect(engine.getLastError()).toBe("");
  });

  it("tmux ls with no sessions returns the no-server message", () => {
    const result = engine.execute("tmux ls");

    expect(result.ok).toBe(true);
    expect(result.output[0]).toContain("no server running");
  });

  it("Ctrl+b s lists sessions the same as tmux ls", () => {
    engine.execute("tmux new -s clulix");
    const result = engine.handleKeybinding("s");

    expect(result.ok).toBe(true);
    expect(result.output[0]).toContain("clulix");
  });

  it("returns a fail result for an unsupported keybinding", () => {
    engine.execute("tmux new -s clulix");
    const result = engine.handleKeybinding("z");

    expect(result.ok).toBe(false);
    expect(result.output[0]).toContain("unsupported keybinding");
  });

  it("reset clears all engine state", () => {
    engine.execute("tmux");
    engine.reset();

    expect(engine.getStatus().sessions).toHaveLength(0);
    expect(engine.getStatus().activeSessionName).toBeNull();
  });
});

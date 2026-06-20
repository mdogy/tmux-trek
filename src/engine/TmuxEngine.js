import { SessionManager } from "./SessionManager.js";
import { TmuxEvents } from "./TmuxEvents.js";

export class TmuxEngine {
  constructor(events = new TmuxEvents(), sessionManager = null) {
    this.events = events;
    this.sessionManager = sessionManager ?? new SessionManager(events);
    this.lastError = "";
  }

  execute(input) {
    const command = input.trim();

    try {
      if (command === "tmux") {
        return this.#openDefaultSession();
      }

      const newSessionMatch = command.match(/^tmux new -s (\S+)$/);
      if (newSessionMatch) {
        const sessionName = newSessionMatch[1];
        this.sessionManager.createSession(sessionName);
        this.sessionManager.attachSession(sessionName);
        return this.#ok([
          `Created and attached to session ${sessionName}.`,
          "HELIX: named workspaces are easier to recover under pressure.",
        ]);
      }

      if (command === "tmux ls") {
        const sessions = this.sessionManager.listSessions();
        this.events.emit("session:listed", { sessions });

        if (sessions.length === 0) {
          return this.#ok(["no server running on /tmp/tmux-trek"]);
        }

        return this.#ok(
          sessions.map((session) => {
            const suffix = session.attached ? " (attached)" : " (detached)";
            return `${session.name}: ${session.windows.length} windows${suffix}`;
          }),
        );
      }

      const attachMatch = command.match(/^tmux attach -t (\S+)$/);
      if (attachMatch) {
        const sessionName = attachMatch[1];
        this.sessionManager.attachSession(sessionName);
        return this.#ok([
          `Attached to session ${sessionName}.`,
          "HELIX: persistence confirmed.",
        ]);
      }

      const killMatch = command.match(/^tmux kill-session -t (\S+)$/);
      if (killMatch) {
        const sessionName = killMatch[1];
        this.sessionManager.killSession(sessionName);
        return this.#ok([`Killed session ${sessionName}.`]);
      }

      return this.#fail(`unknown command: ${command}`);
    } catch (error) {
      return this.#fail(error.message);
    }
  }

  handleKeybinding(key) {
    try {
      if (key === "d") {
        const detached = this.sessionManager.detachSession();
        return this.#ok([
          `Detached from session ${detached.name}.`,
          "HELIX: the work remains alive behind you.",
        ]);
      }

      if (key === "s") {
        return this.execute("tmux ls");
      }

      if (key === "c") {
        const window = this.sessionManager.createWindow();
        return this.#ok([
          `Created window ${window.id}: ${window.name}.`,
          "HELIX: a second rescue view is now active.",
        ]);
      }

      if (key === "w") {
        const activeWindowId =
          this.sessionManager.getActiveSession().activeWindowId;
        return this.#ok(
          this.sessionManager.listWindows().map((window) => {
            const active = window.id === activeWindowId ? " (active)" : "";
            return `${window.id}: ${window.name}${active}`;
          }),
        );
      }

      if (key === "n" || key === "p") {
        const direction = key === "n" ? 1 : -1;
        const window = this.sessionManager.selectNextWindow(direction);
        return this.#ok([`Switched to window ${window.id}: ${window.name}.`]);
      }

      if (key === "%" || key === '"') {
        const direction = key === "%" ? "vertical" : "horizontal";
        const pane = this.sessionManager.splitActivePane(direction);
        return this.#ok([
          `Split ${direction} pane ${pane.id}.`,
          "HELIX: both operations remain visible.",
        ]);
      }

      if (key === "x") {
        const pane = this.sessionManager.closeActivePane();
        return this.#ok([`Closed pane ${pane.id}.`]);
      }

      return this.#fail(`unsupported keybinding: Ctrl+b ${key}`);
    } catch (error) {
      return this.#fail(error.message);
    }
  }

  getStatus() {
    const activeSession = this.sessionManager.getActiveSession();
    const activeWindow = activeSession?.windows.find(
      (window) => window.id === activeSession.activeWindowId,
    );

    return {
      activeSessionName: activeSession?.name ?? null,
      activeWindowId: activeSession?.activeWindowId ?? null,
      activePaneId: activeWindow?.activePaneId ?? null,
      sessions: this.sessionManager.listSessions(),
    };
  }

  getLastError() {
    return this.lastError;
  }

  on(eventName, listener) {
    return this.events.on(eventName, listener);
  }

  getSnapshot() {
    return {
      engine: this.sessionManager.toSnapshot(),
    };
  }

  restore(snapshot) {
    this.lastError = "";
    this.sessionManager.restore(snapshot?.engine ?? snapshot);
  }

  reset() {
    this.lastError = "";
    this.sessionManager.reset();
  }

  #openDefaultSession() {
    const existingSessions = this.sessionManager.listSessions();

    if (existingSessions.length === 0) {
      const created = this.sessionManager.createSession();
      this.sessionManager.attachSession(created.name);
      return this.#ok([
        `Opened session ${created.name}.`,
        "HELIX: you are inside the first Rift.",
      ]);
    }

    const firstDetached = existingSessions.find((session) => !session.attached);
    const target = firstDetached ?? existingSessions[0];
    this.sessionManager.attachSession(target.name);
    return this.#ok([`Attached to existing session ${target.name}.`]);
  }

  #ok(output) {
    this.lastError = "";
    return {
      ok: true,
      output,
      status: this.getStatus(),
    };
  }

  #fail(message) {
    this.lastError = message;
    return {
      ok: false,
      output: [message],
      status: this.getStatus(),
    };
  }
}

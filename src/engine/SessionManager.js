export class SessionManager {
  constructor(events = null) {
    this.events = events;
    this.sessions = new Map();
    this.activeSessionName = null;
    this.nextUnnamedSession = 0;
  }

  createSession(name) {
    const resolvedName = name ?? this.#allocateUnnamedSession();

    if (this.sessions.has(resolvedName)) {
      throw new Error(`duplicate session name: ${resolvedName}`);
    }

    const session = {
      name: resolvedName,
      attached: false,
      activeWindowId: 0,
      windows: [
        {
          id: 0,
          name: "main",
          activePaneId: 0,
          panes: [{ id: 0, title: "shell" }],
        },
      ],
    };

    this.sessions.set(resolvedName, session);
    this.#emit("session:created", { name: resolvedName, session: this.#clone(session) });
    return this.#clone(session);
  }

  attachSession(name) {
    const session = this.sessions.get(name);

    if (!session) {
      throw new Error(`no session named ${name}`);
    }

    if (this.activeSessionName && this.sessions.has(this.activeSessionName)) {
      this.sessions.get(this.activeSessionName).attached = false;
    }

    session.attached = true;
    this.activeSessionName = name;
    this.#emit("session:attached", { name, session: this.#clone(session) });
    return this.#clone(session);
  }

  detachSession() {
    if (!this.activeSessionName) {
      throw new Error("no active session");
    }

    const session = this.sessions.get(this.activeSessionName);
    session.attached = false;
    this.activeSessionName = null;
    this.#emit("session:detached", { name: session.name, session: this.#clone(session) });
    return this.#clone(session);
  }

  renameSession(oldName, newName) {
    if (!this.sessions.has(oldName)) {
      throw new Error(`no session named ${oldName}`);
    }

    if (this.sessions.has(newName)) {
      throw new Error(`duplicate session name: ${newName}`);
    }

    const session = this.sessions.get(oldName);
    this.sessions.delete(oldName);
    session.name = newName;
    this.sessions.set(newName, session);

    if (this.activeSessionName === oldName) {
      this.activeSessionName = newName;
    }

    this.#emit("session:renamed", {
      oldName,
      name: newName,
      session: this.#clone(session),
    });
    return this.#clone(session);
  }

  killSession(name) {
    if (!this.sessions.has(name)) {
      throw new Error(`no session named ${name}`);
    }

    const session = this.sessions.get(name);
    this.sessions.delete(name);

    if (this.activeSessionName === name) {
      this.activeSessionName = null;
    }

    this.#emit("session:killed", { name, session: this.#clone(session) });
  }

  createWindow() {
    const session = this.#requireActiveSession();
    const id = Math.max(...session.windows.map((window) => window.id)) + 1;
    const window = {
      id,
      name: `view-${id}`,
      activePaneId: 0,
      panes: [{ id: 0, title: "shell" }],
    };

    session.windows.push(window);
    session.activeWindowId = id;
    this.#emit("window:created", {
      sessionName: session.name,
      id,
      window: this.#clone(window),
    });
    return this.#clone(window);
  }

  listWindows() {
    const session = this.#requireActiveSession();
    return session.windows.map((window) => this.#clone(window));
  }

  selectNextWindow(direction = 1) {
    const session = this.#requireActiveSession();
    const activeIndex = session.windows.findIndex(
      (window) => window.id === session.activeWindowId,
    );
    const nextIndex =
      (activeIndex + direction + session.windows.length) %
      session.windows.length;

    session.activeWindowId = session.windows[nextIndex].id;
    this.#emit("window:selected", {
      sessionName: session.name,
      id: session.activeWindowId,
      window: this.#clone(session.windows[nextIndex]),
    });
    return this.#clone(session.windows[nextIndex]);
  }

  splitActivePane(direction) {
    const window = this.#requireActiveWindow();
    const id = Math.max(...window.panes.map((pane) => pane.id)) + 1;
    const pane = {
      id,
      title: `${direction}-scanner-${id}`,
    };

    window.panes.push(pane);
    window.activePaneId = id;
    this.#emit("pane:split", {
      sessionName: this.activeSessionName,
      windowId: window.id,
      pane: this.#clone(pane),
      direction,
    });
    return this.#clone(pane);
  }

  closeActivePane() {
    const window = this.#requireActiveWindow();

    if (window.panes.length === 1) {
      throw new Error("cannot close the only pane");
    }

    const activeIndex = window.panes.findIndex(
      (pane) => pane.id === window.activePaneId,
    );
    const [closedPane] = window.panes.splice(activeIndex, 1);
    window.activePaneId =
      window.panes[Math.max(0, activeIndex - 1)]?.id ?? window.panes[0].id;
    this.#emit("pane:closed", {
      sessionName: this.activeSessionName,
      windowId: window.id,
      pane: this.#clone(closedPane),
    });
    return this.#clone(closedPane);
  }

  getSession(name) {
    const session = this.sessions.get(name);
    return session ? this.#clone(session) : undefined;
  }

  getActiveSession() {
    if (!this.activeSessionName) {
      return null;
    }

    return this.getSession(this.activeSessionName);
  }

  listSessions() {
    return [...this.sessions.values()].map((session) => this.#clone(session));
  }

  toSnapshot() {
    return {
      sessions: this.listSessions(),
      activeSessionName: this.activeSessionName,
      nextUnnamedSession: this.nextUnnamedSession,
    };
  }

  restore(snapshot) {
    this.sessions.clear();
    this.activeSessionName = snapshot?.activeSessionName ?? null;
    this.nextUnnamedSession = snapshot?.nextUnnamedSession ?? 0;

    for (const session of snapshot?.sessions ?? []) {
      this.sessions.set(session.name, this.#clone(session));
    }
  }

  reset() {
    this.sessions.clear();
    this.activeSessionName = null;
    this.nextUnnamedSession = 0;
  }

  #requireActiveSession() {
    if (!this.activeSessionName) {
      throw new Error("no active session");
    }

    return this.sessions.get(this.activeSessionName);
  }

  #requireActiveWindow() {
    const session = this.#requireActiveSession();
    return session.windows.find(
      (window) => window.id === session.activeWindowId,
    );
  }

  #allocateUnnamedSession() {
    while (this.sessions.has(`${this.nextUnnamedSession}`)) {
      this.nextUnnamedSession += 1;
    }

    const name = `${this.nextUnnamedSession}`;
    this.nextUnnamedSession += 1;
    return name;
  }

  #clone(value) {
    return structuredClone(value);
  }

  #emit(eventName, payload) {
    this.events?.emit(eventName, payload);
  }
}

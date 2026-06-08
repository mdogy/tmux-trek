export class SessionManager {
  constructor() {
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
    return this.#clone(session);
  }

  detachSession() {
    if (!this.activeSessionName) {
      throw new Error("no active session");
    }

    const session = this.sessions.get(this.activeSessionName);
    session.attached = false;
    this.activeSessionName = null;
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

    return this.#clone(session);
  }

  killSession(name) {
    if (!this.sessions.has(name)) {
      throw new Error(`no session named ${name}`);
    }

    this.sessions.delete(name);

    if (this.activeSessionName === name) {
      this.activeSessionName = null;
    }
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
}

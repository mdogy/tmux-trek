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
      windows: [
        {
          id: 0,
          name: "main",
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

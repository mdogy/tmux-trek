export class GameState {
  constructor({ zoneName, commands, openingObjective, openingInstruction }) {
    this.listeners = new Set();
    this.state = {
      zoneName,
      missionText: openingObjective,
      instructionText: openingInstruction,
      commands,
      unlockedCommands: [],
      sessions: [],
      activeSessionName: null,
      terminalOpen: false,
      dialogueOpen: false,
      toast: "",
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  setMission(text) {
    this.#update({ missionText: text });
  }

  setZoneName(text) {
    this.#update({ zoneName: text });
  }

  setInstruction(text) {
    this.#update({ instructionText: text });
  }

  setTerminalOpen(isOpen) {
    this.#update({ terminalOpen: isOpen });
  }

  setDialogueOpen(isOpen) {
    this.#update({ dialogueOpen: isOpen });
  }

  unlockCommand(command) {
    if (this.state.unlockedCommands.includes(command)) {
      return;
    }

    this.#update({
      unlockedCommands: [...this.state.unlockedCommands, command],
      toast: `${command} added to the TMUX Codex`,
    });
  }

  clearToast() {
    this.#update({ toast: "" });
  }

  restoreUnlockedCommands(commands = []) {
    this.#update({ unlockedCommands: [...commands] });
  }

  syncStatus(status) {
    this.#update({
      sessions: status.sessions,
      activeSessionName: status.activeSessionName,
    });
  }

  getState() {
    return this.state;
  }

  #update(partial) {
    this.state = {
      ...this.state,
      ...partial,
    };

    this.listeners.forEach((listener) => listener(this.state));
  }
}

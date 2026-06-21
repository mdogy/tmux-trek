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
      activeWindowId: null,
      activePaneId: null,
      score: {
        total: 0,
        latestDelta: 0,
      },
      progress: {
        completedActs: 0,
        totalActs: 0,
        currentActTitle: "",
        completedObjectives: 0,
        totalObjectives: 0,
      },
      reviewOverlay: null,
      completionOverlay: null,
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

  setToast(text) {
    this.#update({ toast: text ?? "" });
  }

  restoreUnlockedCommands(commands = []) {
    this.#update({ unlockedCommands: [...commands] });
  }

  syncStatus(status) {
    this.#update({
      sessions: status.sessions,
      activeSessionName: status.activeSessionName,
      activeWindowId: status.activeWindowId,
      activePaneId: status.activePaneId,
    });
  }

  setScore(score) {
    this.#update({
      score: {
        total: Number.isFinite(score?.total) ? score.total : 0,
        latestDelta: Number.isFinite(score?.latestDelta) ? score.latestDelta : 0,
      },
    });
  }

  setProgress(progress) {
    this.#update({
      progress: {
        completedActs: Number.isFinite(progress?.completedActs)
          ? progress.completedActs
          : 0,
        totalActs: Number.isFinite(progress?.totalActs) ? progress.totalActs : 0,
        currentActTitle: progress?.currentActTitle ?? "",
        completedObjectives: Number.isFinite(progress?.completedObjectives)
          ? progress.completedObjectives
          : 0,
        totalObjectives: Number.isFinite(progress?.totalObjectives)
          ? progress.totalObjectives
          : 0,
      },
    });
  }

  showCompletionOverlay(summary) {
    this.#update({
      completionOverlay: summary
        ? {
            title: summary.title ?? "",
            score: Number.isFinite(summary.score) ? summary.score : 0,
            elapsedLabel: summary.elapsedLabel ?? "00:00",
            nextStep: summary.nextStep ?? "",
            buttonLabel: summary.buttonLabel ?? "Acknowledge",
          }
        : null,
    });
  }

  hideCompletionOverlay() {
    this.#update({ completionOverlay: null });
  }

  showReviewOverlay(overlay) {
    this.#update({
      reviewOverlay: overlay ? structuredClone(overlay) : null,
    });
  }

  hideReviewOverlay() {
    this.#update({ reviewOverlay: null });
  }

  updateReviewOverlay(partial) {
    if (!this.state.reviewOverlay) {
      return;
    }

    this.#update({
      reviewOverlay: {
        ...this.state.reviewOverlay,
        ...structuredClone(partial),
      },
    });
  }

  nextReviewCard() {
    const overlay = this.state.reviewOverlay;
    const items = overlay?.cards ?? overlay?.questions ?? [];
    if (!overlay || overlay.currentIndex >= items.length - 1) {
      return;
    }

    this.#update({
      reviewOverlay: {
        ...overlay,
        currentIndex: overlay.currentIndex + 1,
        showAnswer: false,
      },
    });
  }

  previousReviewCard() {
    const overlay = this.state.reviewOverlay;
    if (!overlay || overlay.currentIndex <= 0) {
      return;
    }

    this.#update({
      reviewOverlay: {
        ...overlay,
        currentIndex: overlay.currentIndex - 1,
        showAnswer: false,
      },
    });
  }

  flipReviewCard() {
    const overlay = this.state.reviewOverlay;
    if (!overlay || overlay.mode === "gate") {
      return;
    }

    this.#update({
      reviewOverlay: {
        ...overlay,
        showAnswer: !overlay.showAnswer,
      },
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

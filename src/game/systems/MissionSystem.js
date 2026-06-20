export class MissionSystem {
  constructor(acts = []) {
    this.acts = new Map(acts.map((act) => [act.id, structuredClone(act)]));
    this.listeners = new Set();
    this.currentActId = null;
    this.completedObjectives = new Set();
    this.currentObjectiveId = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  loadAct(id) {
    const act = this.acts.get(id);

    if (!act) {
      throw new Error(`unknown act: ${id}`);
    }

    this.currentActId = id;
    this.currentObjectiveId =
      act.objectives.find((objective) => !this.completedObjectives.has(objective.id))
        ?.id ?? null;
    this.#notify();
    return this.getCurrentObjective();
  }

  handleEvent(eventName, payload = {}) {
    const objective = this.getCurrentObjective();

    if (!objective?.trigger) {
      return false;
    }

    if (objective.trigger.event !== eventName) {
      return false;
    }

    if (
      objective.trigger.name &&
      objective.trigger.name !== payload.name &&
      objective.trigger.name !== payload.id
    ) {
      return false;
    }

    if (
      objective.trigger.item &&
      objective.trigger.item !== payload.item
    ) {
      return false;
    }

    this.completeObjective(objective.id);
    return true;
  }

  completeObjective(id) {
    const objective = this.#findObjective(id);

    if (!objective) {
      throw new Error(`unknown objective: ${id}`);
    }

    if (this.completedObjectives.has(id)) {
      return this.getCurrentObjective();
    }

    this.completedObjectives.add(id);

    const currentAct = this.#getCurrentAct();
    const remaining = currentAct?.objectives.find(
      (candidate) => !this.completedObjectives.has(candidate.id),
    );
    this.currentObjectiveId = remaining?.id ?? null;
    this.#notify();
    return this.getCurrentObjective();
  }

  getCurrentObjective() {
    const objective = this.currentActId && this.currentObjectiveId
      ? this.#findObjective(this.currentObjectiveId)
      : null;
    return objective ? structuredClone(objective) : null;
  }

  isUnlocked(commandId) {
    const currentAct = this.#getCurrentAct();

    if (!currentAct) {
      return false;
    }

    return currentAct.objectives.some(
      (objective) =>
        this.completedObjectives.has(objective.id) &&
        objective.unlocks?.includes(commandId),
    );
  }

  restore(snapshot = {}) {
    this.currentActId = snapshot.currentActId ?? null;
    this.currentObjectiveId = snapshot.currentObjectiveId ?? null;
    this.completedObjectives = new Set(snapshot.completedObjectives ?? []);
    this.#notify();
  }

  getSnapshot() {
    return {
      currentActId: this.currentActId,
      currentObjectiveId: this.currentObjectiveId,
      completedObjectives: [...this.completedObjectives],
    };
  }

  #getCurrentAct() {
    return this.currentActId ? this.acts.get(this.currentActId) : null;
  }

  #findObjective(id) {
    return this.#getCurrentAct()?.objectives.find(
      (objective) => objective.id === id,
    );
  }

  #notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

}

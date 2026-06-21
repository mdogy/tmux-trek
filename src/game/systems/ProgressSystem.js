export class ProgressSystem {
  constructor(acts = []) {
    this.actMeta = new Map(
      acts.map((act) => [
        act.id,
        {
          title: act.title,
          totalObjectives: act.objectives.length,
        },
      ]),
    );
    this.acts = {};
  }

  ensureActStarted(actId, timestamp = Date.now()) {
    if (!actId) {
      return;
    }

    const entry = this.#getOrCreateEntry(actId);
    if (entry.startedAt === null) {
      entry.startedAt = timestamp;
    }
  }

  markObjectiveComplete({ actId, objectiveId, timestamp = Date.now() }) {
    if (!actId || !objectiveId) {
      return;
    }

    const entry = this.#getOrCreateEntry(actId);
    if (entry.startedAt === null) {
      entry.startedAt = timestamp;
    }
    if (!entry.completedObjectiveIds.includes(objectiveId)) {
      entry.completedObjectiveIds.push(objectiveId);
    }
  }

  completeAct({ actId, timestamp = Date.now() }) {
    if (!actId) {
      return;
    }

    const entry = this.#getOrCreateEntry(actId);
    if (entry.startedAt === null) {
      entry.startedAt = timestamp;
    }
    if (entry.completedAt === null) {
      entry.completedAt = timestamp;
    }
  }

  getActSummary(actId) {
    const meta = this.actMeta.get(actId) ?? {
      title: actId,
      totalObjectives: 0,
    };
    const entry = this.acts[actId] ?? {
      startedAt: null,
      completedAt: null,
      completedObjectiveIds: [],
    };
    const completedObjectives = entry.completedObjectiveIds.length;

    return {
      actId,
      title: meta.title,
      totalObjectives: meta.totalObjectives,
      completedObjectives,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
      isComplete:
        meta.totalObjectives > 0 && completedObjectives >= meta.totalObjectives,
      elapsedMs:
        entry.startedAt === null
          ? 0
          : (entry.completedAt ?? Date.now()) - entry.startedAt,
    };
  }

  getOverallSummary(currentActId) {
    const actIds = [...this.actMeta.keys()];
    const completedActs = actIds.filter((actId) => this.getActSummary(actId).isComplete);
    const currentAct = currentActId ? this.getActSummary(currentActId) : null;

    return {
      totalActs: actIds.length,
      completedActs: completedActs.length,
      currentAct,
      acts: actIds.map((actId) => this.getActSummary(actId)),
    };
  }

  getSnapshot() {
    return {
      acts: structuredClone(this.acts),
    };
  }

  restore(snapshot = {}) {
    const nextActs = {};
    const acts = snapshot?.acts;

    if (acts && typeof acts === "object") {
      for (const [actId, entry] of Object.entries(acts)) {
        if (typeof actId !== "string") {
          continue;
        }
        nextActs[actId] = {
          startedAt: Number.isFinite(entry?.startedAt) ? entry.startedAt : null,
          completedAt: Number.isFinite(entry?.completedAt)
            ? entry.completedAt
            : null,
          completedObjectiveIds: Array.isArray(entry?.completedObjectiveIds)
            ? entry.completedObjectiveIds.filter((id) => typeof id === "string")
            : [],
        };
      }
    }

    this.acts = nextActs;
  }

  #getOrCreateEntry(actId) {
    if (!this.acts[actId]) {
      this.acts[actId] = {
        startedAt: null,
        completedAt: null,
        completedObjectiveIds: [],
      };
    }

    return this.acts[actId];
  }
}

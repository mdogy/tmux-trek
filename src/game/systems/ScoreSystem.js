const DEFAULT_SCORES = {
  objectiveComplete: 100,
  actComplete: 250,
};

export class ScoreSystem {
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_SCORES,
      ...config,
    };
    this.total = 0;
    this.byAct = {};
    this.awardedEvents = new Set();
  }

  awardObjective({ actId, objectiveId }) {
    return this.#award({
      eventId: `objective:${objectiveId}`,
      actId,
      points: this.config.objectiveComplete,
    });
  }

  awardActComplete({ actId }) {
    return this.#award({
      eventId: `act:${actId}:complete`,
      actId,
      points: this.config.actComplete,
    });
  }

  getSnapshot() {
    return {
      total: this.total,
      byAct: { ...this.byAct },
      awardedEvents: [...this.awardedEvents],
    };
  }

  restore(snapshot = {}) {
    this.total = Number.isFinite(snapshot.total) ? snapshot.total : 0;
    this.byAct = this.#normalizeByAct(snapshot.byAct);
    this.awardedEvents = new Set(
      Array.isArray(snapshot.awardedEvents)
        ? snapshot.awardedEvents.filter((eventId) => typeof eventId === "string")
        : [],
    );
  }

  #award({ eventId, actId, points }) {
    if (!eventId || this.awardedEvents.has(eventId)) {
      return 0;
    }

    this.awardedEvents.add(eventId);
    this.total += points;
    this.byAct[actId] = (this.byAct[actId] ?? 0) + points;
    return points;
  }

  #normalizeByAct(byAct) {
    if (!byAct || typeof byAct !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(byAct).filter(
        ([actId, score]) => typeof actId === "string" && Number.isFinite(score),
      ),
    );
  }
}

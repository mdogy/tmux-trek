export class TransitionSystem {
  constructor({ events, onTransition }) {
    this.events = events;
    this.onTransition = onTransition;
    this.zoneRoutes = new Map();
    this.unsubscribers = [
      this.events.on("session:attached", (payload) => this.#handleSession(payload)),
      this.events.on("session:detached", () =>
        this.onTransition({ sceneKey: "bridge", zoneId: "bridge" }),
      ),
    ];
  }

  registerRoute(sessionName, route) {
    this.zoneRoutes.set(sessionName, route);
  }

  dispose() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }

  #handleSession({ name }) {
    const route = this.zoneRoutes.get(name);

    if (!route) {
      return;
    }

    this.onTransition(route);
  }
}

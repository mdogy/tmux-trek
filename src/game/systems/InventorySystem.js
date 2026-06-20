export const INVENTORY_ITEMS = {
  RIFT_CODE: "RIFT_CODE",
  CHANNEL_TOKEN: "CHANNEL_TOKEN",
  SCANNER_ARRAY: "SCANNER_ARRAY",
  ARCHIVE_CRYSTAL: "ARCHIVE_CRYSTAL",
  ARMORY_WEAPON: "ARMORY_WEAPON",
};

export class InventorySystem {
  constructor(initialItems = []) {
    this.listeners = new Set();
    this.items = new Set(initialItems);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  has(item) {
    return this.items.has(item);
  }

  collect(item) {
    if (this.items.has(item)) {
      return false;
    }

    this.items.add(item);
    this.#notify();
    return true;
  }

  restore(snapshot = { items: [] }) {
    this.items = new Set(snapshot.items ?? []);
    this.#notify();
  }

  getSnapshot() {
    return {
      items: [...this.items],
    };
  }

  #notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

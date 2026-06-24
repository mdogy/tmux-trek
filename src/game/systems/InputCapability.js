export class InputCapability {
  constructor({
    hasTouch = false,
    hasFinePointer = false,
    hasSeenKeyboardInput = false,
    keyboardOverride = false,
  } = {}) {
    this.hasTouch = Boolean(hasTouch);
    this.hasFinePointer = Boolean(hasFinePointer);
    this.hasSeenKeyboardInput = Boolean(hasSeenKeyboardInput);
    this.keyboardOverride = Boolean(keyboardOverride);
  }

  recordKeyboardInput(event = {}) {
    if (!event || typeof event !== "object") {
      return this.getSnapshot();
    }

    this.hasSeenKeyboardInput = true;
    return this.getSnapshot();
  }

  setKeyboardOverride(enabled) {
    this.keyboardOverride = Boolean(enabled);
    return this.getSnapshot();
  }

  get canSendPrefix() {
    return this.hasSeenKeyboardInput || this.keyboardOverride;
  }

  getSnapshot() {
    return {
      hasTouch: this.hasTouch,
      hasFinePointer: this.hasFinePointer,
      hasSeenKeyboardInput: this.hasSeenKeyboardInput,
      keyboardOverride: this.keyboardOverride,
      canSendPrefix: this.canSendPrefix,
    };
  }
}

export function detectInputCapability({
  navigator = globalThis.navigator,
  matchMedia = globalThis.matchMedia?.bind(globalThis),
} = {}) {
  return new InputCapability({
    hasTouch: (navigator?.maxTouchPoints ?? 0) > 0,
    hasFinePointer: matchMedia?.("(pointer: fine)")?.matches ?? false,
  });
}

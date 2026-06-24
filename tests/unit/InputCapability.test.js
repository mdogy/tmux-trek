import { describe, expect, it } from "vitest";
import {
  detectInputCapability,
  InputCapability,
} from "../../src/game/systems/InputCapability.js";

describe("InputCapability", () => {
  it("starts touch-only sessions without prefix capability", () => {
    const capability = new InputCapability({ hasTouch: true });
    expect(capability.getSnapshot()).toEqual({
      hasTouch: true,
      hasFinePointer: false,
      hasSeenKeyboardInput: false,
      keyboardOverride: false,
      canSendPrefix: false,
    });
  });

  it("does not treat a fine pointer as keyboard capability", () => {
    const capability = new InputCapability({ hasFinePointer: true });
    expect(capability.canSendPrefix).toBe(false);
  });

  it("enables prefix capability after a keyboard event", () => {
    const capability = new InputCapability({ hasTouch: true });
    capability.recordKeyboardInput({ type: "keydown", code: "KeyA" });
    expect(capability.getSnapshot()).toEqual({
      hasTouch: true,
      hasFinePointer: false,
      hasSeenKeyboardInput: true,
      keyboardOverride: false,
      canSendPrefix: true,
    });
  });

  it("allows an explicit keyboard override", () => {
    const capability = new InputCapability({ hasTouch: true });
    capability.setKeyboardOverride(true);
    expect(capability.canSendPrefix).toBe(true);
    capability.setKeyboardOverride(false);
    expect(capability.canSendPrefix).toBe(false);
  });

  it("ignores malformed keyboard input without crashing", () => {
    const capability = new InputCapability();
    expect(() => capability.recordKeyboardInput(null)).not.toThrow();
    expect(() => capability.recordKeyboardInput(undefined)).not.toThrow();
  });

  it("detects touch and fine pointer capability from injected environment", () => {
    const capability = detectInputCapability({
      navigator: { maxTouchPoints: 2 },
      matchMedia: () => ({ matches: true }),
    });
    expect(capability.getSnapshot()).toEqual({
      hasTouch: true,
      hasFinePointer: true,
      hasSeenKeyboardInput: false,
      keyboardOverride: false,
      canSendPrefix: false,
    });
  });
});

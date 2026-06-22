import { beforeEach, describe, expect, it, vi } from "vitest";
import { TmuxEmulator } from "../../src/terminal/TmuxEmulator.js";

// Capture the onKey handler that TmuxEmulator registers with the renderer so
// that tests can drive key events without accessing private fields.
let capturedKeyHandler = null;

vi.mock("../../src/terminal/TerminalRenderer.js", () => ({
  TerminalRenderer: class {
    mount = vi.fn();
    dispose = vi.fn();
    clear = vi.fn();
    write = vi.fn();
    writeln = vi.fn();
    onKey(cb) {
      capturedKeyHandler = cb;
      return { dispose: vi.fn() };
    }
  },
}));

vi.mock("../../src/game/systems/AudioSystem.js", () => ({
  playKeystroke: vi.fn(),
  playSuccess: vi.fn(),
  playError: vi.fn(),
}));

// Minimal DOM stub — only what TmuxEmulator.#addRestartButton needs.
const stubButton = {
  className: "",
  type: "",
  textContent: "",
  addEventListener: vi.fn(),
  remove: vi.fn(),
};
vi.stubGlobal("document", {
  createElement: vi.fn(() => ({ ...stubButton, addEventListener: vi.fn(), remove: vi.fn() })),
  querySelector: vi.fn(() => null),
});

const MOCK_CHALLENGE = {
  id: "test-challenge",
  title: "Test",
  successMessage: "Done.",
  steps: [
    {
      kind: "keybinding",
      expected: "d",
      helix: "Detach.",
      instruction: "Press Ctrl+b then d.",
    },
  ],
};

function makeEmulator() {
  const container = { dataset: {}, appendChild: vi.fn() };
  const inventory = { has: vi.fn().mockReturnValue(true) };
  return new TmuxEmulator({
    container,
    inventory,
    onInstructionChange: vi.fn(),
    onCommandUnlocked: vi.fn(),
    onStatusChange: vi.fn(),
    onChallengeComplete: vi.fn(),
  });
}

function ctrlB() {
  return { key: "b", domEvent: { ctrlKey: true, key: "b", preventDefault: vi.fn() } };
}

describe("TmuxEmulator — prefix key handling (TG-5 / CR-5)", () => {
  let emulator;

  beforeEach(() => {
    capturedKeyHandler = null;
    emulator = makeEmulator();
    emulator.openChallenge(MOCK_CHALLENGE);
  });

  it("arms the prefix on the first Ctrl+b press", () => {
    capturedKeyHandler(ctrlB());
    expect(emulator.prefixArmed).toBe(true);
  });

  it("does not re-arm or emit extra output on a second Ctrl+b while already armed", () => {
    capturedKeyHandler(ctrlB());
    const callsBefore = emulator.renderer.writeln.mock.calls.length;

    capturedKeyHandler(ctrlB());

    expect(emulator.renderer.writeln.mock.calls.length).toBe(callsBefore);
    expect(emulator.prefixArmed).toBe(true);
  });

  it("disarms the prefix after a subsequent non-Ctrl key", () => {
    capturedKeyHandler(ctrlB());
    capturedKeyHandler({
      key: "d",
      domEvent: { ctrlKey: false, key: "d", metaKey: false, preventDefault: vi.fn() },
    });
    expect(emulator.prefixArmed).toBe(false);
  });
});

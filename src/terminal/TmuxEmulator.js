import { TmuxEngine } from "../engine/TmuxEngine.js";
import { TerminalRenderer } from "./TerminalRenderer.js";

export class TmuxEmulator {
  constructor({
    container,
    inventory,
    onInstructionChange,
    onCommandUnlocked,
    onStatusChange,
    onChallengeComplete,
  }) {
    this.container = container;
    this.inventory = inventory;
    this.onInstructionChange = onInstructionChange;
    this.onCommandUnlocked = onCommandUnlocked;
    this.onStatusChange = onStatusChange;
    this.onChallengeComplete = onChallengeComplete;
    this.renderer = new TerminalRenderer();
    this.engine = new TmuxEngine();
    this.inputBuffer = "";
    this.prefixArmed = false;
    this.activeChallenge = null;
    this.activeStepIndex = 0;
    this.keySubscription = null;
  }

  openChallenge(challenge) {
    this.activeChallenge = challenge;
    this.activeStepIndex = 0;
    this.inputBuffer = "";
    this.prefixArmed = false;
    this.renderer.mount(this.container);
    this.keySubscription?.dispose?.();
    this.keySubscription = this.renderer.onKey((event) => this.#handleKey(event));
    this.renderer.clear();
    this.container.dataset.activeChallenge = challenge.id;
    this.container.dataset.activeStep = "0";
    this.renderer.writeln("TMUX TREK / TERMINAL PLANE");
    this.renderer.writeln("----------------------------------------");
    this.renderer.writeln(challenge.title);
    this.renderer.writeln("");
    this.#announceCurrentStep();
    this.#prompt();
    this.onStatusChange(this.engine.getStatus());
  }

  close() {
    this.keySubscription?.dispose?.();
    this.keySubscription = null;
    this.renderer.dispose();
    this.activeChallenge = null;
    this.activeStepIndex = 0;
    this.inputBuffer = "";
    this.prefixArmed = false;
    delete this.container.dataset.activeChallenge;
    delete this.container.dataset.activeStep;
  }

  #announceCurrentStep() {
    const step = this.activeChallenge.steps[this.activeStepIndex];
    this.container.dataset.activeStep = `${this.activeStepIndex}`;
    this.container.dataset.expected = step.expected;
    this.renderer.writeln(`HELIX: ${step.helix}`);
    this.renderer.writeln(`TASK: ${step.instruction}`);
    this.renderer.writeln("");
    this.onInstructionChange(step.instruction);
  }

  #prompt() {
    const activeSession = this.engine.getStatus().activeSessionName ?? "bridge";
    this.renderer.write(`[${activeSession}] $ `);
  }

  #handleKey({ key, domEvent }) {
    if (!this.activeChallenge) {
      return;
    }

    if (domEvent.ctrlKey && domEvent.key.toLowerCase() === "b") {
      domEvent.preventDefault();
      this.prefixArmed = true;
      this.renderer.writeln("^B");
      this.renderer.writeln("HELIX: prefix accepted. Awaiting the next key.");
      this.#prompt();
      return;
    }

    if (this.prefixArmed) {
      domEvent.preventDefault();
      this.prefixArmed = false;
      this.renderer.writeln(key);
      this.#handleKeybinding(key.toLowerCase());
      return;
    }

    if (domEvent.key === "Enter") {
      domEvent.preventDefault();
      this.renderer.writeln("");
      const command = this.inputBuffer.trim();
      this.inputBuffer = "";
      this.#handleCommand(command);
      return;
    }

    if (domEvent.key === "Backspace") {
      domEvent.preventDefault();

      if (this.inputBuffer.length > 0) {
        this.inputBuffer = this.inputBuffer.slice(0, -1);
        this.renderer.write("\b \b");
      }

      return;
    }

    if (key.length === 1 && !domEvent.metaKey && !domEvent.ctrlKey) {
      this.inputBuffer += key;
      this.renderer.write(key);
    }
  }

  #handleCommand(command) {
    const step = this.activeChallenge.steps[this.activeStepIndex];

    if (!command) {
      this.#prompt();
      return;
    }

    const blockedMessage = this.#getBlockedCommandMessage(command);
    if (blockedMessage) {
      this.renderer.writeln(blockedMessage);
      this.renderer.writeln("");
      this.#prompt();
      return;
    }

    const result = this.engine.execute(command);
    result.output.forEach((line) => this.renderer.writeln(line));
    this.onStatusChange(result.status);

    if (step.kind === "command" && command === step.expected && result.ok) {
      this.#completeStep(step);
      return;
    }

    if (step.kind === "command" && command !== step.expected) {
      this.renderer.writeln(`HELIX: not yet. ${step.instruction}`);
    }

    this.renderer.writeln("");
    this.#prompt();
  }

  #getBlockedCommandMessage(command) {
    if (
      /^tmux new -s \S+$/.test(command) &&
      !this.inventory?.has("RIFT_CODE")
    ) {
      return "HELIX: no Rift Code loaded. Find the glyph before naming a new destination.";
    }

    return null;
  }

  #handleKeybinding(key) {
    const step = this.activeChallenge.steps[this.activeStepIndex];
    const result = this.engine.handleKeybinding(key);
    result.output.forEach((line) => this.renderer.writeln(line));
    this.onStatusChange(result.status);

    if (step.kind === "keybinding" && key === step.expected && result.ok) {
      this.#completeStep(step);
      return;
    }

    if (step.kind === "keybinding" && key !== step.expected) {
      this.renderer.writeln(`HELIX: wrong follow-up key. ${step.instruction}`);
    }

    this.renderer.writeln("");
    this.#prompt();
  }

  #completeStep(step) {
    if (step.unlockCommand) {
      this.onCommandUnlocked(step.unlockCommand);
    }

    this.activeStepIndex += 1;

    if (this.activeStepIndex >= this.activeChallenge.steps.length) {
      this.renderer.writeln("");
      this.renderer.writeln(`SUCCESS: ${this.activeChallenge.successMessage}`);
      this.onChallengeComplete(this.activeChallenge.id);
      return;
    }

    this.renderer.writeln("");
    this.#announceCurrentStep();
    this.#prompt();
  }
}

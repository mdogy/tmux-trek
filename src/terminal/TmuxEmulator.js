import { playError, playKeystroke, playSuccess } from "../game/systems/AudioSystem.js";
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
    this.challengeEngineSnapshot = null;
    this.restartButton = null;
  }

  openChallenge(challenge) {
    this.activeChallenge = challenge;
    this.activeStepIndex = 0;
    this.inputBuffer = "";
    this.prefixArmed = false;
    this.challengeEngineSnapshot = this.engine.getSnapshot();
    this.renderer.mount(this.container);
    this.keySubscription?.dispose?.();
    this.keySubscription = this.renderer.onKey((event) => this.#handleKey(event));
    this.#addRestartButton();
    this.renderer.clear();
    this.container.dataset.activeChallenge = challenge.id;
    this.container.dataset.activeStep = "0";
    this.#renderChallengeHeader(challenge.title);
    this.#announceCurrentStep();
    this.#prompt();
    this.onStatusChange(this.engine.getStatus());
  }

  close() {
    this.keySubscription?.dispose?.();
    this.keySubscription = null;
    this.restartButton?.remove();
    this.restartButton = null;
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
      if (this.prefixArmed) {
        return;
      }
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
      playKeystroke();
    }
  }

  #handleCommand(command) {
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

    this.#evaluate("command", command, this.engine.execute(command));
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
    this.#evaluate("keybinding", key, this.engine.handleKeybinding(key));
  }

  #evaluate(kind, input, result) {
    const step = this.activeChallenge.steps[this.activeStepIndex];
    result.output.forEach((line) => this.renderer.writeln(line));
    this.onStatusChange(result.status);

    if (step.kind === kind && input === step.expected && result.ok) {
      this.#completeStep(step);
      return;
    }

    if (step.kind === kind && input !== step.expected) {
      this.renderer.writeln(this.#categorizeError(kind, input, step));
      playError();
    }

    this.renderer.writeln("");
    this.#prompt();
  }

  #categorizeError(kind, input, step) {
    const expected = step.expected;

    if (kind === "keybinding") {
      return `HELIX: wrong key. After Ctrl+b, press: ${expected}`;
    }

    if (input.toLowerCase() === expected.toLowerCase()) {
      return `HELIX: tmux is case-sensitive. Try: ${expected}`;
    }

    const inParts = input.trim().split(/\s+/);
    const exParts = expected.trim().split(/\s+/);

    if (inParts[0] === exParts[0] && inParts[1] === exParts[1]) {
      return `HELIX: right command, wrong argument. Expected: ${expected}`;
    }

    if (inParts[0] === "tmux" && exParts[0] === "tmux") {
      return `HELIX: right tool, wrong subcommand. Expected: ${expected}`;
    }

    return `HELIX: ${step.instruction}`;
  }

  #renderChallengeHeader(title) {
    this.renderer.writeln("TMUX TREK / TERMINAL PLANE");
    this.renderer.writeln("----------------------------------------");
    this.renderer.writeln(title);
    this.renderer.writeln("");
  }

  #addRestartButton() {
    this.restartButton?.remove();
    this.restartButton = document.createElement("button");
    this.restartButton.className = "terminal-restart-btn";
    this.restartButton.type = "button";
    this.restartButton.textContent = "↺ Restart";
    this.restartButton.addEventListener("click", () => this.#restart());
    this.container.appendChild(this.restartButton);
  }

  #restart() {
    this.engine.restore(this.challengeEngineSnapshot);
    this.activeStepIndex = 0;
    this.inputBuffer = "";
    this.prefixArmed = false;
    this.renderer.clear();
    this.container.dataset.activeStep = "0";
    this.#renderChallengeHeader(`${this.activeChallenge.title} [RESTARTED]`);
    this.#announceCurrentStep();
    this.#prompt();
    this.onStatusChange(this.engine.getStatus());
  }

  #completeStep(step) {
    if (step.unlockCommand) {
      this.onCommandUnlocked(step.unlockCommand);
    }

    this.activeStepIndex += 1;

    if (this.activeStepIndex >= this.activeChallenge.steps.length) {
      this.renderer.writeln("");
      this.renderer.writeln(`SUCCESS: ${this.activeChallenge.successMessage}`);
      playSuccess();
      this.onChallengeComplete(this.activeChallenge.id);
      return;
    }

    this.renderer.writeln("");
    this.#announceCurrentStep();
    this.#prompt();
  }
}

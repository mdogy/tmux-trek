import Phaser from "phaser";
import sessionCurriculum from "../data/commands/session-curriculum.json";
import zone01Challenges from "../data/commands/zone-01-session-challenges.json";
import orinDialogue from "../data/dialogue/zone-01-orin.json";
import redshirtDialogue from "../data/dialogue/zone-01-redshirt.json";
import sockDialogue from "../data/dialogue/zone-01-sock.json";
import vrexDialogue from "../data/dialogue/zone-01-vrex.json";
import zrixDialogue from "../data/dialogue/zone-01-zrix.json";
import zone01 from "../data/zones/zone-01.json";
import { TmuxEmulator } from "../terminal/TmuxEmulator.js";
import { BootScene } from "./scenes/BootScene.js";
import { WorldScene } from "./scenes/WorldScene.js";
import { GameState } from "./systems/GameState.js";
import { UIController } from "./systems/UIController.js";

const dialogueById = {
  "zone-01-zrix": zrixDialogue,
  "zone-01-vrex": vrexDialogue,
  "zone-01-orin": orinDialogue,
  "zone-01-redshirt": redshirtDialogue,
  "zone-01-sock": sockDialogue,
};

export class TmuxTrekApp {
  constructor() {
    this.zone = zone01;
    this.challenges = zone01Challenges;
    this.currentNpcIndex = 0;
    this.completedChallenges = new Set();

    this.state = new GameState({
      zoneName: this.zone.name,
      commands: sessionCurriculum,
      openingObjective: "Meet Zrix and open your first session Rift.",
      openingInstruction:
        "Start with the glowing mentor. The game will tell you the exact tmux action to perform.",
    });

    this.ui = new UIController({
      state: this.state,
      terminalRoot: document.querySelector("#terminal-root"),
      dialogueRoot: document.querySelector("#dialogue-root"),
      toastRoot: document.querySelector("#toast-root"),
    });

    this.terminal = new TmuxEmulator({
      container: document.querySelector("#terminal-root"),
      onInstructionChange: (instruction) =>
        this.state.setInstruction(instruction),
      onCommandUnlocked: (command) => this.state.unlockCommand(command),
      onStatusChange: (status) => this.state.syncStatus(status),
      onChallengeComplete: (challengeId) => this.completeChallenge(challengeId),
    });
  }

  start() {
    const gameRoot = document.querySelector("#game-root");
    gameRoot.tabIndex = 0;

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: this.zone.map.width,
      height: this.zone.map.height,
      parent: "game-root",
      scene: [BootScene, WorldScene],
      render: {
        pixelArt: true,
      },
    });

    this.game.registry.set("app", this);
  }

  focusGame() {
    window.requestAnimationFrame(() => {
      document.querySelector("#game-root")?.focus();
      this.game?.canvas?.focus?.();
    });
  }

  getZone() {
    return this.zone;
  }

  getActiveNpcId() {
    return this.zone.npcs[this.currentNpcIndex]?.id ?? null;
  }

  getActiveNpcIndex() {
    return this.currentNpcIndex;
  }

  isCompleted(challengeId) {
    return this.completedChallenges.has(challengeId);
  }

  isOverlayOpen() {
    const snapshot = this.state.getState();
    return snapshot.dialogueOpen || snapshot.terminalOpen;
  }

  isBeaconActive() {
    return this.completedChallenges.size === this.challenges.length;
  }

  handleNpcInteraction(npcId) {
    const activeNpc = this.zone.npcs[this.currentNpcIndex];

    if (!activeNpc || npcId !== activeNpc.id) {
      this.handleInactiveInteraction("That mentor", activeNpc?.name);
      return;
    }

    const dialogue = dialogueById[activeNpc.dialogueFile];
    this.ui.showDialogue(dialogue, () =>
      this.#startChallenge(activeNpc.challengeId),
    );
  }

  handleInactiveInteraction(targetName, activeName) {
    const nextTarget = activeName ? ` Find ${activeName}.` : "";
    this.state.setInstruction(
      `${targetName} has nothing to say yet.${nextTarget}`,
    );
  }

  setWorldPrompt(prompt) {
    this.state.setInstruction(prompt);
  }

  handleBeaconInteraction() {
    this.ui.showDialogue(
      [
        {
          speaker: "HELIX",
          text: "Beacon stable. Redshirt is recovered, and Commander Sock's scanner is monitoring the Rift storm across parallel panes.",
        },
        {
          speaker: "HELIX",
          text: "Acts 1 through 3 are operational: sessions preserve places, windows navigate live views, and panes keep simultaneous threats visible.",
        },
      ],
      () => {
        this.state.setMission(
          "Act 3 complete. The expedition is ready for deeper Rift storms.",
        );
        this.state.setInstruction(
          "Training complete. Redshirt and Commander Sock are ready for the next expedition.",
        );
        this.focusGame();
      },
    );
  }

  completeChallenge(challengeId) {
    this.completedChallenges.add(challengeId);
    this.state.setTerminalOpen(false);
    this.terminal.close();
    this.focusGame();

    this.currentNpcIndex += 1;

    if (this.currentNpcIndex >= this.zone.npcs.length) {
      this.state.setMission(
        "Return to the CLULIX beacon to close the training loop.",
      );
      this.state.setInstruction(
        "Walk to the beacon. The game should always close the loop by showing what the command changed.",
      );
      return;
    }

    const nextNpc = this.zone.npcs[this.currentNpcIndex];
    this.state.setMission(`Meet ${nextNpc.name} for the next Rift lesson.`);
    this.state.setInstruction(
      `Follow the highlighted mentor and continue learning with ${nextNpc.name}.`,
    );
  }

  #startChallenge(challengeId) {
    const challenge = this.challenges.find((item) => item.id === challengeId);
    this.state.setTerminalOpen(true);
    this.state.setMission(challenge.title);
    this.terminal.openChallenge(challenge);
  }
}

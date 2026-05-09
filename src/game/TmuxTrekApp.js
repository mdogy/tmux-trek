import Phaser from "phaser";
import sessionCurriculum from "../data/commands/session-curriculum.json";
import zone01Challenges from "../data/commands/zone-01-session-challenges.json";
import orinDialogue from "../data/dialogue/zone-01-orin.json";
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
      onInstructionChange: (instruction) => this.state.setInstruction(instruction),
      onCommandUnlocked: (command) => this.state.unlockCommand(command),
      onStatusChange: (status) => this.state.syncStatus(status),
      onChallengeComplete: (challengeId) => this.completeChallenge(challengeId),
    });
  }

  start() {
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
      this.state.setInstruction(
        "That mentor is waiting. Follow the highlighted lesson order so tmux builds cleanly.",
      );
      return;
    }

    const dialogue = dialogueById[activeNpc.dialogueFile];
    this.ui.showDialogue(dialogue, () => this.#startChallenge(activeNpc.challengeId));
  }

  setWorldPrompt(prompt) {
    this.state.setInstruction(prompt);
  }

  handleBeaconInteraction() {
    this.ui.showDialogue(
      [
        {
          speaker: "HELIX",
          text: "Beacon stable. You opened, named, detached, listed, and reattached a session. The CLULIX can now remember work across interruptions.",
        },
        {
          speaker: "HELIX",
          text: "Next implementation target: expand Act 1 so the village and session-management puzzles deepen through repetition and timed drills.",
        },
      ],
      () => {
        this.state.setMission("Lesson complete. Extend the prototype toward the next act.");
        this.state.setInstruction(
          "The current slice ends here. Keep the player's next instruction visible as new commands are added.",
        );
      },
    );
  }

  completeChallenge(challengeId) {
    this.completedChallenges.add(challengeId);
    this.state.setTerminalOpen(false);
    this.terminal.close();

    this.currentNpcIndex += 1;

    if (this.currentNpcIndex >= this.zone.npcs.length) {
      this.state.setMission("Return to the CLULIX beacon to close the training loop.");
      this.state.setInstruction(
        "Walk to the beacon. The game should always close the loop by showing what the command changed.",
      );
      return;
    }

    const nextNpc = this.zone.npcs[this.currentNpcIndex];
    this.state.setMission(`Meet ${nextNpc.name} for the next session lesson.`);
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

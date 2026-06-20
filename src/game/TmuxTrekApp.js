import Phaser from "phaser";
import act01Sessions from "../data/acts/act-01-sessions.json";
import sessionCurriculum from "../data/commands/session-curriculum.json";
import phase01Challenges from "../data/commands/phase-01-vertical-slice-challenges.json";
import armoryArmorerDialogue from "../data/dialogue/armory-armorer.json";
import armoryDetachDialogue from "../data/dialogue/armory-detach.json";
import bridgeManifestDialogue from "../data/dialogue/bridge-manifest-terminal.json";
import bridgeRiftDialogue from "../data/dialogue/bridge-rift-terminal.json";
import surfaceZrixArmoryDialogue from "../data/dialogue/surface-zrix-armory.json";
import surfaceZrixArrivalDialogue from "../data/dialogue/surface-zrix-arrival.json";
import bridgeZone from "../data/zones/zone-bridge.json";
import armoryZone from "../data/zones/zone-armory.json";
import surfaceZone from "../data/zones/zone-village.json";
import { TmuxEmulator } from "../terminal/TmuxEmulator.js";
import { ArmoryScene } from "./scenes/ArmoryScene.js";
import { BootScene } from "./scenes/BootScene.js";
import { BridgeScene } from "./scenes/BridgeScene.js";
import { SurfaceScene } from "./scenes/SurfaceScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { GameState } from "./systems/GameState.js";
import { INVENTORY_ITEMS, InventorySystem } from "./systems/InventorySystem.js";
import { MissionSystem } from "./systems/MissionSystem.js";
import {
  hasSave,
  loadGame,
  migrate,
  newSlot,
  saveGame,
} from "./systems/SaveManager.js";
import { TransitionSystem } from "./systems/TransitionSystem.js";
import { UIController } from "./systems/UIController.js";

const SESSION_ROUTES = {
  0: { sceneKey: "surface", zoneId: "surface" },
  armory: { sceneKey: "armory", zoneId: "armory" },
};

const DIALOGUE_BY_ID = {
  "bridge-rift-terminal": bridgeRiftDialogue,
  "bridge-manifest-terminal": bridgeManifestDialogue,
  "surface-zrix-arrival": surfaceZrixArrivalDialogue,
  "surface-zrix-armory": surfaceZrixArmoryDialogue,
  "armory-armorer": armoryArmorerDialogue,
  "armory-detach": armoryDetachDialogue,
};

const ZONES = {
  bridge: bridgeZone,
  surface: surfaceZone,
  armory: armoryZone,
};

function isTestMode() {
  return new URLSearchParams(window.location.search).get("testMode") === "1";
}

export class TmuxTrekApp {
  constructor() {
    this.zones = ZONES;
    this.challenges = phase01Challenges;
    this.currentZoneId = "bridge";
    this.missionSystem = new MissionSystem([act01Sessions]);
    this.inventory = new InventorySystem();

    this.state = new GameState({
      zoneName: this.zones.bridge.name,
      commands: sessionCurriculum,
      openingObjective: "Open the Rift terminal and descend to the surface.",
      openingInstruction:
        "Walk to the bridge terminal. HELIX will route the first descent through tmux.",
    });

    this.ui = new UIController({
      state: this.state,
      terminalRoot: document.querySelector("#terminal-root"),
      dialogueRoot: document.querySelector("#dialogue-root"),
      toastRoot: document.querySelector("#toast-root"),
    });

    this.terminal = new TmuxEmulator({
      container: document.querySelector("#terminal-root"),
      inventory: this.inventory,
      onInstructionChange: (instruction) =>
        this.state.setInstruction(instruction),
      onCommandUnlocked: (command) => this.state.unlockCommand(command),
      onStatusChange: (status) => this.state.syncStatus(status),
      onChallengeComplete: (challengeId) => this.completeChallenge(challengeId),
    });

    this.transitionSystem = new TransitionSystem({
      events: this.terminal.engine.events,
      onTransition: (route) => this.navigateTo(route),
    });
    for (const [sessionName, route] of Object.entries(SESSION_ROUTES)) {
      this.transitionSystem.registerRoute(sessionName, route);
    }
    this.engineMissionUnsubscribers = [
      this.terminal.engine.on("session:created", (payload) =>
        this.missionSystem.handleEvent("session:created", payload),
      ),
      this.terminal.engine.on("session:attached", (payload) =>
        this.missionSystem.handleEvent("session:attached", payload),
      ),
      this.terminal.engine.on("session:detached", (payload) =>
        this.missionSystem.handleEvent("session:detached", payload),
      ),
      this.terminal.engine.on("session:listed", (payload) =>
        this.missionSystem.handleEvent("session:listed", payload),
      ),
    ];

    this.missionSystem.subscribe(() => this.#applyObjectiveState());

    migrate();
    this.missionSystem.loadAct("act-01-sessions");
    this.state.syncStatus(this.terminal.engine.getStatus());
  }

  start() {
    const gameRoot = document.querySelector("#game-root");
    gameRoot.tabIndex = 0;
    window.__tmuxTrekApp = this;

    // In test mode, restore/reset state before Phaser boots so that
    // currentZoneId is stable when BootScene reads it, and skip TitleScene
    // entirely to avoid Phaser scene-lifecycle timing races.
    let scenes;
    if (isTestMode()) {
      if (hasSave()) {
        this.restoreActiveSave();
      } else {
        newSlot("test");
        this.resetToNewGame();
      }
      scenes = [BootScene, BridgeScene, SurfaceScene, ArmoryScene];
    } else {
      scenes = [TitleScene, BootScene, BridgeScene, SurfaceScene, ArmoryScene];
    }

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 960,
      height: 720,
      parent: "game-root",
      scene: scenes,
      render: {
        pixelArt: true,
      },
    });

    this.game.registry.set("app", this);
    window.addEventListener("beforeunload", this.#persistSnapshot);
  }

  resetToNewGame() {
    this.terminal.engine.reset();
    this.missionSystem.restore({});
    this.inventory.restore({ items: [] });
    this.state.restoreUnlockedCommands([]);
    this.currentZoneId = "bridge";
    this.missionSystem.loadAct("act-01-sessions");
    this.state.syncStatus(this.terminal.engine.getStatus());
  }

  restoreActiveSave() {
    this.#restoreSnapshot(loadGame());
    this.state.syncStatus(this.terminal.engine.getStatus());
  }

  saveProgress() {
    this.#saveProgress();
  }

  focusGame() {
    window.requestAnimationFrame(() => {
      document.querySelector("#game-root")?.focus();
      this.game?.canvas?.focus?.();
    });
  }

  getZone(zoneId = this.currentZoneId) {
    return this.zones[zoneId];
  }

  getCurrentObjective() {
    return this.missionSystem.getCurrentObjective();
  }

  getCurrentObjectiveId() {
    return this.getCurrentObjective()?.id ?? null;
  }

  isObjectiveComplete(id) {
    return this.missionSystem.completedObjectives.has(id);
  }

  getChallenge(challengeId) {
    return this.challenges.find((challenge) => challenge.id === challengeId);
  }

  isOverlayOpen() {
    const snapshot = this.state.getState();
    return snapshot.dialogueOpen || snapshot.terminalOpen;
  }

  hasItem(item) {
    return this.inventory.has(item);
  }

  navigateTo({ sceneKey, zoneId }) {
    this.currentZoneId = zoneId;
    this.state.setZoneName(this.zones[zoneId].name);

    if (!this.game) {
      return;
    }

    const activeScene = this.game.scene.getScenes(true)[0];
    if (activeScene?.scene.key !== sceneKey) {
      if (activeScene) {
        activeScene.scene.start(sceneKey);
      } else {
        this.game.scene.start(sceneKey);
      }
    }
  }

  handleBridgeTerminalInteraction() {
    const objective = this.getCurrentObjective();

    if (!objective) {
      this.state.setInstruction(
        "The bridge terminal is quiet. Starfall Village is already stable.",
      );
      return false;
    }

    if (objective.id === "activate-rift-terminal") {
      this.#showDialogue("bridge-rift-terminal", () =>
        this.#startChallenge("bridge-open-rift"),
      );
      return true;
    }

    if (
      objective.id === "inspect-manifest" ||
      objective.id === "reattach-surface"
    ) {
      this.#showDialogue("bridge-manifest-terminal", () =>
        this.#startChallenge("bridge-manifest-return"),
      );
      return true;
    }

    this.state.setInstruction(
      "HELIX: the terminal is not your next task. Stay on mission.",
    );
    return false;
  }

  handleSurfaceZrixInteraction() {
    const objectiveId = this.getCurrentObjectiveId();

    if (objectiveId === "collect-rift-code") {
      this.#showDialogue("surface-zrix-arrival", () => this.focusGame());
      return true;
    }

    if (objectiveId === "open-armory") {
      this.#showDialogue("surface-zrix-armory", () =>
        this.#startChallenge("village-open-armory"),
      );
      return true;
    }

    this.state.setInstruction(
      "Zrix is already waiting on the next consequence of your command.",
    );
    return false;
  }

  handleArmoryInteraction() {
    const objectiveId = this.getCurrentObjectiveId();

    if (objectiveId === "retrieve-weapon") {
      this.#showDialogue("armory-armorer", () => this.focusGame());
      return true;
    }

    if (objectiveId === "return-to-bridge") {
      this.#showDialogue("armory-detach", () =>
        this.#startChallenge("armory-detach"),
      );
      return true;
    }

    this.state.setInstruction(
      "Armorer Kesh has nothing new to add until the weapon changes hands.",
    );
    return false;
  }

  handleOverflowInteraction() {
    if (this.getCurrentObjectiveId() !== "clear-overflow") {
      this.state.setInstruction("The overflow front is not ready for you yet.");
      return false;
    }

    if (!this.hasItem(INVENTORY_ITEMS.ARMORY_WEAPON)) {
      this.state.setInstruction(
        "HELIX: the overflow front will ignore small arms. Bring back the bracket cannon.",
      );
      return false;
    }

    this.missionSystem.handleEvent("world:overflow-cleared");
    this.state.setInstruction(
      "The overflow buffer collapses. Starfall Village is stable again.",
    );
    this.#saveProgress();
    this.currentZoneId = "surface";
    const activeScene = this.game?.scene.getScenes(true)[0];
    activeScene?.scene.start("surface");
    return true;
  }

  handleZoneItemPickup(zoneId, item) {
    const collected = this.inventory.collect(item.item);

    if (!collected) {
      return;
    }

    this.missionSystem.handleEvent("inventory:collected", { item: item.item });

    if (zoneId === "surface" && item.item === INVENTORY_ITEMS.RIFT_CODE) {
      this.state.unlockCommand("tmux new -s armory");
      this.state.setInstruction(
        "The Rift Code is loaded. Return to Zrix and open the armory session.",
      );
    }

    if (zoneId === "armory" && item.item === INVENTORY_ITEMS.ARMORY_WEAPON) {
      this.state.setInstruction(
        "Bracket cannon secured. Speak with Armorer Kesh, then detach back to the bridge.",
      );
    }

    this.#saveProgress();
  }

  completeChallenge() {
    this.state.setTerminalOpen(false);
    this.terminal.close();
    this.focusGame();
    this.#saveProgress();
  }

  #startChallenge(challengeId) {
    const challenge = this.getChallenge(challengeId);
    this.state.setTerminalOpen(true);
    this.terminal.openChallenge(challenge);
  }

  #showDialogue(dialogueId, onComplete) {
    this.ui.showDialogue(DIALOGUE_BY_ID[dialogueId], onComplete);
  }

  #applyObjectiveState() {
    const objective = this.getCurrentObjective();

    if (!objective) {
      this.state.setMission(
        "Act 1 complete. Starfall Village is stable again.",
      );
      this.state.setInstruction(
        "Sessions now feel like places: open, name, detach, list, and return.",
      );
      return;
    }

    this.currentZoneId = objective.zoneId ?? this.currentZoneId;
    this.state.setZoneName(this.zones[this.currentZoneId].name);
    this.state.setMission(objective.missionText);
    this.state.setInstruction(objective.instructionText);
  }

  #buildSnapshot() {
    return {
      engine: this.terminal.engine.getSnapshot().engine,
      mission: this.missionSystem.getSnapshot(),
      inventory: this.inventory.getSnapshot(),
      unlockedCommands: this.state.getState().unlockedCommands,
      view: {
        currentZoneId: this.currentZoneId,
      },
    };
  }

  #restoreSnapshot(saved) {
    if (!saved) {
      return;
    }

    this.terminal.engine.restore({ engine: saved.engine });
    this.missionSystem.restore(saved.mission);
    this.inventory.restore(saved.inventory);
    this.state.restoreUnlockedCommands(saved.unlockedCommands ?? []);
    this.currentZoneId =
      saved.view?.currentZoneId ?? this.#deriveZoneFromEngineState();
    this.#applyObjectiveState();
  }

  #deriveZoneFromEngineState() {
    const activeSession = this.terminal.engine.getStatus().activeSessionName;
    return SESSION_ROUTES[activeSession]?.zoneId ?? "bridge";
  }

  #saveProgress() {
    saveGame(this.#buildSnapshot());
  }

  #persistSnapshot = () => {
    if (isTestMode()) {
      return;
    }

    this.#saveProgress();
  };
}

import Phaser from "phaser";
import act01Sessions from "../data/acts/act-01-sessions.json";
import sessionCurriculum from "../data/commands/session-curriculum.json";
import phase01Challenges from "../data/commands/phase-01-vertical-slice-challenges.json";
import act01Review from "../data/reviews/act-01-sessions.json";
import armoryArmorerDialogue from "../data/dialogue/armory-armorer.json";
import armoryDetachDialogue from "../data/dialogue/armory-detach.json";
import bridgeManifestDialogue from "../data/dialogue/bridge-manifest-terminal.json";
import bridgeRiftDialogue from "../data/dialogue/bridge-rift-terminal.json";
import surfaceZrixArmoryDialogue from "../data/dialogue/surface-zrix-armory.json";
import surfaceZrixArrivalDialogue from "../data/dialogue/surface-zrix-arrival.json";
import { TmuxEmulator } from "../terminal/TmuxEmulator.js";
import { getZones, shouldUseV2Zones } from "./data/zoneLoader.js";
import { ArmoryScene } from "./scenes/ArmoryScene.js";
import { BootScene } from "./scenes/BootScene.js";
import { BridgeScene } from "./scenes/BridgeScene.js";
import { SurfaceScene } from "./scenes/SurfaceScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { GameState } from "./systems/GameState.js";
import { INVENTORY_ITEMS, InventorySystem } from "./systems/InventorySystem.js";
import { detectInputCapability } from "./systems/InputCapability.js";
import { MissionSystem } from "./systems/MissionSystem.js";
import { ProgressSystem } from "./systems/ProgressSystem.js";
import { ReviewSystem } from "./systems/ReviewSystem.js";
import {
  hasSave,
  loadGame,
  migrate,
  newSlot,
  saveGame,
} from "./systems/SaveManager.js";
import { ScoreSystem } from "./systems/ScoreSystem.js";
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

function isTestMode() {
  return new URLSearchParams(window.location.search).get("testMode") === "1";
}

export class TmuxTrekApp {
  constructor() {
    this.useV2Zones = shouldUseV2Zones();
    this.zones = getZones({ useV2Zones: this.useV2Zones });
    this.challenges = phase01Challenges;
    this.currentZoneId = "bridge";
    this.missionSystem = new MissionSystem([act01Sessions]);
    this.inventory = new InventorySystem();
    this.scoreSystem = new ScoreSystem();
    this.progressSystem = new ProgressSystem([act01Sessions]);
    this.reviewSystem = new ReviewSystem([act01Review]);
    this.inputCapability = detectInputCapability();
    this.lastMissionSnapshot = null;

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
      reviewRoot: document.querySelector("#review-root"),
      completionRoot: document.querySelector("#completion-root"),
      toastRoot: document.querySelector("#toast-root"),
      onOpenReview: () => this.openFlashCards(),
      onReviewPrevious: () => this.state.previousReviewCard(),
      onReviewNext: () => this.state.nextReviewCard(),
      onReviewFlip: () => this.state.flipReviewCard(),
      onReviewClose: () => {
        this.state.hideReviewOverlay();
        this.focusGame();
      },
      onReviewRate: (cardId, rating) => this.rateFlashCard(cardId, rating),
      onReviewSelectChoice: (questionId, choiceId) =>
        this.selectReviewChoice(questionId, choiceId),
      onReviewSubmitGate: () => this.submitReviewGate(),
      onReviewRetryGate: () => this.retryReviewGate(),
      onCompletionAcknowledge: () => this.handleCompletionAcknowledge(),
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

    this.missionSystem.subscribe((snapshot) =>
      this.#handleMissionUpdate(snapshot),
    );

    migrate();
    this.missionSystem.loadAct("act-01-sessions");
    this.progressSystem.ensureActStarted("act-01-sessions");
    this.#syncProgressState();
    this.state.setScore(this.scoreSystem.getSnapshot());
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
      parent: "game-root",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 720,
      },
      scene: scenes,
      render: {
        pixelArt: true,
      },
    });

    this.game.registry.set("app", this);
    this.game.events.once("destroy", () => this.dispose());
    window.removeEventListener("beforeunload", this.#persistSnapshot);
    window.addEventListener("beforeunload", this.#persistSnapshot);
    window.addEventListener("keydown", this.#handleKeyboardInput);
    window.addEventListener("resize", this.#refreshScale);
    // Late web-font loads and sidebar reflows move the canvas without
    // firing a window resize, leaving the input manager translating taps
    // through stale canvas bounds until the scale is refreshed.
    document.fonts?.ready?.then(this.#refreshScale);
    this.#layoutObserver = new ResizeObserver(this.#refreshScale);
    this.#layoutObserver.observe(document.body);
  }

  dispose() {
    for (const unsub of this.engineMissionUnsubscribers) unsub();
    this.engineMissionUnsubscribers = [];
    this.transitionSystem.dispose();
    window.removeEventListener("beforeunload", this.#persistSnapshot);
    window.removeEventListener("keydown", this.#handleKeyboardInput);
    window.removeEventListener("resize", this.#refreshScale);
    this.#layoutObserver?.disconnect();
    this.#layoutObserver = null;
  }

  resetToNewGame() {
    this.terminal.engine.reset();
    this.scoreSystem.restore();
    this.progressSystem.restore();
    this.reviewSystem.restore();
    this.lastMissionSnapshot = null;
    this.missionSystem.restore({});
    this.inventory.restore({ items: [] });
    this.state.restoreUnlockedCommands([]);
    this.currentZoneId = "bridge";
    this.missionSystem.loadAct("act-01-sessions");
    this.progressSystem.ensureActStarted("act-01-sessions");
    this.state.setScore(this.scoreSystem.getSnapshot());
    this.#syncProgressState();
    this.state.hideReviewOverlay();
    this.state.hideCompletionOverlay();
    this.state.syncStatus(this.terminal.engine.getStatus());
  }

  restoreActiveSave() {
    this.#restoreSnapshot(loadGame());
    this.state.syncStatus(this.terminal.engine.getStatus());
  }

  saveProgress() {
    this.#saveProgress();
  }

  getInputCapabilitySnapshot() {
    return this.inputCapability.getSnapshot();
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
    return Boolean(
      snapshot.dialogueOpen ||
      snapshot.terminalOpen ||
      snapshot.reviewOverlay ||
      snapshot.completionOverlay,
    );
  }

  hasItem(item) {
    return this.inventory.has(item);
  }

  openFlashCards() {
    const cards = this.#buildFlashCards();

    if (cards.length === 0) {
      this.state.setToast("No commands unlocked for review yet.");
      return false;
    }

    this.state.showReviewOverlay({
      mode: "flashcards",
      title: "TMUX Codex Review",
      cards,
      currentIndex: 0,
      showAnswer: false,
    });
    return true;
  }

  rateFlashCard(cardId, rating) {
    const stats = this.reviewSystem.rateFlashCard(cardId, rating);
    const overlay = this.#getReviewOverlay();
    if (!stats || !overlay) {
      return;
    }

    const cards = overlay.cards.map((card) =>
      card.id === cardId ? { ...card, stats } : card,
    );
    const currentIndex = Math.min(overlay.currentIndex + 1, cards.length - 1);
    this.state.updateReviewOverlay({
      cards,
      currentIndex,
      showAnswer: false,
    });
    this.#saveProgress();
  }

  openReviewGate(actId, options = {}) {
    const bank = this.reviewSystem.getQuestionBank(actId);
    if (!bank) {
      this.state.setToast("No readiness check is configured for this act yet.");
      return false;
    }

    this.state.showReviewOverlay({
      mode: "gate",
      actId,
      title: bank.title,
      questions: bank.questions,
      passPercent: bank.passPercent ?? 70,
      answers: {},
      currentIndex: 0,
      result: null,
      fromCompletion: Boolean(options.fromCompletion),
    });
    return true;
  }

  selectReviewChoice(questionId, choiceId) {
    const overlay = this.#getReviewOverlay();
    if (!overlay || overlay.mode !== "gate" || overlay.result) {
      return;
    }

    this.state.updateReviewOverlay({
      answers: {
        ...(overlay.answers ?? {}),
        [questionId]: choiceId,
      },
    });
  }

  submitReviewGate() {
    const overlay = this.#getReviewOverlay();
    if (!overlay || overlay.mode !== "gate" || overlay.result) {
      return;
    }

    const result = this.reviewSystem.gradeGate(
      overlay.actId,
      overlay.answers ?? {},
    );
    const reviewGate = this.missionSystem.getReviewGate();
    const nextActLabel = reviewGate?.nextActLabel ?? "the next act";

    this.state.updateReviewOverlay({
      result: {
        ...result,
        nextStep: result.passed
          ? `${nextActLabel} is cleared once that act exists in this branch.`
          : "Review the unlocked commands, then retry.",
      },
    });
    this.#saveProgress();
  }

  retryReviewGate() {
    const overlay = this.#getReviewOverlay();
    if (!overlay || overlay.mode !== "gate") {
      return;
    }

    this.state.updateReviewOverlay({
      answers: {},
      currentIndex: 0,
      result: null,
    });
  }

  handleCompletionAcknowledge() {
    const actId = this.missionSystem.getSnapshot().currentActId;

    if (actId && this.#hasPendingReviewGate(actId)) {
      this.state.hideCompletionOverlay();
      this.openReviewGate(actId, { fromCompletion: true });
      return;
    }

    this.state.hideCompletionOverlay();
    this.focusGame();
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

  #handleKeyboardInput = (event) => {
    this.inputCapability.recordKeyboardInput(event);
  };

  // Scale.FIT sizes the canvas from the parent at boot but does not track
  // later parent resizes, so rotating a phone or tablet leaves a stale
  // canvas size until the scale manager is refreshed.
  #layoutObserver = null;

  #refreshScale = () => {
    this.game?.scale.refresh();
  };

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
      score: this.scoreSystem.getSnapshot(),
      progress: this.progressSystem.getSnapshot(),
      review: this.reviewSystem.getSnapshot(),
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

    // Pre-populate lastMissionSnapshot with the incoming mission state so that
    // #handleMissionUpdate (fired synchronously by missionSystem.restore below)
    // computes an empty diff. Without this, every restored objective looks "new"
    // and runs unnecessary awardObjective / markObjectiveComplete calls.
    this.lastMissionSnapshot = saved.mission
      ? structuredClone(saved.mission)
      : null;
    this.state.hideCompletionOverlay();
    this.terminal.engine.restore({ engine: saved.engine });
    this.scoreSystem.restore(saved.score);
    this.progressSystem.restore(saved.progress);
    this.reviewSystem.restore(saved.review);
    this.missionSystem.restore(saved.mission);
    this.inventory.restore(saved.inventory);
    this.state.restoreUnlockedCommands(saved.unlockedCommands ?? []);
    this.state.setScore(this.scoreSystem.getSnapshot());
    this.currentZoneId =
      saved.view?.currentZoneId ?? this.#deriveZoneFromEngineState();
    this.#applyObjectiveState();
    this.#syncProgressState();
    this.#reopenPendingBoundaryGate();
  }

  #deriveZoneFromEngineState() {
    const activeSession = this.terminal.engine.getStatus().activeSessionName;
    return SESSION_ROUTES[activeSession]?.zoneId ?? "bridge";
  }

  #saveProgress() {
    saveGame(this.#buildSnapshot());
  }

  #buildFlashCards() {
    const snapshot = this.state.getState();
    return this.reviewSystem.buildFlashCards(
      snapshot.commands,
      snapshot.unlockedCommands,
    );
  }

  #getReviewOverlay() {
    return this.state.getState().reviewOverlay;
  }

  #handleMissionUpdate(snapshot) {
    const previousCompleted = new Set(
      this.lastMissionSnapshot?.completedObjectives ?? [],
    );
    const nextCompleted = new Set(snapshot.completedObjectives ?? []);
    const currentActId = snapshot.currentActId;
    let latestDelta = 0;

    if (currentActId) {
      this.progressSystem.ensureActStarted(currentActId);
    }

    for (const objectiveId of nextCompleted) {
      if (previousCompleted.has(objectiveId)) {
        continue;
      }

      latestDelta += this.scoreSystem.awardObjective({
        actId: currentActId,
        objectiveId,
      });
      this.progressSystem.markObjectiveComplete({
        actId: currentActId,
        objectiveId,
      });
    }

    const currentProgress = this.missionSystem.getProgress();
    if (currentProgress?.isActComplete && !this.lastMissionSnapshot) {
      this.progressSystem.completeAct({ actId: currentActId });
    } else if (
      currentProgress?.isActComplete &&
      this.lastMissionSnapshot?.currentObjectiveId !== null
    ) {
      latestDelta += this.scoreSystem.awardActComplete({ actId: currentActId });
      this.progressSystem.completeAct({ actId: currentActId });
      this.#showLevelComplete(currentActId);
    }

    this.lastMissionSnapshot = structuredClone(snapshot);
    this.state.setScore({ ...this.scoreSystem.getSnapshot(), latestDelta });
    this.#syncProgressState();
    this.#applyObjectiveState();
  }

  #syncProgressState() {
    const missionProgress = this.missionSystem.getProgress();
    const overall = this.progressSystem.getOverallSummary(
      missionProgress?.currentActId ??
        this.missionSystem.getSnapshot().currentActId,
    );
    const currentAct = overall.currentAct;

    this.state.setProgress({
      completedActs: overall.completedActs,
      totalActs: overall.totalActs,
      currentActTitle: currentAct?.title ?? "",
      completedObjectives: currentAct?.completedObjectives ?? 0,
      totalObjectives: currentAct?.totalObjectives ?? 0,
    });
  }

  #showLevelComplete(actId) {
    const actSummary = this.progressSystem.getActSummary(actId);
    const reviewGate = this.missionSystem.getReviewGate();
    const hasPendingGate = this.#hasPendingReviewGate(actId);
    this.state.showCompletionOverlay({
      title: `${actSummary.title} complete`,
      score: this.scoreSystem.getSnapshot().byAct[actId] ?? 0,
      elapsedLabel: this.#formatElapsed(actSummary.elapsedMs),
      nextStep: hasPendingGate
        ? `HELIX requires the ${reviewGate?.title ?? "readiness check"} before ${reviewGate?.nextActLabel ?? "the next act"}.`
        : `${reviewGate?.nextActLabel ?? "The next act"} is cleared once that content exists in this branch.`,
      buttonLabel: hasPendingGate ? "Start Readiness Check" : "Acknowledge",
    });
  }

  #formatElapsed(elapsedMs) {
    const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  #hasPendingReviewGate(actId) {
    const gate = this.missionSystem.getReviewGate();
    if (!gate?.questionBankId || gate.questionBankId !== actId) {
      return false;
    }

    return !this.reviewSystem.hasPassedGate(actId);
  }

  #reopenPendingBoundaryGate() {
    const progress = this.missionSystem.getProgress();
    if (!progress?.isActComplete) {
      return;
    }

    const actId = progress.currentActId;
    if (!this.#hasPendingReviewGate(actId)) {
      return;
    }

    this.#showLevelComplete(actId);
  }

  #persistSnapshot = () => {
    if (isTestMode()) {
      return;
    }

    this.#saveProgress();
  };
}

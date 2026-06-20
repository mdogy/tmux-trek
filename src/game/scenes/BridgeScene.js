import { GridScene } from "./GridScene.js";

export class BridgeScene extends GridScene {
  constructor() {
    super("bridge", "bridge");
  }

  getBackgroundColor() {
    return "#07131f";
  }

  getGroundFrame(column, row) {
    return [12, 13, 15][(column + row) % 3];
  }

  createZoneDecorations() {
    this.add.text(378, 82, "CLULIX BRIDGE", {
      color: "#ffb300",
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
    });
  }

  getIdlePrompt() {
    const objectiveId = this.app.getCurrentObjectiveId();

    if (
      objectiveId === "activate-rift-terminal" ||
      objectiveId === "inspect-manifest" ||
      objectiveId === "reattach-surface"
    ) {
      return "Move to the Rift Terminal. The bridge has no other exit.";
    }

    return "The bridge is quiet while HELIX recalibrates the Rift systems.";
  }

  getTargetPrompt(target) {
    if (target.id !== "rift-terminal") {
      return this.getIdlePrompt();
    }

    const objectiveId = this.app.getCurrentObjectiveId();
    if (objectiveId === "activate-rift-terminal") {
      return "Press E to bring the surface Rift online.";
    }

    if (
      objectiveId === "inspect-manifest" ||
      objectiveId === "reattach-surface"
    ) {
      return "Press E to inspect the Rift Manifest and return to session 0.";
    }

    return "The terminal is idling.";
  }

  handleTargetInteraction(target) {
    if (target.id !== "rift-terminal") {
      return false;
    }

    return this.app.handleBridgeTerminalInteraction();
  }
}

import { GridScene } from "./GridScene.js";
import { shouldUseV2Zones } from "../data/zoneLoader.js";

export class ArmoryScene extends GridScene {
  constructor() {
    super("armory", "armory");
  }

  preload() {
    super.preload();

    if (shouldUseV2Zones()) {
      this.load.image(
        "armory-art-background",
        "assets/generated/tiles/armory-scene-background.png",
      );
    }
  }

  shouldDrawV2TileMap() {
    return false;
  }

  shouldDrawV2WorldObjects() {
    return false;
  }

  getTileVisualWidth() {
    return 60;
  }

  getTileVisualHeight() {
    return 60;
  }

  getGroundFrame(column, row) {
    return [12, 13, 15][(column * 2 + row) % 3];
  }

  createZoneDecorations() {
    if (this.zone.renderMode === "v2") {
      this.zoneArtId = "armory-background";
      this.add
        .image(480, 360, "armory-art-background")
        .setDisplaySize(960, 720)
        .setDepth(-10);
    }

    this.add.text(388, 82, "KESH ARMORY", {
      color: "#ffb300",
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
    });
  }

  getIdlePrompt() {
    const objectiveId = this.app.getCurrentObjectiveId();

    if (objectiveId === "retrieve-weapon") {
      return "Step onto the weapon stand and claim the bracket cannon.";
    }

    if (objectiveId === "return-to-bridge") {
      return "Speak with Armorer Kesh, then detach back to the bridge.";
    }

    return "The armory hums behind a stable named Rift.";
  }

  getTargetPrompt(target) {
    if (target.id !== "armorer") {
      return this.getIdlePrompt();
    }

    if (this.app.getCurrentObjectiveId() === "return-to-bridge") {
      return "Press E to confirm the detach route with Armorer Kesh.";
    }

    return "Armorer Kesh is waiting beside the weapon racks.";
  }

  handleTargetInteraction(target) {
    if (target.id !== "armorer") {
      return false;
    }

    return this.app.handleArmoryInteraction();
  }
}

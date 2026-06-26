import { GridScene } from "./GridScene.js";
import { shouldUseV2Zones } from "../data/zoneLoader.js";

export class SurfaceScene extends GridScene {
  constructor() {
    super("surface", "surface");
  }

  preload() {
    super.preload();

    if (shouldUseV2Zones()) {
      this.load.image(
        "surface-art-background",
        "assets/generated/tiles/village-scene-background.png",
      );
    }
  }

  shouldDrawV2TileMap() {
    return false;
  }

  shouldDrawV2WorldObjects() {
    return false;
  }

  createZoneDecorations() {
    if (this.zone.renderMode === "v2") {
      this.zoneArtId = "surface-background";
      this.add
        .image(960, 720, "surface-art-background")
        .setDisplaySize(1920, 1440)
        .setDepth(-10);
    }

    this.add
      .text(264, 116, "STARFALL VILLAGE", {
        color: "#f2e8be",
        fontFamily: '"Press Start 2P"',
        fontSize: "16px",
      })
      .setScrollFactor(0.4);
  }

  getIdlePrompt() {
    const objectiveId = this.app.getCurrentObjectiveId();

    if (objectiveId === "collect-rift-code") {
      return "Talk to Zrix, then follow the eastern path until you find the Rift Code.";
    }

    if (objectiveId === "open-armory") {
      return "Return to Zrix. The armory can be opened now that the glyph is loaded.";
    }

    if (objectiveId === "clear-overflow") {
      return "Carry the bracket cannon to the overflow front on the eastern path.";
    }

    if (!objectiveId) {
      return "The overflow front is gone. Starfall Village is stable again.";
    }

    return "The village waits on the next command.";
  }

  getTargetPrompt(target) {
    const objectiveId = this.app.getCurrentObjectiveId();

    if (target.id === "zrix") {
      if (objectiveId === "collect-rift-code") {
        return "Press E to hear Zrix explain why the glyph matters.";
      }

      if (objectiveId === "open-armory") {
        return "Press E to let Zrix route the armory Rift.";
      }

      return "Zrix is watching the village perimeter.";
    }

    if (target.id === "overflow") {
      if (objectiveId === "clear-overflow") {
        return "Press E to fire the bracket cannon into the overflow front.";
      }

      return "The overflow buffer is still eating the path.";
    }

    return this.getIdlePrompt();
  }

  handleTargetInteraction(target) {
    if (target.id === "zrix") {
      return this.app.handleSurfaceZrixInteraction();
    }

    if (target.id === "overflow") {
      return this.app.handleOverflowInteraction();
    }

    return false;
  }
}

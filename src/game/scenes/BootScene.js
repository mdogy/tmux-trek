import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    const app = this.registry.get("app") ?? window.__tmuxTrekApp;
    const nextScene =
      app.currentZoneId === "surface" ? "surface" : app.currentZoneId;
    this.cameras.main.setBackgroundColor("#07131f");
    this.add
      .text(480, 360, "TMUX TREK\nBooting CLULIX training sim...", {
        align: "center",
        color: "#f2e8be",
        fontFamily: '"Press Start 2P"',
        fontSize: "20px",
      })
      .setOrigin(0.5);

    if (window.__TMUX_TREK_DISABLE_AUTOSAVE) {
      this.scene.start(nextScene);
      return;
    }

    this.time.delayedCall(600, () => {
      this.scene.start(nextScene);
    });
  }
}

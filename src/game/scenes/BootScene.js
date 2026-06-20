import Phaser from "phaser";

function isTestMode() {
  return new URLSearchParams(window.location.search).get("testMode") === "1";
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
    this._nextScene = null;
  }

  init(data) {
    this._nextScene = data?.nextScene ?? null;
  }

  create() {
    const app = this.registry.get("app") ?? window.__tmuxTrekApp;
    const nextScene =
      this._nextScene ??
      (app.currentZoneId === "surface" ? "surface" : app.currentZoneId);
    this.cameras.main.setBackgroundColor("#07131f");
    this.add
      .text(480, 360, "TMUX TREK\nBooting CLULIX training sim...", {
        align: "center",
        color: "#f2e8be",
        fontFamily: '"Press Start 2P"',
        fontSize: "20px",
      })
      .setOrigin(0.5);

    if (isTestMode()) {
      this.scene.start(nextScene);
      return;
    }

    this.time.delayedCall(600, () => {
      this.scene.start(nextScene);
    });
  }
}

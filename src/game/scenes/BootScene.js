import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    this.cameras.main.setBackgroundColor("#07131f");
    this.add
      .text(480, 360, "TMUX TREK\nBooting CLULIX training sim...", {
        align: "center",
        color: "#f2e8be",
        fontFamily: '"Press Start 2P"',
        fontSize: "20px",
      })
      .setOrigin(0.5);

    window.setTimeout(() => {
      this.scene.start("world");
    }, 600);
  }
}

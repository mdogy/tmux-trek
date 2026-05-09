import Phaser from "phaser";

export class WorldScene extends Phaser.Scene {
  constructor() {
    super("world");
    this.interactionText = null;
  }

  create() {
    this.app = this.registry.get("app");
    const zone = this.app.getZone();
    this.cameras.main.setBackgroundColor("#0a1628");

    this.add.rectangle(480, 360, 960, 720, 0x10253d);
    this.add.circle(180, 140, 140, 0x7b2d8b, 0.18);
    this.add.circle(740, 580, 170, 0x46d9c4, 0.1);
    this.add.rectangle(zone.beacon.x, zone.beacon.y, 110, 110, 0xffb300, 0.18);
    this.add.text(zone.beacon.x - 52, zone.beacon.y + 70, "CLULIX", {
      color: "#ffb300",
      fontFamily: '"Press Start 2P"',
      fontSize: "12px",
    });

    this.player = this.add.rectangle(110, 620, 24, 24, 0x46d9c4);
    this.playerLabel = this.add.text(76, 646, "Captain", {
      color: "#f2e8be",
      fontFamily: '"Share Tech Mono"',
      fontSize: "16px",
    });

    this.npcObjects = zone.npcs.map((npc) => {
      const marker = this.add.rectangle(npc.x, npc.y, 28, 28, npc.color);
      const label = this.add.text(npc.x - 48, npc.y + 26, npc.name, {
        color: "#f2e8be",
        fontFamily: '"Share Tech Mono"',
        fontSize: "16px",
      });
      return { npc, marker, label };
    });

    this.interactionText = this.add
      .text(480, 680, "", {
        color: "#ffb300",
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
      })
      .setOrigin(0.5);

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    });
  }

  update(_, delta) {
    const moveScale = delta / 16;

    if (!this.app.isOverlayOpen()) {
      if (this.keys.left.isDown || this.keys.a.isDown) {
        this.player.x -= 2.8 * moveScale;
      }

      if (this.keys.right.isDown || this.keys.d.isDown) {
        this.player.x += 2.8 * moveScale;
      }

      if (this.keys.up.isDown || this.keys.w.isDown) {
        this.player.y -= 2.8 * moveScale;
      }

      if (this.keys.down.isDown || this.keys.s.isDown) {
        this.player.y += 2.8 * moveScale;
      }
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, 20, 940);
    this.player.y = Phaser.Math.Clamp(this.player.y, 20, 700);
    this.playerLabel.setPosition(this.player.x - 34, this.player.y + 22);

    this.#updateNpcStates();
    this.#updateInteractionPrompt();
  }

  #updateNpcStates() {
    this.npcObjects.forEach(({ npc, marker }) => {
      if (this.app.isCompleted(npc.challengeId)) {
        marker.setFillStyle(0x46d9c4);
        return;
      }

      if (this.app.getActiveNpcId() === npc.id) {
        marker.setFillStyle(0xffb300);
        return;
      }

      marker.setFillStyle(0x5f5f6f);
    });
  }

  #updateInteractionPrompt() {
    const nearestNpc = this.#getNearestNpc();
    const nearBeacon =
      this.app.isBeaconActive() &&
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.app.getZone().beacon.x,
        this.app.getZone().beacon.y,
      ) < 76;

    if (nearBeacon) {
      this.interactionText.setText("Press E at the beacon to finish the lesson");

      if (
        Phaser.Input.Keyboard.JustDown(this.keys.interact) &&
        !this.app.isOverlayOpen()
      ) {
        this.app.handleBeaconInteraction();
      }

      return;
    }

    if (!nearestNpc) {
      this.interactionText.setText("Move with WASD or arrows. Meet the highlighted mentor.");
      return;
    }

    const prompt =
      nearestNpc.npc.id === this.app.getActiveNpcId()
        ? `Press E to talk to ${nearestNpc.npc.name}`
        : `Finish the current lesson before speaking with ${nearestNpc.npc.name}`;

    this.interactionText.setText(prompt);

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.interact) &&
      !this.app.isOverlayOpen()
    ) {
      this.app.handleNpcInteraction(nearestNpc.npc.id);
    }
  }

  #getNearestNpc() {
    return (
      this.npcObjects.find(
        ({ npc }) =>
          Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) < 84,
      ) ?? null
    );
  }
}

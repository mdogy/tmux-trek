import Phaser from "phaser";

const PROXIMITY_RADIUS_TILES = 2;
const TERRAIN_SHEET_KEY = "z-shell-terrain";
const TERRAIN_SHEET_PATH = "assets/tiles/z-shell-terrain.png";
const TERRAIN_FRAMES = {
  ground: [0, 1, 2],
  border: [3, 4, 5, 6, 7],
  obstacle: [8, 9, 10, 11],
  beacon: 14,
};

export class WorldScene extends Phaser.Scene {
  constructor() {
    super("world");
    this.interactionText = null;
    this.isMoving = false;
    this.playerGrid = { column: 0, row: 0 };
    this.moveQueue = [];
    this.interactRequested = false;
  }

  preload() {
    this.load.spritesheet(TERRAIN_SHEET_KEY, TERRAIN_SHEET_PATH, {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    this.app = this.registry.get("app");
    this.zone = this.app.getZone();
    this.tileSize = this.zone.map.tileSize;
    this.columns = this.zone.map.columns;
    this.rows = this.zone.map.rows;
    this.playerGrid = { ...this.zone.playerStart };
    this.blockedTiles = new Set(
      (this.zone.obstacles?.tiles ?? []).map(
        ([column, row]) => `${column},${row}`,
      ),
    );

    this.cameras.main.setBackgroundColor("#0a1628");
    this.#drawTileMap();
    this.#drawLandmarks();
    this.#createActors();
    this.#createUi();
    this.#bindKeys();
    this.#syncDebugState();
    this.app.focusGame();
  }

  update() {
    if (!this.app.isOverlayOpen()) {
      this.#handleMovementInput();
    }

    this.#updateNpcStates();
    this.#updateInteractionPrompt();
  }

  #drawTileMap() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const isBorder =
          row === 0 ||
          column === 0 ||
          row === this.rows - 1 ||
          column === this.columns - 1;
        const framePool = isBorder
          ? TERRAIN_FRAMES.border
          : TERRAIN_FRAMES.ground;
        const frame = framePool[(column * 7 + row * 11) % framePool.length];
        const center = this.#tileCenter(column, row);
        this.add.image(center.x, center.y, TERRAIN_SHEET_KEY, frame);
      }
    }
  }

  #drawLandmarks() {
    const crater = this.#tileCenter(4, 2);
    this.add.circle(crater.x, crater.y, this.tileSize * 2.6, 0x2e2b61, 0.88);
    this.add.text(crater.x - 74, crater.y - 8, "CRATER", {
      color: "#b8c7c5",
      fontFamily: '"Share Tech Mono"',
      fontSize: "18px",
    });

    this.#drawTileCluster([
      [4, 6],
      [5, 6],
      [4, 7],
      [5, 7],
    ]);

    this.#drawTileCluster([
      [14, 9],
      [15, 9],
      [14, 10],
      [15, 10],
    ]);

    const beacon = this.#tileCenter(
      this.zone.beacon.column,
      this.zone.beacon.row,
    );
    this.add.circle(beacon.x, beacon.y, 30, 0xffb300, 0.18);
    this.add.image(
      beacon.x,
      beacon.y,
      TERRAIN_SHEET_KEY,
      TERRAIN_FRAMES.beacon,
    );
    this.add.text(beacon.x - 64, beacon.y + 32, "CLULIX BEACON", {
      color: "#ffb300",
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
    });
  }

  #drawTileCluster(tiles) {
    tiles.forEach(([column, row], index) => {
      const center = this.#tileCenter(column, row);
      const frame =
        TERRAIN_FRAMES.obstacle[index % TERRAIN_FRAMES.obstacle.length];
      this.add.image(center.x, center.y, TERRAIN_SHEET_KEY, frame);
    });
  }

  #createActors() {
    const playerCenter = this.#tileCenter(
      this.playerGrid.column,
      this.playerGrid.row,
    );
    this.player = this.add.rectangle(
      playerCenter.x,
      playerCenter.y,
      this.tileSize - 20,
      this.tileSize - 20,
      0x6ec6c0,
    );
    this.playerLabel = this.add.text(
      playerCenter.x - 24,
      playerCenter.y + 28,
      "Captain",
      {
        color: "#f2e8be",
        fontFamily: '"Share Tech Mono"',
        fontSize: "16px",
      },
    );

    this.npcObjects = this.zone.npcs.map((npc) => {
      const center = this.#tileCenter(npc.column, npc.row);
      const marker = this.add.rectangle(
        center.x,
        center.y,
        this.tileSize - 18,
        this.tileSize - 18,
        npc.color,
      );
      const label = this.add.text(center.x - 30, center.y + 28, npc.name, {
        color: "#f2e8be",
        fontFamily: '"Share Tech Mono"',
        fontSize: "16px",
      });
      return { npc, marker, label };
    });
  }

  #createUi() {
    this.interactionText = this.add
      .text(this.zone.map.width / 2, this.zone.map.height - 22, "", {
        color: "#ffb300",
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
      })
      .setOrigin(0.5);
  }

  #bindKeys() {
    this.keys = this.input.keyboard.addKeys({
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    });

    this.input.keyboard.on("keydown", (event) => {
      const code = event.code;

      if (code === "KeyE") {
        this.interactRequested = true;
        return;
      }

      if (this.app.isOverlayOpen()) {
        return;
      }

      const direction = {
        ArrowUp: { column: 0, row: -1 },
        KeyW: { column: 0, row: -1 },
        ArrowDown: { column: 0, row: 1 },
        KeyS: { column: 0, row: 1 },
        ArrowLeft: { column: -1, row: 0 },
        KeyA: { column: -1, row: 0 },
        ArrowRight: { column: 1, row: 0 },
        KeyD: { column: 1, row: 0 },
      }[code];

      if (!direction || event.repeat) {
        return;
      }

      if (this.isMoving || this.moveQueue.length > 0) {
        return;
      }

      this.moveQueue.push(direction);
    });
  }

  #handleMovementInput() {
    if (this.isMoving || this.moveQueue.length === 0) {
      return;
    }

    const nextMove = this.moveQueue.shift();
    this.#attemptMove(nextMove.column, nextMove.row);
  }

  #attemptMove(deltaColumn, deltaRow) {
    const nextColumn = Phaser.Math.Clamp(
      this.playerGrid.column + deltaColumn,
      1,
      this.columns - 2,
    );
    const nextRow = Phaser.Math.Clamp(
      this.playerGrid.row + deltaRow,
      1,
      this.rows - 2,
    );

    if (
      nextColumn === this.playerGrid.column &&
      nextRow === this.playerGrid.row
    ) {
      this.#syncDebugState(undefined, undefined, "blocked");
      return;
    }

    if (this.blockedTiles.has(`${nextColumn},${nextRow}`)) {
      this.#syncDebugState("Movement blocked by terrain.", null, "blocked");
      return;
    }

    this.playerGrid = {
      column: nextColumn,
      row: nextRow,
    };
    this.isMoving = true;

    const center = this.#tileCenter(nextColumn, nextRow);
    this.tweens.add({
      targets: this.player,
      duration: 110,
      ease: "Quad.Out",
      x: center.x,
      y: center.y,
      onComplete: () => {
        this.playerLabel.setPosition(center.x - 24, center.y + 28);
        this.isMoving = false;
        this.#syncDebugState(undefined, undefined, "moved");
      },
    });

    this.tweens.add({
      targets: this.playerLabel,
      duration: 110,
      ease: "Quad.Out",
      x: center.x - 24,
      y: center.y + 28,
      onComplete: () => {},
    });
  }

  #updateNpcStates() {
    this.npcObjects.forEach(({ npc, marker }) => {
      if (this.app.isCompleted(npc.challengeId)) {
        marker.setFillStyle(0x46d9c4);
        return;
      }

      if (this.app.getActiveNpcId() === npc.id) {
        marker.setFillStyle(0xb34ccd);
        return;
      }

      marker.setFillStyle(0x5f5f6f);
    });
  }

  #updateInteractionPrompt() {
    const nearestNpc = this.#getNearestNpc();
    const activeNpc = this.zone.npcs[this.app.getActiveNpcIndex()] ?? null;
    const nearBeacon =
      this.#tileDistance(this.playerGrid, this.zone.beacon) <= 1;
    const beaconReady =
      this.app.isBeaconActive() &&
      this.#tileDistance(this.playerGrid, this.zone.beacon) <= 1;

    let prompt = nearBeacon
      ? "You are at the CLULIX beacon. Move near Zrix to begin the lesson."
      : "Use WASD or arrow keys. Each press moves one tile.";
    let nearbyNpcId = nearestNpc?.npc.id ?? null;

    if (beaconReady) {
      prompt = "Press E at the beacon to finish the lesson";

      if (this.interactRequested && !this.app.isOverlayOpen()) {
        this.app.handleBeaconInteraction();
        this.interactRequested = false;
      }
    } else if (nearestNpc && activeNpc && nearestNpc.npc.id === activeNpc.id) {
      prompt = `Press E to talk to ${nearestNpc.npc.name}`;
      nearbyNpcId = nearestNpc.npc.id;
      this.app.setWorldPrompt(prompt);

      if (this.interactRequested && !this.app.isOverlayOpen()) {
        this.app.handleNpcInteraction(nearestNpc.npc.id);
        this.interactRequested = false;
      }
    } else if (nearestNpc) {
      prompt = `Finish the current lesson before speaking with ${nearestNpc.npc.name}`;
    } else if (activeNpc) {
      prompt = nearBeacon
        ? `You are at the CLULIX beacon. Move near ${activeNpc.name} to begin the lesson.`
        : `Move near ${activeNpc.name}. Proximity should trigger before overlap.`;
    }

    if (this.interactRequested && !nearBeacon && !nearestNpc) {
      this.interactRequested = false;
    }

    this.interactionText.setText(prompt);
    this.#syncDebugState(prompt, nearbyNpcId);
    this.interactRequested = false;
  }

  #getNearestNpc() {
    return (
      this.npcObjects.find(
        ({ npc }) =>
          this.#tileDistance(this.playerGrid, npc) <= PROXIMITY_RADIUS_TILES,
      ) ?? null
    );
  }

  #tileDistance(a, b) {
    return Math.max(Math.abs(a.column - b.column), Math.abs(a.row - b.row));
  }

  #tileCenter(column, row) {
    return {
      x: column * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }

  #syncDebugState(
    prompt = this.interactionText?.text ?? "",
    nearbyNpcId = null,
    lastMoveResult = null,
  ) {
    const host = document.querySelector("#game-root");
    if (!host) {
      return;
    }

    host.dataset.playerGrid = `${this.playerGrid.column},${this.playerGrid.row}`;
    host.dataset.isMoving = this.isMoving ? "true" : "false";
    host.dataset.prompt = prompt;
    host.dataset.nearbyNpc = nearbyNpcId ?? "";
    host.dataset.activeNpc = this.app.getActiveNpcId() ?? "";
    host.dataset.lastMoveResult =
      lastMoveResult ?? host.dataset.lastMoveResult ?? "idle";
  }
}

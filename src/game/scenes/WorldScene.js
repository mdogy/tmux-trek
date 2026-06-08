import Phaser from "phaser";

const TERRAIN_SHEET_KEY = "z-shell-terrain";
const TERRAIN_SHEET_PATH = "assets/tiles/z-shell-terrain.png";
const TERRAIN_FRAMES = {
  ground: [0, 1, 2],
  border: [3, 4, 5, 6, 7],
  obstacle: [8, 9, 10, 11],
  beacon: 14,
};
const SPRITE_KEYS = {
  captain: "captain-sprite",
  zrix: "zrix-sprite",
  vrex: "vrex-sprite",
  orin: "orin-sprite",
};
const CRATER_FLOOR_TILES = [
  [3, 1],
  [4, 1],
  [5, 1],
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 2],
  [6, 2],
  [3, 3],
  [4, 3],
  [5, 3],
];
const CRATER_EDGE_TILES = [
  [2, 1],
  [6, 1],
  [2, 3],
  [6, 3],
  [3, 0],
  [4, 0],
  [5, 0],
  [3, 4],
  [4, 4],
  [5, 4],
];

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
    this.occupiedTiles = new Map();

    this.cameras.main.setBackgroundColor("#0a1628");
    this.#createSpriteTextures();
    this.#registerOccupiedTiles();
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
    this.#drawCrater();

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
    this.beaconGlow = this.add.circle(beacon.x, beacon.y, 30, 0xffb300, 0.18);
    this.beaconSprite = this.add.image(
      beacon.x,
      beacon.y,
      TERRAIN_SHEET_KEY,
      TERRAIN_FRAMES.beacon,
    );
    this.beaconHighlight = this.#createHighlight(beacon.x, beacon.y);
    this.add.text(beacon.x - 64, beacon.y + 32, "CLULIX BEACON", {
      color: "#ffb300",
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
    });
  }

  #drawCrater() {
    CRATER_FLOOR_TILES.forEach(([column, row], index) => {
      const center = this.#tileCenter(column, row);
      this.add
        .image(
          center.x,
          center.y,
          TERRAIN_SHEET_KEY,
          TERRAIN_FRAMES.ground[index % 3],
        )
        .setTint(0x312b64)
        .setAlpha(0.92);
    });

    CRATER_EDGE_TILES.forEach(([column, row], index) => {
      const center = this.#tileCenter(column, row);
      this.add
        .image(
          center.x,
          center.y,
          TERRAIN_SHEET_KEY,
          TERRAIN_FRAMES.obstacle[index % 4],
        )
        .setTint(0x5d4fa0)
        .setAlpha(0.96);
    });

    const label = this.#tileCenter(4, 2);
    this.add.text(label.x - 42, label.y - 8, "CRATER", {
      color: "#b8c7c5",
      fontFamily: '"Share Tech Mono"',
      fontSize: "18px",
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
    this.player = this.add.image(
      playerCenter.x,
      playerCenter.y,
      SPRITE_KEYS.captain,
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
      const highlight = this.#createHighlight(center.x, center.y);
      const marker = this.add.image(center.x, center.y, SPRITE_KEYS[npc.id]);
      const label = this.add.text(center.x - 30, center.y + 28, npc.name, {
        color: "#f2e8be",
        fontFamily: '"Share Tech Mono"',
        fontSize: "16px",
      });
      return { npc, marker, label, highlight };
    });
  }

  #createSpriteTextures() {
    if (!this.textures.exists(SPRITE_KEYS.captain)) {
      this.#drawHumanoidSprite(SPRITE_KEYS.captain, {
        suit: 0x46d9c4,
        trim: 0xffb300,
        visor: 0x0a1628,
      });
    }

    if (!this.textures.exists(SPRITE_KEYS.zrix)) {
      this.#drawAlienSprite(SPRITE_KEYS.zrix, {
        body: 0x7b2d8b,
        accent: 0x46d9c4,
        eye: 0xffb300,
      });
    }

    if (!this.textures.exists(SPRITE_KEYS.vrex)) {
      this.#drawAlienSprite(SPRITE_KEYS.vrex, {
        body: 0xffb300,
        accent: 0x7b2d8b,
        eye: 0x07131f,
      });
    }

    if (!this.textures.exists(SPRITE_KEYS.orin)) {
      this.#drawArchivistSprite(SPRITE_KEYS.orin);
    }
  }

  #drawHumanoidSprite(key, { suit, trim, visor }) {
    const graphics = this.add.graphics();
    graphics.fillStyle(trim);
    graphics.fillRoundedRect(13, 4, 22, 18, 8);
    graphics.fillStyle(visor);
    graphics.fillRoundedRect(17, 8, 14, 8, 4);
    graphics.fillStyle(suit);
    graphics.fillRoundedRect(14, 22, 20, 17, 5);
    graphics.fillStyle(trim);
    graphics.fillRect(12, 25, 5, 10);
    graphics.fillRect(31, 25, 5, 10);
    graphics.fillRect(17, 38, 5, 6);
    graphics.fillRect(26, 38, 5, 6);
    graphics.generateTexture(key, 48, 48);
    graphics.destroy();
  }

  #drawAlienSprite(key, { body, accent, eye }) {
    const graphics = this.add.graphics();
    graphics.fillStyle(body);
    graphics.fillEllipse(24, 23, 26, 30);
    graphics.fillEllipse(14, 30, 10, 10);
    graphics.fillEllipse(34, 30, 10, 10);
    graphics.fillStyle(accent);
    graphics.fillEllipse(24, 18, 13, 8);
    graphics.fillRect(21, 6, 3, 12);
    graphics.fillRect(26, 6, 3, 12);
    graphics.fillStyle(eye);
    graphics.fillCircle(19, 22, 3);
    graphics.fillCircle(29, 22, 3);
    graphics.generateTexture(key, 48, 48);
    graphics.destroy();
  }

  #drawArchivistSprite(key) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2d5383);
    graphics.fillRoundedRect(13, 11, 22, 27, 4);
    graphics.fillStyle(0x46d9c4);
    graphics.fillTriangle(24, 4, 13, 17, 35, 17);
    graphics.fillStyle(0xffb300);
    graphics.fillRect(17, 22, 14, 3);
    graphics.fillRect(17, 29, 14, 3);
    graphics.fillStyle(0xf2e8be);
    graphics.fillCircle(20, 17, 2);
    graphics.fillCircle(28, 17, 2);
    graphics.generateTexture(key, 48, 48);
    graphics.destroy();
  }

  #createHighlight(x, y) {
    return this.add
      .rectangle(x, y, this.tileSize - 4, this.tileSize - 4)
      .setStrokeStyle(4, 0xfff17a, 1)
      .setFillStyle(0xffb300, 0.08)
      .setVisible(false);
  }

  #registerOccupiedTiles() {
    this.zone.npcs.forEach((npc) => {
      this.occupiedTiles.set(`${npc.column},${npc.row}`, {
        kind: "npc",
        id: npc.id,
        name: npc.name,
      });
    });

    this.occupiedTiles.set(
      `${this.zone.beacon.column},${this.zone.beacon.row}`,
      {
        kind: "beacon",
        id: "beacon",
        name: "CLULIX beacon",
      },
    );
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

    const occupiedTile = this.occupiedTiles.get(`${nextColumn},${nextRow}`);
    if (this.blockedTiles.has(`${nextColumn},${nextRow}`) || occupiedTile) {
      const reason = occupiedTile
        ? `${occupiedTile.name} blocks the way.`
        : "Movement blocked by terrain.";
      this.#syncDebugState(reason, null, "blocked");
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
    const target = this.#getAdjacentInteractable();
    this.npcObjects.forEach(({ npc, marker, highlight }) => {
      highlight.setVisible(target?.kind === "npc" && target.npc.id === npc.id);

      if (this.app.isCompleted(npc.challengeId)) {
        marker.setTint(0x46d9c4);
        return;
      }

      if (this.app.getActiveNpcId() === npc.id) {
        marker.setTint(0xffffff);
        return;
      }

      marker.setTint(0x8a8a9a);
    });

    this.beaconHighlight?.setVisible(target?.kind === "beacon");
  }

  #updateInteractionPrompt() {
    const target = this.#getAdjacentInteractable();
    const activeNpc = this.zone.npcs[this.app.getActiveNpcIndex()] ?? null;
    const beaconReady = this.app.isBeaconActive();

    let prompt =
      target?.kind === "beacon"
        ? "You are at the CLULIX beacon. Move near Zrix to begin the lesson."
        : "Use WASD or arrow keys. Each press moves one tile.";
    let nearbyNpcId = target?.kind === "npc" ? target.npc.id : null;
    let lastInteractionResult = null;

    if (target?.kind === "beacon" && beaconReady) {
      prompt = "Press E at the beacon to finish the lesson";

      if (this.interactRequested && !this.app.isOverlayOpen()) {
        this.app.handleBeaconInteraction();
        lastInteractionResult = "beacon";
        this.interactRequested = false;
      }
    } else if (target?.kind === "beacon") {
      prompt =
        "The CLULIX beacon has nothing to say yet. Find the highlighted mentor.";
      if (this.interactRequested && !this.app.isOverlayOpen()) {
        lastInteractionResult = "nothing";
      }
    } else if (
      target?.kind === "npc" &&
      activeNpc &&
      target.npc.id === activeNpc.id
    ) {
      prompt = `Press E to talk to ${target.npc.name}`;
      nearbyNpcId = target.npc.id;
      this.app.setWorldPrompt(prompt);

      if (this.interactRequested && !this.app.isOverlayOpen()) {
        this.app.handleNpcInteraction(target.npc.id);
        lastInteractionResult = "dialogue";
        this.interactRequested = false;
      }
    } else if (target?.kind === "npc") {
      prompt = `${target.npc.name} has nothing to say yet. Find ${activeNpc?.name ?? "the active mentor"}.`;
      if (this.interactRequested && !this.app.isOverlayOpen()) {
        this.app.handleInactiveInteraction(target.npc.name, activeNpc?.name);
        lastInteractionResult = "nothing";
      }
    } else if (activeNpc) {
      prompt = `Stand immediately left or right of ${activeNpc.name}. The target will highlight before E works.`;
    }

    if (this.interactRequested && !target) {
      lastInteractionResult = "none";
      this.interactRequested = false;
    }

    this.interactionText.setText(prompt);
    this.#syncDebugState(
      prompt,
      nearbyNpcId,
      undefined,
      target?.id ?? null,
      lastInteractionResult,
    );
    this.interactRequested = false;
  }

  #getAdjacentInteractable() {
    const candidates = [
      ...this.zone.npcs.map((npc) => ({
        kind: "npc",
        id: npc.id,
        npc,
        column: npc.column,
        row: npc.row,
      })),
      {
        kind: "beacon",
        id: "beacon",
        column: this.zone.beacon.column,
        row: this.zone.beacon.row,
      },
    ];

    return (
      candidates.find(
        (candidate) =>
          candidate.row === this.playerGrid.row &&
          Math.abs(candidate.column - this.playerGrid.column) === 1,
      ) ?? null
    );
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
    highlightedTargetId = null,
    lastInteractionResult = null,
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
    host.dataset.highlightedTarget = highlightedTargetId ?? "";
    host.dataset.lastInteractionResult =
      lastInteractionResult ?? host.dataset.lastInteractionResult ?? "idle";
    host.dataset.lastMoveResult =
      lastMoveResult ?? host.dataset.lastMoveResult ?? "idle";
  }
}

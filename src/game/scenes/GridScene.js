import Phaser from "phaser";
import { stopAmbient } from "../systems/AudioSystem.js";

const TERRAIN_SHEET_KEY = "z-shell-terrain";
const TERRAIN_SHEET_PATH = "assets/tiles/z-shell-terrain.png";
const TERRAIN_FRAMES = {
  ground: [0, 1, 2],
  border: [3, 4, 5, 6, 7],
  obstacle: [8, 9, 10, 11],
  platform: [12, 13, 15],
  beacon: 14,
};
const SPRITE_KEYS = {
  captain: "captain-sprite",
  zrix: "zrix-sprite",
  armorer: "armorer-sprite",
  terminal: "terminal-sprite",
  riftCode: "rift-code-sprite",
  weapon: "weapon-sprite",
  overflow: "overflow-sprite",
};

export class GridScene extends Phaser.Scene {
  constructor(sceneKey, zoneId) {
    super(sceneKey);
    this.zoneId = zoneId;
    this.isMoving = false;
    this.playerGrid = { column: 0, row: 0 };
    this.moveQueue = [];
    this.interactRequested = false;
    this.itemObjects = new Map();
    this.interactiveTargets = [];
  }

  preload() {
    this.load.spritesheet(TERRAIN_SHEET_KEY, TERRAIN_SHEET_PATH, {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    this.app = this.registry.get("app") ?? window.__tmuxTrekApp;
    this.zone = this.app.getZone(this.zoneId);
    this.tileSize = this.zone.map.tileSize;
    this.columns = this.zone.map.columns;
    this.rows = this.zone.map.rows;
    this.playerGrid = { ...this.zone.playerStart };
    this.itemObjects = new Map();
    this.interactiveTargets = [];
    this.blockedTiles = new Set(
      (this.zone.obstacles?.tiles ?? []).map(
        ([column, row]) => `${column},${row}`,
      ),
    );

    for (const blocker of this.zone.blockers ?? []) {
      if (!this.app.isObjectiveComplete(blocker.clearedByObjective)) {
        blocker.tiles.forEach(([column, row]) =>
          this.blockedTiles.add(`${column},${row}`),
        );
      }
    }

    this.occupiedTiles = new Map();
    this.cameras.main.setBackgroundColor(this.getBackgroundColor());
    this.#createSpriteTextures();
    this.#drawTileMap();
    this.createZoneDecorations();
    this.#createPlayer();
    this.#createInteractives();
    this.#createUi();
    this.#configureCamera();
    this.#bindKeys();
    this.#handleTileArrival();
    this.#syncDebugState();
    this.cameras.main.fadeIn(450, 70, 217, 196);
    if (!this.app.isOverlayOpen()) {
      this.app.focusGame();
    }
  }

  update() {
    if (!this.app.isOverlayOpen()) {
      this.#handleMovementInput();
    }

    this.#updateInteractionState();
  }

  getBackgroundColor() {
    return "#0a1628";
  }

  getGroundFrame(column, row) {
    return TERRAIN_FRAMES.ground[
      (column * 7 + row * 11) % TERRAIN_FRAMES.ground.length
    ];
  }

  getBorderFrame(column, row) {
    return TERRAIN_FRAMES.border[
      (column * 5 + row * 3) % TERRAIN_FRAMES.border.length
    ];
  }

  shutdown() {
    stopAmbient();
  }

  createZoneDecorations() {}

  getIdlePrompt() {
    return "Explore the zone.";
  }

  getTargetPrompt() {
    return this.getIdlePrompt();
  }

  handleTargetInteraction() {
    return false;
  }

  shouldHighlightTarget() {
    return true;
  }

  #drawTileMap() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const isBorder =
          row === 0 ||
          column === 0 ||
          row === this.rows - 1 ||
          column === this.columns - 1;
        const frame = isBorder
          ? this.getBorderFrame(column, row)
          : this.getGroundFrame(column, row);
        const center = this.#tileCenter(column, row);
        this.add.image(center.x, center.y, TERRAIN_SHEET_KEY, frame);
      }
    }
  }

  #createPlayer() {
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
  }

  #createInteractives() {
    for (const terminal of this.zone.terminals ?? []) {
      this.#createTarget({
        ...terminal,
        kind: "terminal",
        spriteKey: SPRITE_KEYS.terminal,
      });
    }

    for (const npc of this.zone.npcs ?? []) {
      this.#createTarget({
        ...npc,
        kind: "npc",
        spriteKey: SPRITE_KEYS[npc.id] ?? SPRITE_KEYS.armorer,
      });
    }

    for (const blocker of this.zone.blockers ?? []) {
      if (this.app.isObjectiveComplete(blocker.clearedByObjective)) {
        continue;
      }

      this.#createTarget({
        ...blocker,
        kind: "blocker",
        spriteKey: SPRITE_KEYS.overflow,
      });
    }

    for (const item of this.zone.items ?? []) {
      if (this.app.hasItem(item.item)) {
        continue;
      }

      const center = this.#tileCenter(item.column, item.row);
      const spriteKey =
        item.item === "RIFT_CODE" ? SPRITE_KEYS.riftCode : SPRITE_KEYS.weapon;
      const glowColor = item.item === "RIFT_CODE" ? 0x46d9c4 : 0xffb300;
      const glow = this.add.circle(center.x, center.y, 18, glowColor, 0.2);
      if (item.item === "RIFT_CODE") {
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.1, to: 0.55 },
          scaleX: { from: 1, to: 1.5 },
          scaleY: { from: 1, to: 1.5 },
          duration: 850,
          ease: "Sine.InOut",
          yoyo: true,
          repeat: -1,
        });
      }
      const sprite = this.add.image(center.x, center.y, spriteKey);
      const label = this.add.text(center.x - 42, center.y + 28, item.name, {
        color: "#f2e8be",
        fontFamily: '"Share Tech Mono"',
        fontSize: "16px",
      });
      this.itemObjects.set(`${item.column},${item.row}`, {
        ...item,
        glow,
        sprite,
        label,
      });
    }
  }

  #createTarget(target) {
    const center = this.#tileCenter(target.column, target.row);
    const highlight = this.#createHighlight(center.x, center.y);
    const sprite = this.add.image(center.x, center.y, target.spriteKey);
    const label = this.add.text(center.x - 48, center.y + 28, target.name, {
      color: "#f2e8be",
      fontFamily: '"Share Tech Mono"',
      fontSize: "16px",
    });

    this.interactiveTargets.push({
      ...target,
      highlight,
      sprite,
      label,
    });
    this.occupiedTiles.set(`${target.column},${target.row}`, target);
  }

  #configureCamera() {
    const viewportWidth = Number(this.game.config.width);
    const viewportHeight = Number(this.game.config.height);
    this.cameras.main.setBounds(
      0,
      0,
      this.zone.map.width,
      this.zone.map.height,
    );

    if (
      this.zone.map.width > viewportWidth ||
      this.zone.map.height > viewportHeight
    ) {
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    }
  }

  #createUi() {
    this.interactionText = this.add
      .text(480, 694, "", {
        color: "#ffb300",
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  #bindKeys() {
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
        KeyK: { column: 0, row: -1 },
        ArrowDown: { column: 0, row: 1 },
        KeyS: { column: 0, row: 1 },
        KeyJ: { column: 0, row: 1 },
        ArrowLeft: { column: -1, row: 0 },
        KeyA: { column: -1, row: 0 },
        KeyH: { column: -1, row: 0 },
        ArrowRight: { column: 1, row: 0 },
        KeyD: { column: 1, row: 0 },
        KeyL: { column: 1, row: 0 },
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
      this.#syncDebugState({ lastMoveResult: "blocked" });
      return;
    }

    const occupiedTile = this.occupiedTiles.get(`${nextColumn},${nextRow}`);
    if (this.blockedTiles.has(`${nextColumn},${nextRow}`) || occupiedTile) {
      const reason = occupiedTile
        ? `${occupiedTile.name} blocks the way.`
        : "Movement blocked by terrain.";
      this.#syncDebugState({ prompt: reason, lastMoveResult: "blocked" });
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
        this.#handleTileArrival();
        this.#syncDebugState({ lastMoveResult: "moved" });
      },
    });

    this.tweens.add({
      targets: this.playerLabel,
      duration: 110,
      ease: "Quad.Out",
      x: center.x - 24,
      y: center.y + 28,
    });
  }

  #handleTileArrival() {
    const item = this.itemObjects.get(
      `${this.playerGrid.column},${this.playerGrid.row}`,
    );

    if (!item) {
      return;
    }

    item.glow.destroy();
    item.sprite.destroy();
    item.label.destroy();
    this.itemObjects.delete(`${this.playerGrid.column},${this.playerGrid.row}`);
    this.app.handleZoneItemPickup(this.zoneId, item);
  }

  #updateInteractionState() {
    const target = this.#getAdjacentTarget();
    const prompt = target ? this.getTargetPrompt(target) : this.getIdlePrompt();

    for (const candidate of this.interactiveTargets) {
      candidate.highlight.setVisible(
        !!target &&
          target.id === candidate.id &&
          this.shouldHighlightTarget(candidate),
      );
    }

    let lastInteractionResult = null;
    if (this.interactRequested && !this.app.isOverlayOpen()) {
      if (target) {
        lastInteractionResult = this.handleTargetInteraction(target)
          ? "interaction"
          : "nothing";
      } else {
        lastInteractionResult = "none";
      }
    }

    this.interactionText.setText(prompt);
    this.#syncDebugState({
      prompt,
      nearbyNpcId: target?.kind === "npc" ? target.id : "",
      highlightedTargetId: target?.id ?? "",
      lastInteractionResult,
    });
    this.interactRequested = false;
  }

  #getAdjacentTarget() {
    const RADIUS = 2;
    let nearest = null;
    let nearestDist = Infinity;
    for (const target of this.interactiveTargets) {
      const dist = Math.max(
        Math.abs(target.column - this.playerGrid.column),
        Math.abs(target.row - this.playerGrid.row),
      );
      if (dist <= RADIUS && dist < nearestDist) {
        nearest = target;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  #tileCenter(column, row) {
    return {
      x: column * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }

  #createHighlight(x, y) {
    return this.add
      .rectangle(x, y, this.tileSize - 4, this.tileSize - 4)
      .setStrokeStyle(4, 0xfff17a, 1)
      .setFillStyle(0xffb300, 0.08)
      .setVisible(false);
  }

  #generateTexture(key, drawFn) {
    if (this.textures.exists(key)) {
      return;
    }

    const g = this.add.graphics();
    drawFn(g);
    g.generateTexture(key, 48, 48);
    g.destroy();
  }

  #createSpriteTextures() {
    this.#generateTexture(SPRITE_KEYS.captain, (g) => {
      g.fillStyle(0xf2e8be);
      g.fillRoundedRect(13, 4, 22, 18, 8);
      g.fillStyle(0x0a1628);
      g.fillRoundedRect(17, 8, 14, 8, 4);
      g.fillStyle(0x46d9c4);
      g.fillRoundedRect(14, 22, 20, 17, 5);
      g.fillStyle(0xf2e8be);
      g.fillRect(12, 25, 5, 10);
      g.fillRect(31, 25, 5, 10);
      g.fillRect(17, 38, 5, 6);
      g.fillRect(26, 38, 5, 6);
    });

    this.#generateTexture(SPRITE_KEYS.zrix, (g) => {
      g.fillStyle(0x7b2d8b);
      g.fillEllipse(24, 23, 26, 30);
      g.fillEllipse(14, 30, 10, 10);
      g.fillEllipse(34, 30, 10, 10);
      g.fillStyle(0x46d9c4);
      g.fillEllipse(24, 18, 13, 8);
      g.fillRect(21, 6, 3, 12);
      g.fillRect(26, 6, 3, 12);
      g.fillStyle(0xffb300);
      g.fillCircle(19, 22, 3);
      g.fillCircle(29, 22, 3);
    });

    this.#generateTexture(SPRITE_KEYS.armorer, (g) => {
      g.fillStyle(0x8f6d2a);
      g.fillRoundedRect(10, 10, 28, 28, 5);
      g.fillStyle(0x46d9c4);
      g.fillEllipse(24, 15, 12, 10);
      g.fillStyle(0xffb300);
      g.fillRect(16, 24, 16, 3);
      g.fillRect(14, 30, 20, 4);
    });

    this.#generateTexture(SPRITE_KEYS.terminal, (g) => {
      g.fillStyle(0x0b1d2c);
      g.fillRoundedRect(10, 8, 28, 28, 4);
      g.fillStyle(0x46d9c4);
      g.fillRoundedRect(14, 12, 20, 12, 3);
      g.fillStyle(0xffb300);
      g.fillRect(14, 28, 20, 3);
    });

    this.#generateTexture(SPRITE_KEYS.riftCode, (g) => {
      g.fillStyle(0x46d9c4);
      g.fillTriangle(24, 6, 12, 24, 24, 42);
      g.fillTriangle(24, 6, 36, 24, 24, 42);
      g.lineStyle(2, 0xffb300);
      g.strokeRect(18, 18, 12, 12);
    });

    this.#generateTexture(SPRITE_KEYS.weapon, (g) => {
      g.fillStyle(0xffb300);
      g.fillRect(8, 22, 26, 6);
      g.fillStyle(0x46d9c4);
      g.fillRect(28, 18, 8, 14);
      g.fillStyle(0xf2e8be);
      g.fillRect(12, 18, 8, 4);
    });

    this.#generateTexture(SPRITE_KEYS.overflow, (g) => {
      g.fillStyle(0x7b2d8b);
      g.fillRect(8, 8, 32, 32);
      g.fillStyle(0x46d9c4);
      g.fillRect(12, 12, 24, 6);
      g.fillStyle(0xff6f61);
      g.fillRect(12, 24, 20, 6);
      g.fillRect(18, 32, 18, 4);
    });
  }

  #syncDebugState({
    prompt = this.interactionText?.text ?? "",
    nearbyNpcId = "",
    lastMoveResult = null,
    highlightedTargetId = "",
    lastInteractionResult = null,
  } = {}) {
    const host = document.querySelector("#game-root");
    if (!host) {
      return;
    }

    delete host.dataset.titleScreen;
    delete host.dataset.titleSelection;
    host.dataset.playerGrid = `${this.playerGrid.column},${this.playerGrid.row}`;
    host.dataset.isMoving = this.isMoving ? "true" : "false";
    host.dataset.prompt = prompt;
    host.dataset.nearbyNpc = nearbyNpcId;
    host.dataset.activeNpc = this.app.getCurrentObjectiveId() ?? "";
    host.dataset.highlightedTarget = highlightedTargetId;
    host.dataset.lastInteractionResult = lastInteractionResult ?? "";
    host.dataset.lastMoveResult =
      lastMoveResult ?? host.dataset.lastMoveResult ?? "";
    host.dataset.zoneId = this.zoneId;
  }
}

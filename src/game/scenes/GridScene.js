import Phaser from "phaser";
import objectRegistry from "../../data/tiles/object-registry.json";
import tileRegistry from "../../data/tiles/tile-registry.json";
import { stopAmbient } from "../systems/AudioSystem.js";
import { buildBlockedTiles } from "../data/zoneSemantics.js";
import { getFacingFromDelta } from "./actorMotion.js";
import { getActorAnchor, getActorScale, getActorYOffset } from "./actorMotion.js";

const TERRAIN_SHEET_KEY = "z-shell-terrain";
const TERRAIN_SHEET_PATH = "assets/tiles/z-shell-terrain.png";
const ACTOR_SPRITES = {
  captain: {
    key: "captain-sprites",
    path: "assets/generated/sprites/captain-sprites-opaque.png",
    frameWidth: 313,
    frameHeight: 313,
  },
  zrix: {
    key: "zrix-sprites",
    path: "assets/generated/sprites/zrix-sprites-opaque.png",
    frameWidth: 384,
    frameHeight: 256,
  },
  armorer: {
    key: "armorer-sprites",
    path: "assets/generated/sprites/armorer-sprites-opaque.png",
    frameWidth: 384,
    frameHeight: 256,
  },
};
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
  npcPlaceholder: "npc-placeholder-sprite",
  terminal: "terminal-sprite",
  riftCode: "rift-code-sprite",
  weapon: "weapon-sprite",
  overflow: "overflow-sprite",
};

const ANIMATED_NPCS = {
  zrix: ACTOR_SPRITES.zrix.key,
  armorer: ACTOR_SPRITES.armorer.key,
};

export class GridScene extends Phaser.Scene {
  constructor(sceneKey, zoneId) {
    super(sceneKey);
    this.zoneId = zoneId;
    this.zoneArtId = "";
    this.isMoving = false;
    this.playerGrid = { column: 0, row: 0 };
    this.playerFacing = "down";
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

    for (const actor of Object.values(ACTOR_SPRITES)) {
      this.load.spritesheet(actor.key, actor.path, {
        frameWidth: actor.frameWidth,
        frameHeight: actor.frameHeight,
      });
    }

    for (const tileKey of Object.keys(tileRegistry.tiles)) {
      this.load.image(
        `tile-${tileKey}`,
        `assets/tiles/placeholder/tile_${tileKey}.png`,
      );
    }

    for (const objectKey of Object.keys(objectRegistry.objects)) {
      this.load.image(
        `object-${objectKey}`,
        `assets/tiles/placeholder/obj_${objectKey}.png`,
      );
    }
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
    this.blockedTiles = buildBlockedTiles(this.zone);

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
    this.#createWorldObjects();
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

  shouldDrawV2TileMap() {
    return true;
  }

  shouldDrawV2WorldObjects() {
    return true;
  }

  #drawTileMap() {
    if (this.zone.renderMode === "v2") {
      if (this.shouldDrawV2TileMap()) {
        this.#drawV2TileMap();
      }
      return;
    }

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

  #drawV2TileMap() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const tileKey = this.zone.legend[this.zone.grid[row][column]];
        const center = this.#tileCenter(column, row);
        this.add.image(center.x, center.y, `tile-${tileKey}`);
      }
    }
  }

  #createPlayer() {
    const playerCenter = this.#tileCenter(
      this.playerGrid.column,
      this.playerGrid.row,
    );
    this.player = this.add
      .sprite(
        playerCenter.x,
        playerCenter.y + getActorYOffset(),
        ACTOR_SPRITES.captain.key,
        0,
      )
      .setScale(getActorScale("captain"))
      .setOrigin(getActorAnchor("captain").x, getActorAnchor("captain").y);
    this.player.anims.play("captain-idle-down");
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
      const spriteKey = ANIMATED_NPCS[npc.id] ?? SPRITE_KEYS.npcPlaceholder;
      this.#createTarget({
        ...npc,
        kind: "npc",
        spriteKey,
        animPrefix: ANIMATED_NPCS[npc.id] ? npc.id : null,
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

  #createWorldObjects() {
    if (
      this.zone.renderMode !== "v2" ||
      !this.zone.objects?.length ||
      !this.shouldDrawV2WorldObjects()
    ) {
      return;
    }

    const skipTypes = new Set(["rift_terminal", "overflow_blocker"]);
    for (const object of this.zone.objects) {
      if (skipTypes.has(object.type)) {
        continue;
      }

      const center = this.#tileCenter(object.at[0], object.at[1]);
      const sprite = this.add.image(center.x, center.y, `object-${object.type}`);
      this.worldObjects ??= [];
      this.worldObjects.push({
        ...object,
        sprite,
      });
    }
  }

  #createTarget(target) {
    const center = this.#tileCenter(target.column, target.row);
    const highlight = this.#createHighlight(center.x, center.y);
    const sprite =
      target.kind === "npc" && target.animPrefix
        ? this.add
            .sprite(
              center.x,
              center.y + getActorYOffset(),
              target.spriteKey,
              0,
            )
            .setScale(getActorScale(target.id))
            .setOrigin(getActorAnchor(target.id).x, getActorAnchor(target.id).y)
        : this.add.image(center.x, center.y, target.spriteKey);
    if (target.kind === "npc" && target.animPrefix) {
      sprite.anims.play(`${target.id}-idle-down`);
    }
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

    this.playerFacing = getFacingFromDelta(deltaColumn, deltaRow);

    this.player.anims.play(`captain-${this.playerFacing}`, true);

    const center = this.#tileCenter(nextColumn, nextRow);
    this.tweens.add({
      targets: this.player,
      duration: 180,
      ease: "Quad.Out",
      x: center.x,
      y: center.y + getActorYOffset(),
      onComplete: () => {
        this.playerLabel.setPosition(center.x - 24, center.y + 28);
        this.isMoving = false;
        this.player.anims.play(`captain-idle-${this.playerFacing}`, true);
        this.#handleTileArrival();
        this.#syncDebugState({ lastMoveResult: "moved" });
      },
    });

    this.tweens.add({
      targets: this.playerLabel,
      duration: 180,
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

    this.#generateTexture(SPRITE_KEYS.npcPlaceholder, (g) => {
      g.fillStyle(0x2f5d34);
      g.fillRoundedRect(14, 8, 20, 24, 8);
      g.fillStyle(0xf2e8be);
      g.fillCircle(24, 16, 6);
      g.fillStyle(0x46d9c4);
      g.fillRect(14, 24, 20, 6);
      g.fillStyle(0xffb300);
      g.fillRect(18, 30, 12, 5);
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

    this.#defineActorAnimations("captain", ACTOR_SPRITES.captain.key);
    this.#defineActorAnimations("zrix", ACTOR_SPRITES.zrix.key);
    this.#defineActorAnimations("armorer", ACTOR_SPRITES.armorer.key);
  }

  #defineActorAnimations(prefix, textureKey) {
    const directions = {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    };

    for (const [name, row] of Object.entries(directions)) {
      const key = `${prefix}-${name}`;
      if (this.anims.exists(key)) {
        continue;
      }
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(textureKey, {
          start: row * 4,
          end: row * 4 + 3,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    const idleMap = {
      down: `${prefix}-down`,
      left: `${prefix}-left`,
      right: `${prefix}-right`,
      up: `${prefix}-up`,
    };
    for (const [name] of Object.entries(idleMap)) {
      const key = `${prefix}-idle-${name}`;
      if (this.anims.exists(key)) {
        continue;
      }
      this.anims.create({
        key,
        frames: [{ key: textureKey, frame: directions[name] * 4 }],
        frameRate: 1,
      });
    }
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
    host.dataset.zoneArt = this.zoneArtId;
    host.dataset.zoneId = this.zoneId;
  }
}

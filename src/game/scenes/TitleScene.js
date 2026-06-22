import Phaser from "phaser";
import {
  deleteSlot,
  getActiveSlotId,
  hasSave,
  loadGame,
  listSlots,
  newSlot,
  renameSlot,
  setActiveSlotId,
} from "../systems/SaveManager.js";

const AUTH_KEY = "tmux-trek-auth";
const C = {
  bg: "#07131f",
  primary: "#46d9c4",
  accent: "#ffb300",
  text: "#f2e8be",
  dim: "#4a6070",
};

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
    this._screenObjects = [];
    this._keyHandler = null;
    this._activeKeyHandler = null;
    this._activeKeyToken = null;
    this._screenToken = 0;
    this._suppressKeysUntil = 0;
  }

  create() {
    this.app = this.registry.get("app") ?? window.__tmuxTrekApp;
    this._screenObjects = [];
    this._screenToken = 0;
    this._suppressKeysUntil = 0;
    this.events.once("shutdown", () => this.shutdown());

    this.cameras.main.setBackgroundColor(C.bg);
    this._drawLogo();

    const password = (import.meta.env.VITE_AUTH_PASSWORD ?? "").trim();
    if (import.meta.env.VITE_AUTH_PASSWORD !== undefined && !password) {
      console.warn(
        "[TmuxTrek] VITE_AUTH_PASSWORD is set but empty or whitespace — auth gate is disabled.",
      );
    }
    if (password && sessionStorage.getItem(AUTH_KEY) !== "1") {
      this._promptPassword(password);
    } else {
      this._showMenu();
    }
  }

  shutdown() {
    this._clearKeys();
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
    this._removeDomInput();
  }

  // --- screens ---

  _drawLogo() {
    this.add
      .text(480, 150, "TMUX TREK", {
        color: C.primary,
        fontFamily: '"Press Start 2P"',
        fontSize: "38px",
      })
      .setOrigin(0.5);

    this.add
      .text(480, 210, "TERMINAL COMMAND TRAINING SIMULATION", {
        color: C.dim,
        fontFamily: '"Share Tech Mono"',
        fontSize: "13px",
      })
      .setOrigin(0.5);
  }

  _promptPassword(correct) {
    this._clearScreen();
    this._syncDebugState("auth");
    this._addScreenText(480, 330, "ENTER ACCESS CODE:", {
      color: C.accent,
      fontFamily: '"Press Start 2P"',
      fontSize: "12px",
    }).setOrigin(0.5);

    const errRef = { obj: null };

    this._domInput("", (value) => {
      if (value === correct) {
        sessionStorage.setItem(AUTH_KEY, "1");
        this._showMenu();
      } else {
        errRef.obj?.destroy();
        errRef.obj = this._addScreenText(480, 420, "INVALID CODE — try again", {
          color: "#ff4455",
          fontFamily: '"Share Tech Mono"',
          fontSize: "12px",
        }).setOrigin(0.5);
        this.time.delayedCall(1200, () => this._promptPassword(correct));
      }
    });
  }

  _showMenu() {
    this._clearScreen();

    const slots = listSlots();
    const hasActive = hasSave();
    const activeSnapshot = hasActive ? loadGame() : null;
    const canReview =
      Array.isArray(activeSnapshot?.unlockedCommands) &&
      activeSnapshot.unlockedCommands.length > 0;

    const items = [
      {
        label: "NEW GAME",
        action: () => this._newGame(),
      },
      ...(hasActive
        ? [{ label: "CONTINUE", action: () => this._continue() }]
        : []),
      ...(canReview
        ? [{ label: "REVIEW COMMANDS", action: () => this._reviewCommands() }]
        : []),
      ...(slots.length
        ? [
            {
              label: `MANAGE SAVES  (${slots.length})`,
              action: () => this._showSaves(),
            },
          ]
        : []),
    ];
    let sel = hasActive ? 1 : 0;

    const texts = items.map((item, i) =>
      this._addScreenText(480, 330 + i * 58, item.label, {
        color: C.dim,
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
      }).setOrigin(0.5),
    );

    this._addScreenText(480, 680, "j/k  ↑↓  navigate    Enter  select", {
      color: C.dim,
      fontFamily: '"Share Tech Mono"',
      fontSize: "12px",
    }).setOrigin(0.5);

    const refresh = () => {
      this._syncDebugState("menu", items[sel].label);
      texts.forEach((t, i) => {
        t.setColor(i === sel ? C.primary : C.dim);
        t.setText((i === sel ? "▶  " : "   ") + items[i].label);
      });
    };
    refresh();

    this._bindKeys((code) => {
      if (code === "ArrowUp" || code === "KeyK") {
        sel = (sel - 1 + items.length) % items.length;
        refresh();
      } else if (code === "ArrowDown" || code === "KeyJ") {
        sel = (sel + 1) % items.length;
        refresh();
      } else if (code === "Enter" || code === "Space") {
        items[sel].action();
      }
    });
  }

  _showSaves() {
    this._clearScreen();
    this._syncDebugState("saves");

    const slots = listSlots();
    if (!slots.length) {
      this._showMenu();
      return;
    }

    const activeId = getActiveSlotId();
    let sel = Math.max(
      0,
      slots.findIndex((s) => s.id === activeId),
    );

    this._addScreenText(480, 270, "SAVE SLOTS", {
      color: C.accent,
      fontFamily: '"Press Start 2P"',
      fontSize: "13px",
    }).setOrigin(0.5);

    const slotTexts = slots.map((slot, i) =>
      this._addScreenText(480, 320 + i * 40, "", {
        fontFamily: '"Share Tech Mono"',
        fontSize: "13px",
      }).setOrigin(0.5),
    );

    this._addScreenText(
      480,
      668,
      "↑↓  navigate    Enter  load    R  rename    D  delete    Esc  back",
      {
        color: C.dim,
        fontFamily: '"Share Tech Mono"',
        fontSize: "11px",
      },
    ).setOrigin(0.5);

    const refresh = () => {
      this._syncDebugState("saves", slots[sel]?.id ?? "");
      slots.forEach((slot, i) => {
        const active = slot.id === activeId;
        const prefix = i === sel ? "▶  " : "   ";
        const mark = active ? " ●" : "";
        const date = new Date(slot.updatedAt).toLocaleDateString();
        slotTexts[i].setText(`${prefix}${slot.name}${mark}    ${date}`);
        slotTexts[i].setColor(
          i === sel ? C.primary : active ? C.accent : C.text,
        );
      });
    };
    refresh();

    this._bindKeys((code) => {
      if (code === "ArrowUp" || code === "KeyK") {
        sel = (sel - 1 + slots.length) % slots.length;
        refresh();
      } else if (code === "ArrowDown" || code === "KeyJ") {
        sel = (sel + 1) % slots.length;
        refresh();
      } else if (code === "Enter") {
        setActiveSlotId(slots[sel].id);
        this.app.restoreActiveSave();
        this.scene.start("boot");
      } else if (code === "KeyR") {
        this._domInput("New name:", (name) => {
          if (name.trim()) {
            renameSlot(slots[sel].id, name.trim());
            slots[sel].name = name.trim();
          }
          this._showSaves();
        });
      } else if (code === "KeyD") {
        deleteSlot(slots[sel].id);
        slots.splice(sel, 1);
        if (!slots.length) {
          this._showMenu();
          return;
        }
        sel = Math.min(sel, slots.length - 1);
        this._showSaves();
      } else if (code === "Escape") {
        this._showMenu();
      }
    });
  }

  // --- actions ---

  _newGame() {
    this._domInput("Save name (blank = 'New Game'):", (name) => {
      newSlot(name.trim() || "New Game");
      this.app.resetToNewGame();
      this.app.saveProgress();
      this.scene.start("boot");
    });
  }

  _continue() {
    this.app.restoreActiveSave();
    this.scene.start("boot");
  }

  _reviewCommands() {
    this.app.restoreActiveSave();
    this.app.openFlashCards();
    this.scene.start("boot");
  }

  // --- helpers ---

  _addScreenText(x, y, text, style) {
    const obj = this.add.text(x, y, text, style);
    this._screenObjects.push(obj);
    return obj;
  }

  _syncDebugState(screen, selection = "") {
    const host = document.querySelector("#game-root");
    if (!host) {
      return;
    }

    host.dataset.titleScreen = screen;
    host.dataset.titleSelection = selection;
  }

  _clearScreen() {
    this._screenToken += 1;
    this._screenObjects.forEach((o) => o.destroy());
    this._screenObjects = [];
    this._clearKeys();
  }

  _bindKeys(handler) {
    this._activeKeyHandler = handler;
    this._activeKeyToken = this._screenToken;
    if (this._keyHandler) {
      return;
    }

    this._keyHandler = (event) => {
      if (this._activeKeyToken !== this._screenToken) {
        return;
      }
      const isInputCloseKey =
        event.code === "Enter" ||
        event.key === "Enter" ||
        event.code === "Escape" ||
        event.key === "Escape";
      if (isInputCloseKey && performance.now() < this._suppressKeysUntil) {
        return;
      }
      if (!this._hasDomInput()) {
        event.preventDefault();
        this._activeKeyHandler?.(event.code);
      }
    };
    window.addEventListener("keydown", this._keyHandler);
  }

  _clearKeys() {
    this._activeKeyHandler = null;
    this._activeKeyToken = null;
  }

  _domInput(label, onSubmit) {
    this._removeDomInput();
    const overlay = document.createElement("div");
    overlay.id = "title-input-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(7,19,31,0.93);" +
      "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
      "gap:14px;z-index:50;";

    if (label) {
      const lbl = document.createElement("div");
      lbl.textContent = label;
      lbl.style.cssText =
        'color:#ffb300;font-family:"Press Start 2P",monospace;font-size:11px;';
      overlay.appendChild(lbl);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 32;
    input.style.cssText =
      "background:#0a1628;color:#46d9c4;border:1px solid #46d9c4;" +
      'font-family:"Share Tech Mono",monospace;font-size:16px;' +
      "padding:8px 14px;outline:none;width:260px;text-align:center;";
    overlay.appendChild(input);

    const hint = document.createElement("div");
    hint.textContent = "Enter to confirm  ·  Esc to cancel";
    hint.style.cssText =
      'color:#4a6070;font-family:"Share Tech Mono",monospace;font-size:11px;';
    overlay.appendChild(hint);

    document.body.appendChild(overlay);
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter") {
        this._suppressKeysUntil = performance.now() + 1000;
        const captured = input.value;
        this._removeDomInput();
        onSubmit(captured);
      }
      if (e.key === "Escape") {
        this._suppressKeysUntil = performance.now() + 1000;
        this._removeDomInput();
      }
    });
    requestAnimationFrame(() => input.focus());
  }

  _removeDomInput() {
    const overlay = document.getElementById("title-input-overlay");
    if (!overlay) {
      return;
    }

    const input = overlay.querySelector("input");
    if (input) input.value = "";
    overlay.remove();
    requestAnimationFrame(() => document.querySelector("#game-root")?.focus());
  }

  _hasDomInput() {
    return !!document.getElementById("title-input-overlay");
  }
}

# Mobile-Web Support: Feasibility & Strategy

_Written June 20, 2026. Evaluates whether TMUX Trek can optionally run on mobile-web browsers, and — more importantly — what it can honestly teach there._

> **Status: evaluation + recommendation. Not yet scheduled into a phase.** This is a decision document. The recommendation is to support mobile in **tiers keyed on input capability, not device class**, and to lock the responsive stance in _before_ Phase 4 builds the shell UI, because retrofitting responsive layout is far more expensive than building it responsive.

---

## 1. The Core Tension

TMUX Trek's purpose ([`../game-design.md`](../game-design.md) §1) is **execution-level muscle memory**, not recognition. The intended graduate can detach, split panes, and enter copy mode _without looking anything up, because they did it repeatedly on a keyboard._

tmux's interface is a physical-keyboard chord language: a **prefix key (`Ctrl+b`) then another key**. A standard mobile soft keyboard:

- has **no `Ctrl` key**, so `Ctrl+b` — and therefore every window, pane, and copy-mode command (Acts 2–4) — cannot be produced at all;
- has no chord concept and no home-row, so even where keys exist, the _motor learning_ the game exists to create does not happen;
- fights command entry with autocapitalize / autocorrect (`Tmux`, `Ls`, smart quotes break `Ctrl+b "`).

So the question "can it run on mobile?" splits into two very different questions: _can it render and run?_ (yes) and _can it teach what it's for?_ (only with a real keyboard).

---

## 2. The Right Axis: Input Capability, Not Device Class

The dividing line is **whether a physical keyboard is present**, not whether the device is a phone, tablet, or laptop:

- iPad + Magic Keyboard, Android tablet + BT keyboard, even a **phone + Bluetooth keyboard** → full `Ctrl+b`, full `h/j/k/l`, full muscle-memory transfer. Input-identical to a laptop.
- Any device, touch only → no `Ctrl`, no chords, no transfer.

This argues for **progressive enhancement driven by capability**, not a device sniff:

> The game is keyboard-driven. If real keystrokes arrive, the player is _playing_. If only touch arrives, offer **Review Mode** instead of pretending the execution curriculum works.

Practical detection: there is no reliable "is a hardware keyboard attached" browser API. Use a blend — `@media (hover: hover) and (pointer: fine)`, `navigator.maxTouchPoints`, and the decisive signal: **the first real `keydown`**. Treat the arrival of keyboard input as the switch into full play; absent it, route to Review Mode and let the player override ("I have a keyboard").

---

## 3. What Works on Touch, What Doesn't

| Capability                                  | Touch only                                                    | With keyboard                    |
| ------------------------------------------- | ------------------------------------------------------------- | -------------------------------- |
| Render world, terminal, HUD                 | ✅ Phaser + xterm run in mobile browsers                      | ✅                               |
| Read story / dialogue / codex               | ✅ tap to advance                                             | ✅                               |
| Flash cards (self-assessment, #2)           | ✅ tap to flip/rate — touch-native                            | ✅                               |
| Multiple-choice review gate (#3)            | ✅ tap an answer — touch-native                               | ✅                               |
| Save-slot menu, splash, progress (#1/#5/#6) | ✅ buttons                                                    | ✅                               |
| Movement `h/j/k/l`                          | ⚠️ needs on-screen D-pad/swipe — teaches nothing transferable | ✅ real keys (prepays copy mode) |
| Type a command (`tmux new -s armory`)       | ⚠️ soft keyboard, slow, autocorrect fights it                 | ✅                               |
| **Prefix chords (`Ctrl+b d`, `%`, `[`, …)** | ❌ **impossible on a standard soft keyboard**                 | ✅                               |
| Build genuine tmux muscle memory            | ❌ the motor skill needs a keyboard                           | ✅                               |

The pattern is clean: **everything that is recognition or reading is touch-friendly; everything that is execution needs a keyboard.** And the touch-friendly column is almost exactly the Phase 5 assessment surface we already planned.

---

## 4. Recommended Tiered Support

### Tier 1 — Responsive layout + keyboard = full game _(recommended; low–medium cost)_

Make the existing game responsive (fluid layout, Phaser `Scale` mode, terminal/HUD reflow, landscape-friendly) so that **any device with a keyboard plays the real game**. This is mostly CSS + Phaser scale configuration and a `visualViewport` pass. It delivers the highest value for the least new code and does not compromise the One Rule.

### Tier 2 — Touch "Review Mode" _(high value, moderate cost, free-rides on Phase 5)_

For touch-only sessions, offer a companion mode built from the Phase 5 systems: flash cards, multiple-choice review, codex/story, and progress. Honest framing: **review and spaced practice, not execution.** This fits a real learning pattern — review on a phone on the train, execute at a desk later. It needs little beyond making the Phase 5 UIs touch-friendly and adding a capability-based entry route.

### Tier 3 — On-screen tmux control bar _(optional; research-gated; hard caveat)_

A custom touch UI — a D-pad plus a `Ctrl+b` prefix button and key buttons — could inject keybindings straight into `TmuxEngine` (bypassing xterm's keyboard) so touch users can _drive the loop_. It is technically feasible, and **there is strong real-world precedent**: Termius, Blink Shell, a-Shell, Prompt, and others all solve the missing-`Ctrl` problem with an **accessory key bar** above the soft keyboard (`Ctrl`, `Esc`, `Tab`, arrows, `|`, `~`, `/`) plus _sticky-modifier_ handling — tap `Ctrl`, then `b`, and the app emits `C-b`. So the input mechanism is a solved problem worth copying.

**The caveat is pedagogical, not technical.** Those apps serve people who _already know_ tmux and need to use it on the go; a tap bar lets you _operate_ tmux but does not build the keyboard motor memory this game exists to create. So if Tier 3 ships, frame it as a **practice / "field" / accessibility mode**, never the primary learning path, and never marketed as "learn tmux muscle memory on your phone."

**Research prerequisite (do before building Tier 3):** study how Termius, Blink Shell, a-Shell, iSH, and Prompt implement mobile terminal input — accessory bar layout, sticky vs. chord modifiers, customizable key rows, swipe-to-arrow gestures, and hardware-keyboard fallthrough. Capture which patterns transfer to a _teaching_ context (and which are pure power-user utility) in a short research note that feeds the Tier-3 design. Do not design the control bar from scratch when a decade of terminal-app UX already exists.

---

## 5. Forward-Compatibility: Anticipating Later Tiers

The tiers must be built so a later one slots in **without reworking an earlier one.** Five seams to honor while building Tiers 1–2 so Tier 3 (and Review Mode) becomes purely additive:

1. **One input-intent seam.** Route every input — physical keystroke (Tier 1), menu/answer tap (Tier 2), and later the on-screen key bar (Tier 3) — through the same intent API on the engine (`TmuxEngine.execute(command)` / `handleKeybinding(key)`, which already exist). Scene and terminal code must not assume keyboard-only input: a synthetic `Ctrl+b d` from a button must travel the _identical_ path as a real one. This is the single most important anticipation — if Tier 1 wires browser key events only into xterm, Tier 3 has to build a parallel pipe.

2. **Capability as a shared service, not an inline check.** The Tier-1 touch→Review routing should live in one `InputCapability` service (touch? fine pointer? has a real key been pressed? can-send-prefix?). Tier 3 then subscribes to "touch-only and wants to execute" to mount the control bar — no duplicated detection.

3. **Gate on capability, not hardware.** Lock `Ctrl+b` content behind _"can-send-prefix"_, not _"has a physical keyboard."_ When Tier 3 later supplies synthetic chords, the same gate opens with zero rewrite.

4. **Reserve the layout band now.** When Phases 4–5 build responsive UI, reserve a bottom safe-area band (`env(safe-area-inset-*)` + `visualViewport`) where a Tier-3 accessory key bar would mount, and ship it as an empty, hideable container. Adding the bar later then populates a slot instead of reflowing every screen.

5. **Single keybinding registry.** The codex/flash cards (Tier 2) already enumerate each command and its chord; define that command-and-keybinding metadata once (extending `session-curriculum.json`) so the Tier-3 key bar renders from the same source rather than a duplicated list.

Build Tiers 1–2 against these five seams and Tier 3 is additive, not invasive.

---

## 6. The `Ctrl+b` Problem — Options Considered

- **Remap the prefix to something touch-reachable** — tmux allows it, but the game teaches the _default_ `Ctrl+b` for real-world transfer; a custom binding teaches a skill that doesn't transfer. Rejected as a default; acceptable only as an explicit, labeled accessibility option.
- **On-screen prefix button** (Tier 3) — works mechanically, teaches tapping. Crutch, not skill.
- **Require a keyboard for `Ctrl+b` content** (recommended) — gate Acts 2–4 behind detected keyboard input; on touch-only, surface those acts as review/locked with a "connect a keyboard to play" prompt. Honest and simple.

---

## 7. Technical Gotchas (for whoever implements Tier 1)

- **xterm.js on mobile:** focusing its helper textarea to summon the soft keyboard is finicky; set `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, and an appropriate `inputmode` or command entry will be corrupted.
- **Soft-keyboard overlay:** use the `visualViewport` API to keep the active line above the keyboard; naive `100vh` layouts break.
- **Phaser scaling:** set a `Scale.FIT`/`RESIZE` mode and design for a fluid canvas; the current layout assumes a fixed desktop viewport.
- **Orientation:** the world + terminal want landscape; prompt or lock rather than cramming portrait.
- **Touch targets:** the Phase 2 interaction radius and tap-to-interact map cleanly to touch; on-screen buttons need ≥44px targets.

---

## 8. Roadmap Placement & Churn Argument

Like save slots and the gate hook, **the cheap moment to decide this is before the UI that depends on it exists.** Phase 4 builds the splash, menu, and save-slot UI; Phase 5 builds the assessment UIs. If those are built desktop-fixed and made responsive later, every screen is reworked twice.

Recommended sequencing (no new heavyweight phase required):

- **Now (decision):** adopt the capability-based, keyboard-required-for-execution stance recorded here.
- **Phase 4:** build the shell (splash, menu, save slots) **responsive from day one**; add the capability check that routes touch-only sessions toward Review Mode.
- **Phase 5:** ensure flash cards, multiple-choice, progress, and level-complete are touch-friendly — this _is_ Review Mode (Tier 2), so it largely comes for free.
- **Tier 1 polish pass:** a focused responsive/`visualViewport`/Phaser-scale pass so keyboard-equipped tablets/phones get the full game. Can ride alongside Phase 10 polish or be a small standalone milestone. **Build to the §5 forward-compatibility seams** so Tier 3 stays additive.
- **Before any Tier 3 work:** complete the terminal-app research note (§4, Tier 3) — Termius / Blink / a-Shell / Prompt input patterns — then decide whether to build the control bar at all.
- **Tier 3:** deferred until the research note exists; may be declined.

---

## 9. Recommendation

**Yes — optional mobile-web is worth supporting, but only honestly and in tiers:**

1. **Do** make the game responsive so _any keyboard-equipped device_ plays the full game (Tier 1) — high value, low cost, no compromise to the design.
2. **Do** offer touch-only devices a **Review Mode** built from the Phase 5 assessment systems (Tier 2) — honest, useful, nearly free.
3. **Decide the stance before Phase 4** so the shell and assessment UIs are built responsive once, not retrofitted.
4. **Build Tiers 1–2 against the §5 forward-compatibility seams** (one input-intent path, shared capability service, capability-based gating, a reserved layout band, a single keybinding registry) so Tier 3 is additive rather than a rewrite.
5. **Gate Tier 3 behind terminal-app research** (Termius / Blink / a-Shell / Prompt accessory-bar and sticky-modifier patterns) — the input mechanism is a solved problem; copy it rather than reinvent it, and decide afterward whether to build it at all.
6. **Do not** present touch-phone play as a way to learn tmux muscle memory, and do not let a touch control bar (Tier 3) become the default path — it would violate the One Rule and mislead learners.

The single sentence: **TMUX Trek can live on mobile screens, but its core skill lives in a keyboard — so mobile is "full game with a keyboard, review companion without one."**

# TMUX Trek — Sprite and Tile Asset Generation Prompts

> Reference prompt catalog. The current runtime uses the terrain atlas documented in `public/assets/tiles/README.md` and Phaser-generated character textures. See [`session-handoff.md`](../session-handoff.md) before planning asset integration.

> Generated style anchors from the first Phase 6.5 pass now live in `public/assets/generated/`. They are the current visual reference for bridge tiles, the full bridge-room backdrop, crew sprites, and the shared village/armory environment language.

This document is the canonical list of sprite and tile prompts to feed to Nano Banana (or any equivalent pixel-art generator) for TMUX Trek. Each prompt is written for **16×16 or 32×32 pixel art** in a consistent sci-fi alien-planet aesthetic, top-down view, with no anti-aliasing.

The asset list is derived directly from the [game design](../game-design.md). Anything new in that document should produce a corresponding prompt here. Anything removed from the narrative should be removed (or recast) here.

After generation, organize files into:

- `assets/sprites/` — characters, NPCs, hostile entities
- `assets/tiles/` — terrain, walls, props, Rift portals
- `assets/ui/` — HUD icons, codex, fog of war, command glyphs
- `assets/backgrounds/` — bridge, surface, cave, armory parallax layers
- `assets/vfx/` — Rift open/collapse, storm, weapon fire, scanner sweep

---

## Narrative Coverage

These prompts cover Act 1 through the early party arc in the current plan:

- CLULIX bridge opening and descent to surface session `0`
- Surface arrival with Zrix and the advancing overflow buffer
- The `armory` named-Rift loop (new session, detach, ls, attach)
- Companion arc: Ensign Redshirt, Commander Sock, Vrex
- Rift storm hazard and fog-of-war preparation
- Window and pane mechanics in later acts

If you add story beats to the gameplay plan, add prompts here in the same pass.

---

## Player Character — Captain of the CLULIX

**Captain — sprite sheet (idle, walk, interact)**
> Pixel art character sprite sheet, top-down view, 32x32 pixels per frame, sci-fi astronaut captain wearing a teal and amber flight suit with a glowing helmet visor, bioluminescent blue shoulder patch, holding a data tablet. 4-frame walk cycle facing down, up, left, right, plus a 2-frame idle and a 2-frame interact pose. Transparent background. Clean pixel art, 16-color limited palette, no anti-aliasing.

**Captain — armed variant (after armory pickup)**
> Pixel art character sprite sheet, top-down view, 32x32 pixels per frame, same teal and amber sci-fi astronaut captain as the base sprite, now holding a glowing amber energy weapon shaped like a curved bracket. 4-frame walk cycle facing down, up, left, right, plus a 2-frame fire animation with a small muzzle flash. Transparent background. Clean pixel art, no anti-aliasing.

---

## Companions

**Ensign Redshirt — eager security escort (Act 1–2)**
> Pixel art character sprite sheet, top-down view, 32x32 per frame, young human security ensign in a red and charcoal flight uniform with a single shoulder pip, slight bewildered expression, no weapon in this variant (he forgot it). 4-frame walk cycle facing down, up, left, right, plus a 2-frame idle. Transparent background. Pixel art, no anti-aliasing.

**Ensign Redshirt — captured pose (Act 2 capture beat)**
> Pixel art character sprite, top-down 32x32, the same red-and-charcoal security ensign now visibly restrained inside a translucent shimmering Rift containment field, kneeling, looking up. Single-frame static sprite for cutscene use. Transparent background. Pixel art, no anti-aliasing.

**Ensign Redshirt — armed variant (post-rescue, Act 3)**
> Pixel art character sprite sheet, top-down 32x32 per frame, same red-and-charcoal security ensign, now confident posture and carrying a compact sci-fi sidearm with a faint blue glow. 4-frame walk cycle facing down, up, left, right. Transparent background. Pixel art, no anti-aliasing.

**Commander Sock — science officer (Act 3+)**
> Pixel art character sprite sheet, top-down 32x32 per frame, calm science officer in a deep blue and silver uniform, slim build, short angular hair, narrow analytical eyes, holding a slim sci-fi tricorder-like scanner with a small teal display in this variant. 4-frame walk cycle facing down, up, left, right, plus a 2-frame scan-pose where she raises the scanner. Transparent background. Pixel art, no anti-aliasing.

**Commander Sock — pre-scanner variant (before scanner mission)**
> Pixel art character sprite sheet, top-down 32x32 per frame, the same deep blue and silver science officer, but with empty hands and a slightly tense posture, signalling that she is operating without her scanner. 4-frame walk cycle facing down, up, left, right. Transparent background. Pixel art, no anti-aliasing.

**Vrex — Zshellian to be rescued, later party guide**
> Pixel art character sprite sheet, top-down 32x32 per frame, ancient amphibious alien with wrinkled purple-grey skin, long bioluminescent antennae, wearing a layered robe of circuit-like patterns in deep teal and gold, holding a glowing staff shaped like a bracket symbol `[`. Two variants in one sheet: a captured / weakened pose (slumped, dim glow) and a recovered guide pose (upright, bright glow) with a 4-frame walk cycle in each direction. Transparent background. Pixel art, no anti-aliasing.

---

## NPCs

**Zrix — young Zshellian guide (surface session `0`)**
> Pixel art NPC sprite, top-down 32x32, small amphibious alien creature with four stubby limbs, glowing teal bioluminescent stripes along its back, large curious amber eyes, carrying a tiny glowing keyboard-shaped artifact. Friendly expression. 2-frame idle and 4-frame walk cycle facing down, up, left, right. Transparent background. Sci-fi pixel art, vibrant alien colors, no anti-aliasing.

**The Armorer — Zshellian weapon-keeper (`armory` named Rift)**
> Pixel art NPC sprite, top-down 32x32, broad-shouldered Zshellian craftsman with thick chitinous plating in dull bronze and teal, four arms (two folded, two working), glowing forge-orange eyes, wearing a heavy apron embedded with small tool slots, standing beside a faintly glowing weapon. 2-frame idle and a 2-frame "hand off weapon" interact pose. Transparent background. Pixel art, no anti-aliasing.

**Generic Zshellian villager (background NPCs)**
> Pixel art NPC sprite, top-down 32x32, small amphibious Zshellian, four stubby limbs, soft teal or violet bioluminescent markings, neutral expression, simple woven sash. 2-frame idle and 4-frame walk cycle facing down, up, left, right. Provide three palette variants in one sheet (teal, violet, amber). Transparent background. Pixel art, no anti-aliasing.

**HELIX — ship AI hologram (HUD overlay)**
> Pixel art NPC portrait, 48x48 pixels, holographic AI face rendered as a glowing wireframe in teal and amber over a dark transparent background, feminine geometric features, circuit-line patterns flowing across cheekbones, small antenna, expression: dry and sardonic. Provide a 2-frame "speaking" animation (subtle flicker). Pixel art, no anti-aliasing.

---

## Hostile Entities and Hazards

**Overflow buffer — advancing surface threat (animated tile sprite)**
> Pixel art hazard tile, 16x16 per frame, 4-frame animation, a creeping field of corrupted alien data: jagged glitching cyan and magenta blocks bleeding into surrounding terrain, with thin terminal-style cursor lines flickering at the leading edge. Should look like it is *eating* the ground. Seamlessly tileable into a larger advancing mass. Transparent background outside the corrupted area. Pixel art, no anti-aliasing.

**Overflow buffer — leading-edge variant (advancing front)**
> Pixel art hazard tile, 16x16 per frame, 4-frame animation, the leading edge of the corrupted data field from the previous prompt: a thin glitching crest of cyan and magenta cursor-lines pushing forward, visibly devouring an unaltered tile beneath it. Transparent background. Pixel art, no anti-aliasing.

**Overflow buffer — destroyed / cleared remnant**
> Pixel art tile, 16x16, scorched alien ground where the overflow buffer used to be, faint residual cyan-magenta sparks dying out, dark soot streaks. Single static tile. Transparent background. Pixel art, no anti-aliasing.

**Hostile pane sub-process (later-game enemy)**
> Pixel art enemy sprite, top-down 32x32, a small hostile process entity that looks like an angular shard of running terminal output: shifting glyphs in red and amber arranged into a vaguely creature-like silhouette with two glowing eye-slits. 4-frame idle hover, 2-frame attack lunge. Transparent background. Pixel art, no anti-aliasing.

**Corrupted Rift entity (kill-session target)**
> Pixel art enemy sprite, top-down 48x48, a writhing mass of unstable Rift energy in sickly green and violet, vaguely tentacled, with a glitching terminal prompt symbol at its core. 4-frame ambient animation. Used to justify `tmux kill-session`. Transparent background. Pixel art, no anti-aliasing.

**Rift storm — environmental hazard (animated overlay)**
> Pixel art weather effect, 64x64 per frame, 6-frame loop, a swirling sci-fi storm of Rift energy: arcing teal and violet lightning, shimmering distortion bands, scattered glyph-like sparks pulled inward. Designed to overlay the world tiles at low opacity. Transparent background. Pixel art, no anti-aliasing.

---

## Terrain Tiles (16×16)

**CLULIX bridge floor**
> Pixel art terrain tile 16x16, interior starship bridge deck, polished dark grey panel with thin amber inlaid command-lines forming a subtle radial pattern toward the captain's chair, small rivet details at corners, seamlessly tileable, top-down view. Industrial sci-fi aesthetic. No anti-aliasing.

**Alien dirt / base ground (surface)**
> Pixel art terrain tile 16x16, alien planet surface, dark charcoal-grey rocky ground with faint purple mineral veins, subtle texture variation, seamlessly tileable, top-down view. Sci-fi palette: dark greys, muted purples. No anti-aliasing.

**Alien moss ground (surface)**
> Pixel art terrain tile 16x16, alien planet surface, teal-green bioluminescent moss patches on dark rocky ground, faint glow around moss edges, seamlessly tileable, top-down view. Vivid yet dark sci-fi palette. No anti-aliasing.

**Crystal cave floor**
> Pixel art terrain tile 16x16, alien cave floor, translucent purple and blue crystal formations embedded in dark stone, glowing inner light, seamlessly tileable, top-down view. Dark interior lighting. No anti-aliasing.

**Armory floor**
> Pixel art terrain tile 16x16, interior armory deck, dark gunmetal grey reinforced plating with diagonal amber hazard stripes along seams, small bolt details, seamlessly tileable, top-down view. Industrial sci-fi. No anti-aliasing.

**Generic ship metal floor**
> Pixel art terrain tile 16x16, interior starship floor panel, dark gunmetal grey with subtle amber grid lines, small rivet details at corners, seamlessly tileable, top-down view. Industrial sci-fi aesthetic. No anti-aliasing.

**Water / bioluminescent pool**
> Pixel art terrain tile 16x16, alien planet, glowing teal liquid pool surface with subtle ripple ring patterns, bioluminescent shimmer, seamlessly tileable, top-down view. Vivid cyan-teal glow. No anti-aliasing.

---

## Wall and Obstacle Tiles (16×16)

**Stone wall (outdoor)**
> Pixel art wall tile 16x16, alien planet rocky cliff face, dark charcoal with embedded glowing purple mineral crystals, rough-hewn texture, top-down orthographic side view. Seamlessly tileable horizontally. No anti-aliasing.

**Force-field wall (locked Rift barrier)**
> Pixel art obstacle tile 16x16, sci-fi force field panel, semi-transparent shimmering blue-white energy barrier with faint hex grid pattern, glowing at edges, top-down view. Animated shimmer implied in a single frame; also provide a 4-frame shimmer animation variant. No anti-aliasing.

**Crystal cave wall**
> Pixel art wall tile 16x16, alien cave wall, jagged purple and deep blue crystals jutting from dark stone background, inner glow light source, top-down side view. Seamlessly tileable. No anti-aliasing.

**Ship bulkhead wall (CLULIX interior)**
> Pixel art wall tile 16x16, interior starship wall panel, dark grey with amber warning stripe along bottom edge, panel line details, slight metallic sheen, top-down side view. Industrial. No anti-aliasing.

**Armory wall (reinforced)**
> Pixel art wall tile 16x16, reinforced armory wall, layered dark plating with riveted seams, an inset orange caution chevron, faint scuff marks from heavy equipment, top-down side view. Seamlessly tileable. No anti-aliasing.

---

## Rift Portals

These tiles are critical: in the current narrative, **a Rift is the visual representation of a tmux session**. Every session command should have a matching visual.

**Default Rift portal — opens with `tmux`**
> Pixel art object tile 32x32, 6-frame open animation, a circular Rift portal on the ground: a swirling vortex of teal and amber energy with a faint terminal-prompt glyph at its center, soft glow on surrounding tiles. Frame 1 closed (subtle ground sigil), frames 2–5 opening, frame 6 fully open and ready to travel through. Transparent background. Pixel art, no anti-aliasing.

**Named Rift portal — `armory`, `medbay`, `reactor` etc.**
> Pixel art object tile 32x32, a circular Rift portal on the ground identical in shape to the default Rift but tinted with a distinct accent color (provide three palette variants: amber-orange for armory, teal-white for medbay, deep red for reactor). A small floating pixel-text label hovers above each, reading the Rift name. 6-frame ambient pulse animation. Transparent background. Pixel art, no anti-aliasing.

**Rift collapse — `tmux kill-session`**
> Pixel art object tile 32x32, 6-frame collapse animation, a Rift portal violently closing inward: bright flash, swirling inversion, then a dark scorched ground sigil left behind. Transparent background. Pixel art, no anti-aliasing.

**Rift detach effect — `Ctrl+b d`**
> Pixel art VFX sprite 32x32, 4-frame animation, the captain figure stepping back into the Rift while the portal stays open behind them, a soft outgoing arrow glyph above the portal indicating the place persists. Transparent background. Pixel art, no anti-aliasing.

**Rift signpost (manifest marker)**
> Pixel art prop tile 16x16, small alien signpost made of dark stone with a glowing amber bracket-shaped plaque, used to mark a known Rift location on the map for the player. Provide three plaque variants showing the labels `0`, `armory`, and `medbay`. Transparent background. Pixel art, no anti-aliasing.

---

## Command Glyphs (Collectible / HUD Tokens, 16×16)

There should be one glyph per command listed in the gameplay plan's command-to-narrative mapping. These are used both as collectibles in the world and as HUD reminders of unlocked commands.

### Session glyphs

**`tmux` — open default Rift**
> Pixel art collectible item 16x16, glowing teal token icon showing a small Rift swirl with a downward arrow into a planet glyph, pulsing halo, transparent background. Sci-fi icon style. No anti-aliasing.

**`tmux new -s name` — create named Rift**
> Pixel art collectible item 16x16, glowing green keyboard key icon with a small terminal bracket symbol and a tiny name-tag overlay, spark of light, floating with subtle glow halo, transparent background. Sci-fi icon style. No anti-aliasing.

**`Ctrl+b d` — detach**
> Pixel art collectible item 16x16, glowing amber keyboard shortcut token, shows a tiny door with an arrow exiting through it back to a ship silhouette, pulsing glow halo, transparent background. Sci-fi icon. No anti-aliasing.

**`tmux ls` — Rift manifest**
> Pixel art collectible item 16x16, glowing white-blue token showing a tiny stacked list of three bracket symbols, faint scanline overlay, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`tmux attach -t name` — return to a Rift**
> Pixel art collectible item 16x16, glowing teal token showing a small Rift swirl with an inward arrow and a name-tag, halo glow, transparent background. Sci-fi icon. No anti-aliasing.

**`tmux kill-session -t name` — collapse a Rift**
> Pixel art collectible item 16x16, glowing red token showing a Rift swirl with an X overlay and small inward fracture lines, ominous halo, transparent background. Sci-fi icon. No anti-aliasing.

### Window glyphs

**`Ctrl+b c` — open new view**
> Pixel art collectible item 16x16, glowing cyan token icon showing a small framed window with a plus sign in the corner, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`Ctrl+b n / p` — next / previous view**
> Pixel art collectible item 16x16, glowing cyan token icon showing two stacked window frames with left and right arrows, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`Ctrl+b 0–9` — jump to numbered view**
> Pixel art collectible item 16x16, glowing cyan token icon showing a small window frame with the numerals 0–9 stacked in faint background, a bold focus ring around one number, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`Ctrl+b w` — list views**
> Pixel art collectible item 16x16, glowing cyan token icon showing several window frames laid out in a small grid, faint scanline highlight, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`Ctrl+b ,` — rename view**
> Pixel art collectible item 16x16, glowing cyan token icon showing a window frame with a small pencil and name-tag, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`Ctrl+b &` — close view**
> Pixel art collectible item 16x16, glowing red-orange token icon showing a window frame with a small X in the corner, faint cracked-glass effect, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

### Pane glyphs

**`Ctrl+b %` — split vertical**
> Pixel art collectible item 16x16, glowing cyan token icon showing a rectangle split into two vertical halves by a bright line, pulsing halo effect, transparent background. Clean sci-fi icon. No anti-aliasing.

**`Ctrl+b "` — split horizontal**
> Pixel art collectible item 16x16, glowing purple token icon showing a rectangle split into two horizontal halves by a bright line, pulsing halo effect, transparent background. Clean sci-fi icon. No anti-aliasing.

**Pane navigation — `Ctrl+b` arrow keys**
> Pixel art collectible item 16x16, glowing cyan token icon showing a four-pane grid with directional arrows pointing between panes, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`Ctrl+b z` — magnify pane**
> Pixel art collectible item 16x16, glowing amber token icon showing a small pane being expanded outward with magnifier corners, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

**`Ctrl+b x` — kill pane**
> Pixel art collectible item 16x16, glowing red token icon showing a single pane in a four-pane grid being struck out by an X, faint smoke effect, pulsing halo, transparent background. Sci-fi icon. No anti-aliasing.

### Copy mode glyphs

**`Ctrl+b [` — enter copy mode**
> Pixel art collectible item 16x16, glowing gold token showing a tiny scroll with a bracket symbol and a magnifying glass overlay, soft ancient-tech glow, transparent background. Sci-fi rune-like icon. No anti-aliasing.

**Copy mode — selection / yank**
> Pixel art collectible item 16x16, glowing gold token showing a small highlighted text-row glyph with a clipboard icon, soft glow, transparent background. Sci-fi icon. No anti-aliasing.

### Generic states

**Locked command glyph (placeholder)**
> Pixel art collectible item 16x16, grey padlocked keyboard key icon with faint glow indicating a locked / undiscovered command, transparent background. Sci-fi icon style. No anti-aliasing.

**Unlocked-command burst (one-shot VFX)**
> Pixel art VFX sprite 32x32, 4-frame burst animation that plays when a command glyph is collected: bright teal-amber starburst expanding from center, fading sparks. Transparent background. Pixel art, no anti-aliasing.

---

## Items and Pickups

**Energy weapon — armory pickup**
> Pixel art item icon 16x16, sci-fi sidearm shaped like a curved bracket with an amber energy core, faint glow, slight metallic sheen, transparent background, top-down view. Should read clearly at small scale as a "weapon that deletes the overflow buffer." Pixel art, no anti-aliasing.

**Scanner — Commander Sock's instrument**
> Pixel art item icon 16x16, slim sci-fi handheld scanner with a teal display panel and a small antenna, soft pulse of light at the tip, transparent background, top-down view. Pixel art, no anti-aliasing.

**Weapon stand (armory prop)**
> Pixel art prop tile 32x32, an upright reinforced armory display stand holding the energy weapon described above, dark gunmetal frame with amber hazard chevrons, faint glow from the weapon, transparent background, top-down slight angle. Pixel art, no anti-aliasing.

**Generic supply crate (background dressing)**
> Pixel art prop tile 16x16, sealed sci-fi cargo crate, dark grey with a single amber strap and a small terminal-style label, slight wear, transparent background, top-down view. Pixel art, no anti-aliasing.

---

## Props and Decorations (16×16 unless noted)

**CLULIX captain's chair (32×32)**
> Pixel art prop tile 32x32, central command chair on a starship bridge, dark teal upholstery with amber inlays, integrated armrest console panels, soft inner glow from the panels, transparent background, top-down slight angle. Sci-fi industrial. No anti-aliasing.

**CLULIX bridge console (32×16)**
> Pixel art prop tile 32x16, curved starship bridge console, dark grey casing with rows of glowing amber and teal readouts, small holographic indicator above one panel, transparent background, top-down slight angle. Pixel art, no anti-aliasing.

**HELIX projector pedestal (16×16)**
> Pixel art prop tile 16x16, small dark cylindrical pedestal with a glowing teal lens at the top, faint vertical light beam suggesting where HELIX's hologram appears, transparent background, top-down view. Pixel art, no anti-aliasing.

**Crystal fungus (foreground flora)**
> Pixel art decoration tile 16x16, alien planet bioluminescent mushroom-crystal hybrid plant, glowing teal cap with purple stem, emits small light particles, transparent background, top-down view. Vivid alien flora. No anti-aliasing.

**Ancient terminal stone (NPC interaction object, 32×32)**
> Pixel art prop tile 32x32, ancient alien monolith carved from dark stone with glowing amber terminal-like display screen embedded in the face, alien glyphs etched around the border, top-down slight angle. Sci-fi archaeology aesthetic. No anti-aliasing.

**CLULIX hull fragment (background dressing, 32×32)**
> Pixel art prop tile 32x32, sci-fi starship hull fragment, dark grey metal with teal running lights still glowing, scorch marks, transparent background, top-down view. Detailed but readable at small scale. No anti-aliasing.

**Energy crystal deposit (resource / landmark)**
> Pixel art prop tile 16x16, alien mineral deposit, cluster of tall glowing blue-white crystals growing from the ground, inner luminosity, casts faint light on surrounding tiles, transparent background, top-down view. No anti-aliasing.

**Zshellian burrow entrance**
> Pixel art prop tile 16x16, circular alien burrow entrance in the ground, dark tunnel opening with bioluminescent teal rings lining the edges, slight depth suggestion, transparent background, top-down view. No anti-aliasing.

---

## VFX

**Weapon fire — energy bolt**
> Pixel art VFX sprite 16x16, 4-frame animation, a small glowing amber energy bolt traveling left-to-right (provide rotated variants for the four cardinal directions), faint trailing sparks. Transparent background. Pixel art, no anti-aliasing.

**Buffer deletion burst**
> Pixel art VFX sprite 32x32, 6-frame animation, the moment the overflow buffer is destroyed: a sharp inward implosion of cyan-magenta corruption replaced by a clean teal flash, then dissipating sparks. Transparent background. Pixel art, no anti-aliasing.

**Scanner sweep ring (Commander Sock)**
> Pixel art VFX sprite 64x64, 6-frame animation, an expanding teal scan ring radiating outward from a center point with a faint hex-grid texture inside the ring, leaving briefly highlighted tiles in its wake. Transparent background. Pixel art, no anti-aliasing.

**Companion teleport / pulled-into-Rift effect**
> Pixel art VFX sprite 32x32, 6-frame animation, a character figure being yanked sideways into a swirling Rift fissure, with trailing motion lines and energy sparks. Used when Rift storms throw a companion into another session. Transparent background. Pixel art, no anti-aliasing.

---

## UI Elements

**Command Codex book icon (HUD button, 32×32)**
> Pixel art UI icon 32x32, sci-fi digital codex tome, glowing teal cover with a terminal bracket symbol embossed in amber, circuit-line spine, floating glow, transparent background. Game HUD icon style. No anti-aliasing.

**Rift manifest panel (HUD frame, 96×64)**
> Pixel art UI panel 96x64, dark semi-transparent panel with a faint hex-grid backdrop, a teal header bar reading "RIFT MANIFEST" in pixel font, three empty slot rows ready to be populated with Rift names. Transparent background. Pixel art, no anti-aliasing.

**Party portrait frame (HUD slot, 32×32)**
> Pixel art UI frame 32x32, small portrait frame for a companion's face, dark grey border with amber corner accents and a faint inner glow, with an empty interior ready to hold a 24x24 character bust. Provide three states: active, dimmed (companion separated by Rift storm), and empty. Transparent background. Pixel art, no anti-aliasing.

**Companion bust — Captain (24×24)**
> Pixel art UI portrait bust, 24x24, head-and-shoulders pixel portrait of the Captain matching the in-world sprite (teal and amber suit, glowing visor). Transparent background. Pixel art, no anti-aliasing.

**Companion bust — Redshirt (24×24)**
> Pixel art UI portrait bust, 24x24, head-and-shoulders pixel portrait of Ensign Redshirt matching the in-world sprite (red and charcoal uniform, single shoulder pip). Transparent background. Pixel art, no anti-aliasing.

**Companion bust — Sock (24×24)**
> Pixel art UI portrait bust, 24x24, head-and-shoulders pixel portrait of Commander Sock matching the in-world sprite (deep blue and silver uniform, short angular hair). Transparent background. Pixel art, no anti-aliasing.

**Companion bust — Vrex (24×24)**
> Pixel art UI portrait bust, 24x24, head-and-shoulders pixel portrait of Vrex matching the in-world sprite (purple-grey skin, glowing antennae, gold-and-teal robe). Transparent background. Pixel art, no anti-aliasing.

**Fog of war — unexplored tile mask (16×16)**
> Pixel art UI overlay tile 16x16, fully opaque dark navy-black tile with a faint static-noise texture, used to hide unexplored map cells. Seamlessly tileable. Pixel art, no anti-aliasing.

**Fog of war — explored-but-unseen tile mask (16×16)**
> Pixel art UI overlay tile 16x16, semi-transparent dark navy overlay with a subtle hex-grid pattern, used over previously-explored but currently out-of-sight tiles. Seamlessly tileable. Pixel art, no anti-aliasing.

**Scanner reveal highlight (16×16)**
> Pixel art UI overlay tile 16x16, soft teal highlight with a faint outward pulse, used to mark tiles temporarily revealed by Commander Sock's scanner. Seamlessly tileable. Pixel art, no anti-aliasing.

**Starship Credits coin**
> Pixel art UI currency icon 16x16, small glowing hexagonal coin, amber-gold color with a tiny starship silhouette engraved in the center, slight metallic sheen, transparent background. No anti-aliasing.

**Hearts / lives — full**
> Pixel art UI lives indicator 16x16, glowing teal heart shape with circuit-line pattern inside, bright inner glow, transparent background. Sci-fi HUD icon. No anti-aliasing.

**Hearts / lives — empty**
> Pixel art UI lives indicator 16x16, dark grey hollow heart shape with faint outline, dimmed, transparent background. Sci-fi HUD icon. No anti-aliasing.

**Rift unlock banner (celebration effect, 64×16)**
> Pixel art UI banner element 64x16, horizontal strip showing "RIFT UNLOCKED" in pixel font with glowing amber letters, small sparkle particles on either side, dark semi-transparent background. Game UI style. No anti-aliasing.

**Objective marker (HUD pin, 16×16)**
> Pixel art UI marker 16x16, glowing amber downward chevron with a small bracket-symbol embossed at its base, soft pulse, transparent background. Used to point the player at the next narratively-required action. Pixel art, no anti-aliasing.

---

## Backgrounds and Panoramas

**CLULIX bridge interior (Act 1 opening background, 320×180)**
> Pixel art panoramic background 320x180, interior of a sci-fi starship bridge: a sweeping front viewport showing the planet Z-shell below (greens, purples, faint clouds), curved consoles glowing teal and amber in the foreground, the captain's chair silhouette centered, a faint holographic HELIX figure to one side. Atmospheric, slightly lit by viewport glow. No anti-aliasing.

**Planet Z-shell sky (parallax background layer 1 — far, 320×180)**
> Pixel art wide panoramic background 320x180, alien night sky above planet Z-shell, two moons of different sizes (one teal, one amber), dense star field, faint purple nebula cloud, distant mountain silhouettes at bottom edge. Atmospheric sci-fi pixel art. No anti-aliasing. Seamlessly tileable horizontally.

**Crystal caves background (parallax layer 2 — mid, 320×90)**
> Pixel art background layer 320x90, alien crystal cave mid-ground, stalactites of glowing purple and blue crystal hanging from cave ceiling, dark background with scattered bioluminescent dots. Seamlessly tileable horizontally. Sci-fi atmosphere. No anti-aliasing.

**Armory interior background (320×180)**
> Pixel art background 320x180, interior of a Zshellian armory: reinforced dark plating walls with amber hazard chevrons, weapon stands lining the far wall with faint glows, a heavy bulkhead doorway on the right, small forge-light flickering on the left. Industrial sci-fi mood. No anti-aliasing.

**Abandoned station interior background (320×180)**
> Pixel art background 320x180, derelict alien space station interior, dark corridors with flickering amber emergency lights, exposed wiring, floating debris, star field visible through a cracked viewport window. Atmospheric and slightly ominous. Seamlessly tileable. No anti-aliasing.

**Rift storm overlay (320×180)**
> Pixel art panoramic overlay 320x180, a translucent overlay layer showing a planet-wide Rift storm: arcing teal and violet lightning bands, swirling distortion rings, scattered glyph-like sparks. Designed to be drawn over any background at low opacity to indicate storm conditions. Transparent background. Pixel art, no anti-aliasing.

---

## Title Screen and Splash

**TMUX Trek title screen (320×180)**
> Pixel art game title screen illustration, 320x180, alien planet landscape at night with the text "TMUX TREK" in bold retro sci-fi pixel font at the top, glowing amber and teal letters, a small astronaut captain figure silhouetted in the foreground looking up at a massive glowing terminal monolith on the horizon, a swirling Rift portal beside the monolith, two alien moons in the sky, bioluminescent plant life framing the scene. Cinematic pixel art composition, limited palette.

**Act intro splash (320×180)**
> Pixel art splash card 320x180, dark background with a glowing terminal-style frame in teal-amber, large pixel-font text reading "ACT [N]" centered, smaller subtitle line beneath it for the act name (e.g., "DESCENT TO Z-SHELL"). A subtle Rift swirl decoration in the lower right. Atmospheric, minimal. No anti-aliasing.

---

## Maintenance

When the gameplay plan changes:

1. Re-read [game-design.md](../game-design.md) end-to-end.
2. Add a prompt here for any new location, character, hostile entity, item, glyph, VFX, UI element, or background that the new beat introduces.
3. Remove or rewrite prompts that no longer match the narrative (do not leave retired NPCs or mechanics in this file — they will silently get generated).
4. Keep the section structure and style stable so the file stays trivially scannable when feeding prompts to a generator one at a time.

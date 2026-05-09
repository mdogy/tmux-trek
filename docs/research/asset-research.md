<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# If I were to build TMUX Adventures lets call it TMUX Trek and make it a bit more science viction with exploration of a strange planet. collect resources for tile assets.

Here's a full resource guide for **TMUX Trek**, organized by asset category with direct links and license info.

***

## The Visual World of TMUX Trek

The aesthetic should feel like a **retro sci-fi terminal aesthetic meets alien planet exploration** — think pixel art in a palette of deep teals, amber terminal glow, and alien purples. The Phaser tilemap renders the planet surface; xterm.js panels glow like onboard ship computers.

***

## Tile Assets

### 🥇 Kenney.nl — The Gold Standard (CC0)

[Kenney](https://kenney.nl) is the best source for game-jam-quality free assets. Every pack is **CC0** (public domain — no attribution required, fully commercial):[^1][^2]

- **[Space Kit](https://kenney.nl/assets/space-kit)** — 3D-rendered top-down and isometric spaceport tiles: buildings, rocks, ores, ships, characters, weapons. Perfect for the planet surface world map.[^3]
- **[Sci-Fi RTS](https://kenney.nl/assets/scifi-rts)** — Top-down futuristic tiles: terrain, structures, units, ideal for base/ship interior levels
- **[Tiny Town](https://kenney.nl/assets/tiny-town)** / **[Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon)** — 16×16 tiles with a cohesive Kenney style; mix with space packs for interiors
- **[Kenney All-in-1](https://kenney.itch.io/kenney-game-assets)** — 60,000+ assets in a single download, all CC0[^2]


### 🎨 DithArt Sci-Fi Tileset (Free, itch.io)

[DithArt's FREE Sci-fi Tileset](https://dithart.itch.io/ditharts-free-sci-fi-tileset) — crisp 32×32 top-down pixel art for roguelike/RPG. The full series (Med Bay, Alien Spaceship, Sci-fi Dungeon, Sci-fi Items) is designed to be **compatible with each other**, making it easy to build a coherent multi-biome alien planet. Ideal for TMUX Trek's level interiors.[^4]

### 🚀 Itch.io Sci-Fi Free Tilesets

| Asset Pack | Size | Good For |
| :-- | :-- | :-- |
| [Sci-fi Survival Camp Assets – Planet One](https://itch.io/game-assets/free/tag-science-fiction/tag-tileset) | 16×16 | Alien surface terrain |
| [Industrial Tileset](https://itch.io/game-assets/free/tag-16x16/tag-science-fiction) | 16×16 | Ship/base interiors |
| [Free Sci-Fi TileSet Space Station](https://itch.io/game-assets/free/tag-science-fiction/tag-tilemap) | 16×16 | Terminal room zones |
| [Sci-fi Lab – Tileset/Decor/Traps](https://itch.io/game-assets/free/tag-science-fiction/tag-tileset) | varies | Puzzle room dressing |

### OpenGameArt.org

[OpenGameArt](https://opengameart.org/content/sci-fi-2) hosts CC0/CC-BY licensed assets including planet sprites, alien terrain, and sci-fi character sprites. The **17 planet sprites** pack is useful for the overworld/galaxy map screen.[^5]

***

## Characters \& Sprites

- **Kenney Space Kit** includes character sprites (astronauts, robots) in top-down view — CC0[^1]
- **[295+ CC0 Space Sprites](https://www.reddit.com/r/gamedev/comments/1wgibg/free_to_use_cc_zero_space_assets_295_sprites/)** — ships, enemies, power-ups, UI elements, all public domain[^6]
- **DithArt Sci-fi Characters** — compatible with the DithArt tileset series above, 32×32 top-down characters

***

## Audio

| Source | License | Content |
| :-- | :-- | :-- |
| [Kenney Audio](https://kenney.nl/assets?q=audio) | CC0 | Sci-fi SFX, UI sounds, lasers, alarms |
| [OpenGameArt Audio](https://opengameart.org) | CC0/CC-BY | Ambient space music, terminal beeps |
| [Freesound.org](https://freesound.org) | CC0/CC-BY | Keyboard clicks, computer boot sounds |

The **keyboard sound design** matters for muscle memory — each tmux command should have a satisfying distinct audio cue when executed correctly. A short synthesizer chime for `Ctrl+b %` splitting a pane, a heavier thud for killing a session, etc.

***

## Fonts

- **[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)** — OFL licensed, classic arcade pixel font; good for in-game UI and title screen
- **[Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono)** — monospace terminal font for xterm.js display and in-game dialogue
- **[VT323](https://fonts.google.com/specimen/VT323)** — captures the amber CRT terminal glow aesthetic perfectly for tmux panel labels

***

## Tilemap Tooling

- **[Tiled Map Editor](https://www.mapeditor.org/)** — free, open source tile map editor; exports JSON natively consumed by Phaser 4's tilemap system. The DithArt packs include example `.tiled` project files[^4]
- **[LDtk](https://ldtk.io/)** — modern alternative to Tiled, also free and Phaser-compatible; better UI for multi-level world design

***

## Suggested World Biomes for TMUX Trek

Mapping game zones to asset packs and tmux concepts:


| Planet Zone | Tileset | tmux Commands Taught |
| :-- | :-- | :-- |
| **Landing Crater** (tutorial) | Kenney Space Kit terrain | `tmux new`, `attach`, `detach` |
| **Base Camp Alpha** | DithArt Sci-fi Tileset | `new-window` (`c`), `next`/`prev` (`n/p`) |
| **Alien Ruins** | Industrial Tileset 16×16 | Pane splits (`%`, `"`), navigation (arrows) |
| **Crystal Caves** | Sci-fi Survival Camp | Pane zoom (`z`), resize (`Ctrl+b` + arrow) |
| **Abandoned Station** | DithArt Sci-fi Dungeon | Copy mode (`[`, vim nav, `Space`, `Enter`) |
| **Ship Core (Final)** | DithArt Alien Spaceship | `.tmux.conf`, scripting, tmuxinator |

This gives you a natural difficulty gradient from the open planet surface (simple) to the claustrophobic ship core (advanced), with each biome's visual style reinforcing the complexity of the tmux concepts being taught.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://kenney.nl/assets/space-kit

[^2]: https://kenney.itch.io/kenney-game-assets

[^3]: https://opengameart.org/content/space-kit

[^4]: https://dithart.itch.io/ditharts-free-sci-fi-tileset

[^5]: https://opengameart.org/content/sci-fi-2

[^6]: https://www.reddit.com/r/gamedev/comments/1wgibg/free_to_use_cc_zero_space_assets_295_sprites/

[^7]: https://itch.io/game-assets/free/tag-science-fiction/tag-tileset

[^8]: https://itch.io/game-assets/free/tag-science-fiction/tag-tilemap

[^9]: https://www.gameart2d.com/free-sci-fi-platformer-tileset.html

[^10]: https://www.reddit.com/r/gamedev/comments/m8gx6e/ive_made_85_modular_scifi_assets_completely_free/

[^11]: https://craftpix.net/freebies/free-platformer-game-tileset-pixel-art/

[^12]: https://www.reddit.com/r/RPGMaker/comments/egr924/sci_fi_tilesets/

[^13]: https://itch.io/game-assets/code-mit/free/tag-pixel-art

[^14]: https://www.youtube.com/watch?v=cYZgNo0pcUU

[^15]: https://itch.io/game-assets/free/tag-16x16/tag-science-fiction


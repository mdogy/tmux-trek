# Z-shell Terrain Atlas

`z-shell-terrain.png` is the runtime 192x192 sprite sheet. Phaser loads it as a
4x4 grid of 48x48 frames.

| Frames | Use                                 |
| ------ | ----------------------------------- |
| 0-2    | Landing Crater ground variations    |
| 3-7    | Rocky map-border variations         |
| 8-11   | Purple crystal obstacle variations  |
| 12-15  | Amber and teal technology platforms |

`z-shell-terrain-source.png` is the generated high-resolution source atlas kept
for future edits and alternate exports.

Character textures are not part of this atlas. They are currently generated with Phaser graphics in `src/game/scenes/WorldScene.js`. Replacing those textures with a character sprite sheet is planned work; preserve distinct character silhouettes and existing collision/interaction behavior.

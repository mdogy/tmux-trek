# Asset Generation Scripts

These scripts parse the prompt catalog and provide an experimental Google Gemini browser-automation path.

## Current Status

- Runtime assets belong in `public/assets/`.
- The current game loads `public/assets/tiles/z-shell-terrain.png`.
- `generate-assets.js` currently writes generated files to root `assets/`, so generated output is **not automatically integrated into the game**.
- Gemini selectors and authorization behavior may change; treat the generator as experimental.
- Character and prop sprites are currently generated at runtime in `src/game/scenes/GridScene.js` via `#createSpriteTextures()`, not loaded from sprite sheets. `WorldScene.js` is legacy code and is not in the active scene flow.

See [Session Handoff](../docs/session-handoff.md) and [Asset Prompt Catalog](../docs/assets/image-generation-prompts.md) before changing the pipeline.

## Commands

```bash
npm run assets:list
npm run assets:generate
```

`assets:list` parses and prints every prompt. `assets:generate` launches a visible browser, may require Gemini authorization, skips existing files, and writes generated PNGs under root `assets/`.

## Integration Checklist

Before treating a generated asset as complete:

1. Inspect and crop/resize it to the intended frame dimensions.
2. Build a predictable atlas or sprite sheet where appropriate.
3. Move the runtime-ready output into `public/assets/`.
4. Update Phaser loading/frame definitions.
5. Add a visual or browser acceptance test.
6. Document the frame layout beside the asset.

Do not delete the current runtime terrain atlas until its replacement is loaded and verified.

# Asset Generation Scripts

Tools to automate sprite and tile asset generation from the image-generation-prompts.md file.

## Setup

Before running asset generation, ensure you have Playwright installed and have Google Gemini access:

```bash
npm install
```

The scripts use Playwright to automate browser interactions. On first run, you'll be prompted to authorize Google Gemini in your browser. After that, generation is fully automated.

## Usage

### List all prompts

View all prompts that need generation:

```bash
npm run assets:list
```

or

```bash
bash scripts/list-prompts.sh
```

### Generate all assets

Open Google Gemini in a browser window and generate all missing assets:

```bash
npm run assets:generate
```

This script will:
1. Parse all prompts from `docs/assets/image-generation-prompts.md`
2. Open Google Gemini (you'll authorize once if not logged in)
3. For each prompt, paste it into Gemini's chat
4. Wait for the image to generate
5. Download the image to the correct `assets/` subfolder
6. Skip any assets that already exist
7. Respect rate limits between requests

### Asset organization

Generated assets are automatically organized into:

- `assets/sprites/` — characters, NPCs, hazards
- `assets/tiles/` — terrain, walls, props, Rift portals
- `assets/ui/` — HUD icons, glyphs, UI elements
- `assets/backgrounds/` — parallax layers and panoramas
- `assets/vfx/` — particle effects and animations

Filenames are automatically derived from the prompt title (e.g., "Zrix — young Zshellian guide" → `zrix-young-zshellian-guide.png`).

## How the generator works

1. **Parsing**: `parse-prompts.js` extracts all prompts from the markdown file, organizing them by category and folder.
2. **Automation**: `generate-assets.js` uses Playwright to:
   - Navigate to Google Gemini
   - Wait for user authorization (first run only)
   - For each prompt:
     - Click the chat input
     - Type the prompt
     - Send the message
     - Wait for image generation
     - Download the generated image
     - Save it to the correct folder
   - Report progress and completion stats

## Manual workflow (if automation fails)

If the script encounters issues, you can generate assets manually:

1. Go to https://gemini.google.com
2. Copy a prompt from `docs/assets/image-generation-prompts.md`
3. Paste it into the chat
4. Wait for the image to generate
5. Right-click the image and save to `assets/[folder]/[filename].png`

## Troubleshooting

**"Could not find input field"** — Gemini's DOM structure may have changed. Update the `inputSelector` in `generate-assets.js` to match the current interface.

**"Image generation timed out"** — Gemini may be slow or rate-limited. The script will skip and continue; you can retry later.

**"Authorization timeout"** — Make sure you're logged into Google and that Gemini has permission to access your account. Close the browser window and try again.

**Downloads not moving to assets folder** — Check that the `assets/` directory exists. The script will create missing subdirectories, but the parent must exist.

## Adding new prompts

When you add a new prompt to `docs/assets/image-generation-prompts.md`:

1. The prompt will be auto-discovered on the next run
2. If a file with the same name already exists, it will be skipped
3. To regenerate an existing asset, delete it from `assets/` first, then re-run the script

## Rate limiting

The script pauses 2 seconds between each request to respect Gemini's rate limits. If you hit timeouts or "too many requests" errors, increase the sleep duration in `generate-assets.js`.

# tmux-trek demo reel pipeline
#
# make demo          — full pipeline: install deps, record clips, assemble reel
# make demo-clips    — record Playwright highlight clips only
# make demo-reel     — assemble reel.mp4 from existing clips
# make demo-clean    — remove clips and work files (reel.mp4 is preserved)
# make demo-clean-all — remove everything under test-results/demo/

.PHONY: demo demo-clips demo-reel demo-clean demo-clean-all _ffmpeg _python3

# ── Entry points ──────────────────────────────────────────────────────────────

demo: _ffmpeg _python3 _pillow demo-clips demo-reel

demo-clips: _ffmpeg
	@# Remove previous clip dirs and work files but leave reel.mp4 if present
	@find test-results/demo -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} + 2>/dev/null || true
	@mkdir -p test-results/demo
	npx playwright test --config=playwright.demo.config.js

demo-reel: _ffmpeg _python3
	python3 scripts/demo-reel.py

# ── Guards ─────────────────────────────────────────────────────────────────────

_ffmpeg:
	@which ffmpeg > /dev/null 2>&1 || ( \
	  echo "→ ffmpeg not found. Installing via Homebrew…"; \
	  brew install ffmpeg; \
	  which ffmpeg > /dev/null 2>&1 || ( echo "ERROR: ffmpeg install failed. Install manually: https://ffmpeg.org/" && exit 1 ) \
	)

_python3:
	@which python3 > /dev/null 2>&1 || ( \
	  echo "ERROR: python3 not found. Install from https://python.org or: brew install python3"; \
	  exit 1 \
	)

_pillow:
	@python3 -c "import PIL" 2>/dev/null || ( \
	  echo "→ Installing Pillow for title card generation…"; \
	  pip3 install --quiet Pillow; \
	)

# ── Cleanup ────────────────────────────────────────────────────────────────────

demo-clean:
	@find test-results/demo -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "Clip dirs and work files removed. reel.mp4 preserved."

demo-clean-all:
	rm -rf test-results/demo/
	@echo "All demo output removed."

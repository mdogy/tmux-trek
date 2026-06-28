import { mkdirSync } from "node:fs";
import { test } from "@playwright/test";
import {
  SAVE_AT_RETURN_TO_BRIDGE,
  SAVE_AT_SURFACE,
  injectSave,
  waitForGrid,
} from "./helpers.js";

const FRAMES_DIR = "test-results/demo/frames";

function ensureFramesDir() {
  mkdirSync(FRAMES_DIR, { recursive: true });
}

async function captureTimedFrame(page, name, seconds) {
  await page.waitForTimeout(seconds * 1000);
  await page.screenshot({ path: `${FRAMES_DIR}/${name}-${seconds}s.png` });
}

test("bridge frames are captured after the scene has settled", async ({
  page,
}) => {
  test.setTimeout(90_000);
  ensureFramesDir();

  await page.goto("/?testMode=1&demo=1&useV2Zones=1");
  await waitForGrid(page, [7, 8], "bridge");

  await captureTimedFrame(page, "bridge", 10);
  await captureTimedFrame(page, "bridge", 20);
});

test("surface frames are captured after the scene has settled", async ({
  page,
}) => {
  test.setTimeout(90_000);
  ensureFramesDir();

  await injectSave(page, SAVE_AT_SURFACE);
  await page.goto("/?testMode=1&demo=1&useV2Zones=1");
  await waitForGrid(page, [1, 15], "surface");

  await captureTimedFrame(page, "surface", 10);
  await captureTimedFrame(page, "surface", 20);
});

test("armory frames are captured after the scene has settled", async ({
  page,
}) => {
  test.setTimeout(90_000);
  ensureFramesDir();

  await injectSave(page, SAVE_AT_RETURN_TO_BRIDGE);
  await page.goto("/?testMode=1&demo=1&useV2Zones=1");
  await waitForGrid(page, [7, 10], "armory");

  await captureTimedFrame(page, "armory", 10);
  await captureTimedFrame(page, "armory", 20);
});

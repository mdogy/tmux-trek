import { expect, test } from "@playwright/test";
import {
  injectSave,
  SAVE_AT_RETURN_TO_BRIDGE,
  SAVE_AT_SURFACE,
} from "../demo/helpers.js";

test("v2 bridge debug path exposes the generated backdrop", async ({ page }) => {
  test.setTimeout(30_000);

  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/?testMode=1&useV2Zones=1");
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "bridge",
    { timeout: 15_000 },
  );
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-art",
    "bridge-background",
  );
});

test("v2 bridge projects semantic objects and crew sprites onto the painted backdrop", async ({
  page,
}) => {
  test.setTimeout(30_000);

  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/?testMode=1&useV2Zones=1");
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "bridge",
    { timeout: 15_000 },
  );

  const bridgeState = await page.evaluate(() => {
    const scene = window.__tmuxTrekApp.game.scene.getScene("bridge");
    const targetSummary = Object.fromEntries(
      scene.interactiveTargets.map((target) => [
        target.id,
        {
          x: Math.round(target.sprite.x),
          y: Math.round(target.sprite.y),
          texture: target.sprite.texture.key,
        },
      ]),
    );
    const objectSummary = Object.fromEntries(
      scene.worldObjects.map((object) => [
        object.id,
        {
          x: Math.round(object.sprite.x),
          y: Math.round(object.sprite.y),
        },
      ]),
    );

    return {
      terminal: targetSummary["rift-terminal"],
      helmOfficer: targetSummary["helm-officer"],
      commsOfficer: targetSummary["comms-officer"],
      firstOfficer: targetSummary["first-officer"],
      chair: objectSummary.chair,
      helm: objectSummary.helm,
      nav: objectSummary.nav,
      ops: objectSummary.ops,
      science: objectSummary.science,
      comms: objectSummary.comms,
    };
  });

  expect(bridgeState.chair).toEqual({ x: 480, y: 264 });
  expect(bridgeState.helm).toEqual({ x: 288, y: 168 });
  expect(bridgeState.nav).toEqual({ x: 672, y: 168 });
  expect(bridgeState.ops).toEqual({ x: 352, y: 312 });
  expect(bridgeState.science).toEqual({ x: 672, y: 312 });
  expect(bridgeState.comms).toEqual({ x: 352, y: 456 });
  expect(bridgeState.terminal).toEqual({
    x: 864,
    y: 456,
    texture: "terminal-sprite",
  });
  expect(bridgeState.helmOfficer.texture).toBe("captain-sprites");
  expect(bridgeState.commsOfficer.texture).toBe("captain-sprites");
  expect(bridgeState.firstOfficer.texture).toBe("captain-sprites");
});

test("v2 surface and armory project semantics onto their painted maps", async ({
  page,
}) => {
  test.setTimeout(30_000);

  await injectSave(page, SAVE_AT_SURFACE);
  await page.goto("/?testMode=1&useV2Zones=1");
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "surface",
    { timeout: 15_000 },
  );

  const surfaceState = await page.evaluate(() => {
    const scene = window.__tmuxTrekApp.game.scene.getScene("surface");
    const zrix = scene.interactiveTargets.find((target) => target.id === "zrix");
    return {
      visualWidth: scene.getVisualMapWidth(),
      visualHeight: scene.getVisualMapHeight(),
      zrix: {
        x: Math.round(zrix.sprite.x),
        y: Math.round(zrix.sprite.y),
        texture: zrix.sprite.texture.key,
      },
    };
  });

  expect(surfaceState.visualWidth).toBe(1920);
  expect(surfaceState.visualHeight).toBe(1440);
  expect(surfaceState.zrix).toEqual({
    x: 1560,
    y: 1080,
    texture: "zrix-sprites",
  });

  await page.close();
});

test("v2 armory fills the painted room and uses armory character sprites", async ({
  browser,
}) => {
  test.setTimeout(30_000);

  const page = await browser.newPage();
  await injectSave(page, SAVE_AT_RETURN_TO_BRIDGE);
  await page.goto("/?testMode=1&useV2Zones=1");
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "armory",
    { timeout: 15_000 },
  );

  const armoryState = await page.evaluate(() => {
    const scene = window.__tmuxTrekApp.game.scene.getScene("armory");
    const armorer = scene.interactiveTargets.find(
      (target) => target.id === "armorer",
    );
    const apprentice = scene.interactiveTargets.find(
      (target) => target.id === "apprentice",
    );
    return {
      visualWidth: scene.getVisualMapWidth(),
      visualHeight: scene.getVisualMapHeight(),
      armorer: {
        x: Math.round(armorer.sprite.x),
        y: Math.round(armorer.sprite.y),
        texture: armorer.sprite.texture.key,
      },
      apprenticeTexture: apprentice.sprite.texture.key,
    };
  });

  expect(armoryState.visualWidth).toBe(960);
  expect(armoryState.visualHeight).toBe(720);
  expect(armoryState.armorer).toEqual({
    x: 210,
    y: 270,
    texture: "armorer-sprites",
  });
  expect(armoryState.apprenticeTexture).toBe("armorer-sprites");
  await page.close();
});

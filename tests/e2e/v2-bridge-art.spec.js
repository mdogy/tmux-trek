import { expect, test } from "@playwright/test";
import {
  injectSave,
  SAVE_AT_RETURN_TO_BRIDGE,
  SAVE_AT_SURFACE,
} from "../demo/helpers.js";

test("v2 bridge debug path exposes the generated backdrop", async ({
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
          width: Math.round(object.sprite.displayWidth),
          height: Math.round(object.sprite.displayHeight),
        },
      ]),
    );
    const bridgeTitle = scene.children.list.find(
      (child) => child.text === "CLULIX BRIDGE",
    );

    return {
      bridgeTitle: {
        x: Math.round(bridgeTitle.x),
        y: Math.round(bridgeTitle.y),
      },
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

  expect(bridgeState.bridgeTitle).toEqual({ x: 480, y: 18 });
  expect(bridgeState.chair).toEqual({
    x: 480,
    y: 360,
    width: 56,
    height: 88,
  });
  expect(bridgeState.helm).toMatchObject({ x: 288, y: 168 });
  expect(bridgeState.nav).toMatchObject({ x: 672, y: 168 });
  expect(bridgeState.ops).toMatchObject({ x: 352, y: 312 });
  expect(bridgeState.science).toMatchObject({ x: 672, y: 312 });
  expect(bridgeState.comms).toMatchObject({ x: 288, y: 408 });
  expect(bridgeState.terminal).toEqual({
    x: 672,
    y: 312,
    texture: "terminal-sprite",
  });
  expect(bridgeState.helmOfficer).toMatchObject({ x: 288, y: 218 });
  expect(bridgeState.commsOfficer).toMatchObject({ x: 288, y: 458 });
  expect(bridgeState.firstOfficer).toMatchObject({ x: 608, y: 170 });
  expect(bridgeState.helmOfficer.texture).toBe("captain-sprites");
  expect(bridgeState.commsOfficer.texture).toBe("captain-sprites");
  expect(bridgeState.firstOfficer.texture).toBe("captain-sprites");
});

test("captain and crew enter the bridge facing the viewscreen", async ({
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

  const facingState = await page.evaluate(() => {
    const scene = window.__tmuxTrekApp.game.scene.getScene("bridge");
    const npcById = Object.fromEntries(
      scene.interactiveTargets
        .filter((t) => t.kind === "npc")
        .map((t) => [t.id, t.sprite.anims.currentAnim?.key ?? null]),
    );
    return {
      playerGrid: scene.playerGrid,
      playerFacing: scene.playerFacing,
      playerAnim: scene.player.anims.currentAnim?.key ?? null,
      helmOfficer: npcById["helm-officer"],
      commsOfficer: npcById["comms-officer"],
      firstOfficer: npcById["first-officer"],
    };
  });

  expect(facingState.playerGrid).toEqual({ column: 7, row: 8 });
  expect(facingState.playerFacing).toBe("up");
  expect(facingState.playerAnim).toBe("captain-idle-up");
  expect(facingState.helmOfficer).toBe("captain-idle-up");
  expect(facingState.commsOfficer).toBe("captain-idle-up");
  expect(facingState.firstOfficer).toBe("captain-idle-up");
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
    const zrix = scene.interactiveTargets.find(
      (target) => target.id === "zrix",
    );
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

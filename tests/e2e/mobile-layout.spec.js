import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
}

async function expectCanvasFitsPanel(page) {
  await page.waitForSelector("canvas", { timeout: 15_000 });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const panel = document.querySelector(".viewport-panel");
        const canvas = document.querySelector("canvas");
        if (!panel || !canvas) return false;

        const panelRect = panel.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        return (
          canvasRect.width > 0 &&
          canvasRect.height > 0 &&
          canvasRect.width <= panelRect.width + 1 &&
          canvasRect.height <= panelRect.height + 1
        );
      }),
    )
    .toBe(true);
}

test("phone portrait keeps the title shell within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();

  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-title-screen",
    "menu",
    { timeout: 15_000 },
  );
  await expectCanvasFitsPanel(page);
  await expectNoHorizontalOverflow(page);
});

test("phone portrait can start a new game by tapping the menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();

  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-title-screen",
    "menu",
    { timeout: 15_000 },
  );

  // Fresh storage shows a single menu item, NEW GAME, at game-space
  // (480, 330) in the 960×720 coordinate system; map it through the
  // scaled canvas rect and tap it.
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    box.x + (box.width * 480) / 960,
    box.y + (box.height * 330) / 720,
  );

  await expect(page.locator("#title-input-overlay input")).toBeVisible({
    timeout: 5_000,
  });
});

test("phone landscape displays the playable bridge canvas without clipping", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/?testMode=1");

  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "bridge",
    { timeout: 15_000 },
  );
  await expectCanvasFitsPanel(page);
  await expectNoHorizontalOverflow(page);
});

test("tablet landscape scales the game beside the sidebar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/?testMode=1");

  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-zone-id",
    "bridge",
    { timeout: 15_000 },
  );
  await expectCanvasFitsPanel(page);
  await expectNoHorizontalOverflow(page);
});

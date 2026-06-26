import "@xterm/xterm/css/xterm.css";
import "./styles.css";
import { initDemoCaption } from "./game/DemoCaption.js";

async function bootstrap() {
  const loading = document.createElement("div");
  loading.id = "boot-loading";
  loading.textContent = "Loading...";
  loading.style.cssText =
    "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;" +
    "background:#07131f;color:#f2e8be;font-family:'Press Start 2P',monospace;" +
    "font-size:18px;letter-spacing:0.08em;z-index:2000;";
  document.body.appendChild(loading);

  let dots = 0;
  const spinner = window.setInterval(() => {
    dots = (dots + 1) % 4;
    loading.textContent = `Loading${".".repeat(dots)}`;
  }, 350);

  initDemoCaption();
  const { TmuxTrekApp } = await import("./game/TmuxTrekApp.js");
  const app = new TmuxTrekApp();
  app.start();

  window.clearInterval(spinner);
  window.setTimeout(() => {
    loading.remove();
  }, 500);
}

bootstrap();

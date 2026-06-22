import "@xterm/xterm/css/xterm.css";
import "./styles.css";
import { initDemoCaption } from "./game/DemoCaption.js";

async function bootstrap() {
  initDemoCaption();
  const { TmuxTrekApp } = await import("./game/TmuxTrekApp.js");
  const app = new TmuxTrekApp();
  app.start();
}

bootstrap();

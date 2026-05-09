import "@xterm/xterm/css/xterm.css";
import "./styles.css";

async function bootstrap() {
  const { TmuxTrekApp } = await import("./game/TmuxTrekApp.js");
  const app = new TmuxTrekApp();
  app.start();
}

bootstrap();

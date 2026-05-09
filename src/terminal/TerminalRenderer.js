import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";

export class TerminalRenderer {
  constructor() {
    this.term = null;
    this.fitAddon = null;
    this.host = null;
  }

  mount(container) {
    this.dispose();

    this.host = document.createElement("div");
    this.host.style.height = "100%";
    this.host.style.padding = "1rem";
    container.replaceChildren(this.host);

    this.term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: "VT323, monospace",
      fontSize: 28,
      rows: 20,
      theme: {
        background: "#07131f",
        foreground: "#f2e8be",
        cursor: "#46d9c4",
        brightYellow: "#ffb300",
        brightCyan: "#46d9c4",
      },
    });

    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
    this.term.open(this.host);
    this.fitAddon.fit();
    this.term.focus();
    window.addEventListener("resize", this.#fit);
    return this.term;
  }

  write(text) {
    this.term?.write(text);
  }

  writeln(text = "") {
    this.term?.writeln(text);
  }

  clear() {
    this.term?.clear();
  }

  focus() {
    this.term?.focus();
  }

  onKey(handler) {
    return this.term?.onKey(handler);
  }

  dispose() {
    window.removeEventListener("resize", this.#fit);
    this.term?.dispose();
    this.term = null;
    this.fitAddon = null;

    if (this.host) {
      this.host.remove();
      this.host = null;
    }
  }

  #fit = () => {
    this.fitAddon?.fit();
  };
}

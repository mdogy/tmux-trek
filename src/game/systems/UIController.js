export class UIController {
  constructor({ state, terminalRoot, dialogueRoot, toastRoot }) {
    this.state = state;
    this.terminalRoot = terminalRoot;
    this.dialogueRoot = dialogueRoot;
    this.toastRoot = toastRoot;
    this.toastTimer = null;

    this.zoneName = document.querySelector("#zone-name");
    this.missionText = document.querySelector("#mission-text");
    this.instructionText = document.querySelector("#instruction-text");
    this.codexList = document.querySelector("#codex-list");
    this.activeSession = document.querySelector("#active-session");
    this.sessionList = document.querySelector("#session-list");

    this.state.subscribe((snapshot) => this.render(snapshot));
  }

  render(snapshot) {
    this.zoneName.textContent = snapshot.zoneName;
    this.missionText.textContent = snapshot.missionText;
    this.instructionText.textContent = snapshot.instructionText;
    this.activeSession.textContent = snapshot.activeSessionName
      ? `Active: ${snapshot.activeSessionName}`
      : "Active: bridge";

    this.codexList.replaceChildren(
      ...snapshot.commands.map((command) => {
        const item = document.createElement("li");
        const unlocked = snapshot.unlockedCommands.includes(command.id);
        item.className = `codex-item ${unlocked ? "unlocked" : "locked"}`;
        item.textContent = unlocked ? command.label : "???";
        item.title = unlocked ? command.summary : "Collect this command in play.";
        return item;
      }),
    );

    this.sessionList.replaceChildren(
      ...snapshot.sessions.map((session) => {
        const item = document.createElement("li");
        item.className = "session-item";
        item.textContent = `${session.name} ${session.attached ? "(attached)" : "(detached)"}`;
        return item;
      }),
    );

    this.terminalRoot.classList.toggle("hidden", !snapshot.terminalOpen);
    this.dialogueRoot.classList.toggle("hidden", !snapshot.dialogueOpen);

    if (snapshot.toast) {
      this.showToast(snapshot.toast);
    }
  }

  showDialogue(lines, onComplete) {
    let index = 0;
    const advance = () => {
      index += 1;

      if (index >= lines.length) {
        this.hideDialogue();
        onComplete?.();
        return;
      }

      this.#renderDialogueCard(lines[index], { onAdvance: advance });
    };

    this.state.setDialogueOpen(true);
    this.#renderDialogueCard(lines[index], { onAdvance: advance });
  }

  hideDialogue() {
    this.dialogueRoot.replaceChildren();
    this.state.setDialogueOpen(false);
    delete this.dialogueRoot.dataset.speaker;
    delete this.dialogueRoot.dataset.text;
  }

  showToast(message) {
    window.clearTimeout(this.toastTimer);
    const pill = document.createElement("div");
    pill.className = "toast";
    pill.textContent = message;
    this.toastRoot.replaceChildren(pill);
    this.toastTimer = window.setTimeout(() => {
      this.toastRoot.replaceChildren();
      this.state.clearToast();
    }, 2400);
  }

  #renderDialogueCard(line, { onAdvance }) {
    const card = document.createElement("article");
    card.className = "dialogue-card";

    const speaker = document.createElement("h3");
    speaker.className = "dialogue-speaker";
    speaker.textContent = line.speaker;

    const text = document.createElement("p");
    text.className = "dialogue-text";
    text.textContent = line.text;

    const actions = document.createElement("div");
    actions.className = "dialogue-actions";

    const button = document.createElement("button");
    button.className = "dialogue-button";
    button.type = "button";
    button.textContent = "Continue";
    button.addEventListener("click", onAdvance);

    const hint = document.createElement("p");
    hint.className = "dialogue-hint";
    hint.textContent = "Use the button to move through the lesson dialogue.";

    actions.append(button, hint);
    card.append(speaker, text, actions);
    this.dialogueRoot.replaceChildren(card);
    this.dialogueRoot.dataset.speaker = line.speaker;
    this.dialogueRoot.dataset.text = line.text;
    button.focus();
  }
}

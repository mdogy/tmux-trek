export class UIController {
  constructor({
    state,
    terminalRoot,
    dialogueRoot,
    reviewRoot,
    completionRoot,
    toastRoot,
    onOpenReview,
    onReviewPrevious,
    onReviewNext,
    onReviewFlip,
    onReviewClose,
    onReviewRate,
    onReviewSelectChoice,
    onReviewSubmitGate,
    onReviewRetryGate,
    onCompletionAcknowledge,
  }) {
    this.state = state;
    this.terminalRoot = terminalRoot;
    this.dialogueRoot = dialogueRoot;
    this.reviewRoot = reviewRoot;
    this.completionRoot = completionRoot;
    this.toastRoot = toastRoot;
    this.onOpenReview = onOpenReview;
    this.onReviewPrevious = onReviewPrevious;
    this.onReviewNext = onReviewNext;
    this.onReviewFlip = onReviewFlip;
    this.onReviewClose = onReviewClose;
    this.onReviewRate = onReviewRate;
    this.onReviewSelectChoice = onReviewSelectChoice;
    this.onReviewSubmitGate = onReviewSubmitGate;
    this.onReviewRetryGate = onReviewRetryGate;
    this.onCompletionAcknowledge = onCompletionAcknowledge;
    this.toastTimer = null;

    this.zoneName = document.querySelector("#zone-name");
    this.missionText = document.querySelector("#mission-text");
    this.instructionText = document.querySelector("#instruction-text");
    this.codexList = document.querySelector("#codex-list");
    this.activeSession = document.querySelector("#active-session");
    this.sessionList = document.querySelector("#session-list");
    this.scoreTotal = document.querySelector("#score-total");
    this.progressText = document.querySelector("#progress-text");
    this.reviewButton = document.querySelector("#review-button");

    this.reviewButton?.addEventListener("click", () => this.onOpenReview?.());

    this.state.subscribe((snapshot) => this.render(snapshot));
  }

  render(snapshot) {
    this.zoneName.textContent = snapshot.zoneName;
    this.missionText.textContent = snapshot.missionText;
    this.instructionText.textContent = snapshot.instructionText;
    if (snapshot.activeSessionName) {
      const session = snapshot.sessions.find((s) => s.name === snapshot.activeSessionName);
      const winCount = session?.windows.length ?? 0;
      const activeWin = session?.windows.find((w) => w.id === snapshot.activeWindowId);
      const paneCount = activeWin?.panes?.length ?? 0;
      this.activeSession.textContent = `Active: ${snapshot.activeSessionName}  ${winCount}w / ${paneCount}p`;
    } else {
      this.activeSession.textContent = "Active: bridge";
    }

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
        const winCount = session.windows?.length ?? 0;
        item.textContent = `${session.name} ${session.attached ? "(attached)" : "(detached)"}  ${winCount}w`;
        return item;
      }),
    );

    this.scoreTotal.textContent = `Score: ${snapshot.score.total}`;
    this.progressText.textContent = snapshot.progress.totalObjectives
      ? `${snapshot.progress.currentActTitle}: ${snapshot.progress.completedObjectives}/${snapshot.progress.totalObjectives} objectives, ${snapshot.progress.completedActs}/${snapshot.progress.totalActs} acts complete`
      : "Awaiting mission telemetry.";
    if (this.reviewButton) {
      this.reviewButton.disabled = snapshot.unlockedCommands.length === 0;
    }

    this.terminalRoot.classList.toggle("hidden", !snapshot.terminalOpen);
    this.dialogueRoot.classList.toggle("hidden", !snapshot.dialogueOpen);
    this.reviewRoot.classList.toggle("hidden", !snapshot.reviewOverlay);
    this.completionRoot.classList.toggle("hidden", !snapshot.completionOverlay);

    if (snapshot.reviewOverlay) {
      if (snapshot.reviewOverlay.mode === "gate") {
        this.#renderReviewGateOverlay(snapshot.reviewOverlay);
      } else {
        this.#renderReviewOverlay(snapshot.reviewOverlay);
      }
    } else {
      this.reviewRoot.replaceChildren();
      delete this.reviewRoot.dataset.reviewMode;
      delete this.reviewRoot.dataset.reviewCard;
      delete this.reviewRoot.dataset.reviewAct;
      delete this.reviewRoot.dataset.reviewQuestion;
    }

    if (snapshot.completionOverlay) {
      this.#renderCompletionOverlay(snapshot.completionOverlay);
    } else {
      this.completionRoot.replaceChildren();
      delete this.completionRoot.dataset.actComplete;
    }

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

  #renderCompletionOverlay(summary) {
    const card = document.createElement("article");
    card.className = "completion-card";

    const title = document.createElement("h3");
    title.className = "completion-title";
    title.textContent = summary.title;

    const stats = document.createElement("p");
    stats.className = "completion-stats";
    stats.textContent = `Act score ${summary.score}  Time ${summary.elapsedLabel}`;

    const next = document.createElement("p");
    next.className = "completion-next";
    next.textContent = summary.nextStep;

    const button = document.createElement("button");
    button.className = "dialogue-button";
    button.type = "button";
    button.textContent = summary.buttonLabel ?? "Acknowledge";
    button.addEventListener("click", () => this.onCompletionAcknowledge?.());

    card.append(title, stats, next, button);
    this.completionRoot.replaceChildren(card);
    this.completionRoot.dataset.actComplete = "true";
    button.focus();
  }

  #renderReviewOverlay(overlay) {
    const currentCard = overlay.cards[overlay.currentIndex];
    if (!currentCard) {
      this.state.hideReviewOverlay();
      return;
    }

    const card = document.createElement("article");
    card.className = "review-card";

    const heading = document.createElement("h3");
    heading.className = "completion-title";
    heading.textContent = `${overlay.title}  ${overlay.currentIndex + 1}/${overlay.cards.length}`;

    const label = document.createElement("p");
    label.className = "panel-label";
    label.textContent = currentCard.label;

    const body = document.createElement("p");
    body.className = "dialogue-text";
    body.textContent = overlay.showAnswer ? currentCard.answer : currentCard.prompt;

    const explanation = document.createElement("p");
    explanation.className = "completion-next";
    explanation.textContent = overlay.showAnswer
      ? currentCard.explanation
      : "Flip the card when you want the command and explanation.";

    const stats = document.createElement("p");
    stats.className = "review-stats";
    stats.textContent = `Got it ${currentCard.stats.gotItCount}  Review again ${currentCard.stats.reviewAgainCount}`;

    const actions = document.createElement("div");
    actions.className = "review-actions";

    const previous = this.#reviewButton("Previous", () => this.onReviewPrevious?.());
    previous.disabled = overlay.currentIndex === 0;
    const flip = this.#reviewButton(
      overlay.showAnswer ? "Hide Answer" : "Flip Card",
      () => this.onReviewFlip?.(),
    );
    const next = this.#reviewButton("Next", () => this.onReviewNext?.());
    next.disabled = overlay.currentIndex >= overlay.cards.length - 1;
    const gotIt = this.#reviewButton("Got It", () =>
      this.onReviewRate?.(currentCard.id, "got-it")
    );
    gotIt.disabled = !overlay.showAnswer;
    const reviewAgain = this.#reviewButton("Review Again", () =>
      this.onReviewRate?.(currentCard.id, "review-again")
    );
    reviewAgain.disabled = !overlay.showAnswer;
    const close = this.#reviewButton("Close", () => this.onReviewClose?.());

    actions.append(previous, flip, next, gotIt, reviewAgain, close);
    card.append(heading, label, body, explanation, stats, actions);
    this.reviewRoot.replaceChildren(card);
    this.reviewRoot.dataset.reviewMode = "flashcards";
    this.reviewRoot.dataset.reviewCard = currentCard.id;
    flip.focus();
  }

  #renderReviewGateOverlay(overlay) {
    const question = overlay.questions[overlay.currentIndex];
    if (!question) {
      this.state.hideReviewOverlay();
      return;
    }

    const card = document.createElement("article");
    card.className = "review-card";

    const heading = document.createElement("h3");
    heading.className = "completion-title";
    heading.textContent = `${overlay.title}  ${overlay.currentIndex + 1}/${overlay.questions.length}`;

    const prompt = document.createElement("p");
    prompt.className = "dialogue-text";
    prompt.textContent = question.prompt;

    const actions = document.createElement("div");
    actions.className = "review-choice-list";

    for (const choice of question.choices) {
      const button = this.#reviewButton(choice.text, () =>
        this.onReviewSelectChoice?.(question.id, choice.id)
      );
      const selected = overlay.answers?.[question.id] === choice.id;
      button.classList.toggle("selected", selected);
      button.disabled = Boolean(overlay.result);
      actions.appendChild(button);
    }

    const footer = document.createElement("div");
    footer.className = "review-actions";

    const previous = this.#reviewButton("Previous", () =>
      this.onReviewPrevious?.()
    );
    previous.disabled = overlay.currentIndex === 0 || Boolean(overlay.result);
    const next = this.#reviewButton("Next", () => this.onReviewNext?.());
    next.disabled =
      overlay.currentIndex >= overlay.questions.length - 1 || Boolean(overlay.result);
    footer.append(previous, next);

    if (overlay.result) {
      const result = document.createElement("p");
      result.className = "completion-next";
      result.textContent = overlay.result.passed
        ? `HELIX certifies you at ${overlay.result.scorePercent}%. ${overlay.result.nextStep}`
        : `Score ${overlay.result.scorePercent}% — need ${overlay.result.passPercent}% to pass. ${overlay.result.nextStep}`;

      const primary = this.#reviewButton(
        overlay.result.passed ? "Close" : "Retry",
        () =>
          overlay.result.passed
            ? this.onReviewClose?.()
            : this.onReviewRetryGate?.(),
      );
      footer.append(primary);

      if (!overlay.result.passed) {
        footer.append(
          this.#reviewButton("Review Flash Cards", () => this.onOpenReview?.()),
        );
      }

      card.append(heading, prompt, actions, result, footer);
    } else {
      const submit = this.#reviewButton("Submit Check", () =>
        this.onReviewSubmitGate?.()
      );
      footer.append(submit, this.#reviewButton("Close", () => this.onReviewClose?.()));
      card.append(heading, prompt, actions, footer);
    }

    this.reviewRoot.replaceChildren(card);
    this.reviewRoot.dataset.reviewMode = "gate";
    this.reviewRoot.dataset.reviewAct = overlay.actId;
    this.reviewRoot.dataset.reviewQuestion = question.id;
    delete this.reviewRoot.dataset.reviewCard;
    card.querySelector("button")?.focus();
  }

  #reviewButton(text, onClick) {
    const button = document.createElement("button");
    button.className = "review-button";
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }
}

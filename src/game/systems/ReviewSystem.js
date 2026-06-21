export class ReviewSystem {
  constructor(questionBanks = []) {
    this.questionBanks = new Map(
      questionBanks.map((bank) => [bank.actId, structuredClone(bank)]),
    );
    this.passedGates = new Set();
    this.flashCards = {};
    this.gateAttempts = {};
  }

  buildFlashCards(commands, unlockedCommands = []) {
    const unlocked = new Set(unlockedCommands);

    return commands
      .filter((command) => unlocked.has(command.id))
      .map((command) => {
        const stats = this.flashCards[command.id] ?? {
          gotItCount: 0,
          reviewAgainCount: 0,
          lastRating: null,
        };

        return {
          id: command.id,
          label: command.label,
          prompt: command.storyPrompt ?? command.summary,
          answer: command.label,
          explanation: command.explanation ?? command.summary,
          stats,
        };
      });
  }

  rateFlashCard(cardId, rating) {
    if (!cardId || !["got-it", "review-again"].includes(rating)) {
      return null;
    }

    const current = this.flashCards[cardId] ?? {
      gotItCount: 0,
      reviewAgainCount: 0,
      lastRating: null,
    };
    const next = {
      gotItCount: current.gotItCount + (rating === "got-it" ? 1 : 0),
      reviewAgainCount:
        current.reviewAgainCount + (rating === "review-again" ? 1 : 0),
      lastRating: rating,
    };

    this.flashCards[cardId] = next;
    return structuredClone(next);
  }

  getQuestionBank(actId) {
    const bank = this.questionBanks.get(actId);
    return bank ? structuredClone(bank) : null;
  }

  gradeGate(actId, answers = {}) {
    const bank = this.questionBanks.get(actId);
    if (!bank) {
      throw new Error(`unknown review gate: ${actId}`);
    }

    const results = bank.questions.map((question) => {
      const selectedChoiceId = answers[question.id] ?? null;
      const correct = selectedChoiceId === question.correctChoiceId;

      return {
        questionId: question.id,
        selectedChoiceId,
        correctChoiceId: question.correctChoiceId,
        correct,
      };
    });

    const correctCount = results.filter((result) => result.correct).length;
    const total = bank.questions.length;
    const scorePercent = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    const passed = scorePercent >= (bank.passPercent ?? 70);
    const attempt = {
      scorePercent,
      correctCount,
      total,
      passed,
      completedAt: Date.now(),
    };

    this.gateAttempts[actId] = [...(this.gateAttempts[actId] ?? []), attempt];
    if (passed) {
      this.passedGates.add(actId);
    }

    return {
      actId,
      title: bank.title,
      passPercent: bank.passPercent ?? 70,
      scorePercent,
      correctCount,
      total,
      passed,
      results,
    };
  }

  hasPassedGate(actId) {
    return this.passedGates.has(actId);
  }

  getSnapshot() {
    return {
      passedGates: [...this.passedGates],
      flashCards: structuredClone(this.flashCards),
      gateAttempts: structuredClone(this.gateAttempts),
    };
  }

  restore(snapshot = {}) {
    this.passedGates = new Set(
      Array.isArray(snapshot.passedGates)
        ? snapshot.passedGates.filter((id) => typeof id === "string")
        : [],
    );
    this.flashCards =
      snapshot.flashCards && typeof snapshot.flashCards === "object"
        ? structuredClone(snapshot.flashCards)
        : {};
    this.gateAttempts =
      snapshot.gateAttempts && typeof snapshot.gateAttempts === "object"
        ? structuredClone(snapshot.gateAttempts)
        : {};
  }
}

import { describe, expect, it, vi } from "vitest";
import { ReviewSystem } from "../../src/game/systems/ReviewSystem.js";

const BANK = {
  actId: "act-01-sessions",
  title: "Gate",
  passPercent: 70,
  questions: [
    {
      id: "q1",
      correctChoiceId: "a",
    },
    {
      id: "q2",
      correctChoiceId: "b",
    },
    {
      id: "q3",
      correctChoiceId: "c",
    },
  ],
};

const COMMANDS = [
  {
    id: "tmux",
    label: "tmux",
    summary: "Start a session.",
    storyPrompt: "How do you open the first Rift?",
    explanation: "Use tmux.",
  },
  {
    id: "tmux ls",
    label: "tmux ls",
    summary: "List sessions.",
    storyPrompt: "How do you list them?",
    explanation: "Use tmux ls.",
  },
];

describe("ReviewSystem", () => {
  it("builds flash cards only for unlocked commands", () => {
    const review = new ReviewSystem([BANK]);

    expect(review.buildFlashCards(COMMANDS, ["tmux"])).toEqual([
      expect.objectContaining({
        id: "tmux",
        prompt: "How do you open the first Rift?",
        answer: "tmux",
      }),
    ]);
  });

  it("records flash card ratings in persistent stats", () => {
    const review = new ReviewSystem([BANK]);

    review.rateFlashCard("tmux", "got-it");
    review.rateFlashCard("tmux", "review-again");

    expect(review.getSnapshot().flashCards.tmux).toEqual({
      gotItCount: 1,
      reviewAgainCount: 1,
      lastRating: "review-again",
    });
  });

  it("grades gates and records a passed gate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00Z"));

    const review = new ReviewSystem([BANK]);
    const result = review.gradeGate("act-01-sessions", {
      q1: "a",
      q2: "b",
      q3: "x",
    });

    expect(result).toMatchObject({
      scorePercent: 67,
      correctCount: 2,
      total: 3,
      passed: false,
    });
    expect(review.hasPassedGate("act-01-sessions")).toBe(false);

    const passed = review.gradeGate("act-01-sessions", {
      q1: "a",
      q2: "b",
      q3: "c",
    });

    expect(passed.passed).toBe(true);
    expect(review.hasPassedGate("act-01-sessions")).toBe(true);
    expect(review.getSnapshot().gateAttempts["act-01-sessions"]).toHaveLength(2);

    vi.useRealTimers();
  });

  it("restores prior review progress", () => {
    const review = new ReviewSystem([BANK]);
    review.restore({
      passedGates: ["act-01-sessions"],
      flashCards: {
        tmux: { gotItCount: 2, reviewAgainCount: 0, lastRating: "got-it" },
      },
      gateAttempts: {
        "act-01-sessions": [{ scorePercent: 100, passed: true }],
      },
    });

    expect(review.hasPassedGate("act-01-sessions")).toBe(true);
    expect(review.buildFlashCards(COMMANDS, ["tmux"])[0].stats.gotItCount).toBe(2);
  });
});

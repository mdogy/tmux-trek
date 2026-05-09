import { Before, Given, Then, When } from "@cucumber/cucumber";
import { expect } from "vitest";
import { TmuxEngine } from "../../src/engine/TmuxEngine.js";

let engine;
let lastResult;

Before(() => {
  engine = new TmuxEngine();
  lastResult = null;
});

Given("the tmux engine is reset", () => {
  engine.reset();
});

When("the player enters {string}", (command) => {
  lastResult = engine.execute(command);
});

When("the player uses the keybinding {string}", (key) => {
  lastResult = engine.handleKeybinding(key);
});

Then("no session should be active", () => {
  expect(engine.getStatus().activeSessionName).toBeNull();
});

Then("the output should mention {string}", (text) => {
  expect(lastResult.output.join("\n")).toContain(text);
});

Then("the active session should be {string}", (name) => {
  expect(engine.getStatus().activeSessionName).toBe(name);
});

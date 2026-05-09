export class BashEmulator {
  async execute(command) {
    return {
      stdout: "",
      stderr: `not implemented: ${command}`,
      exitCode: 1,
    };
  }
}

export default {
  default: {
    import: ["tests/step-definitions/**/*.steps.js"],
    paths: ["features/**/*.feature"],
    publishQuiet: true,
    format: ["progress-bar"],
  },
};

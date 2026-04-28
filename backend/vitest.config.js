/** @type {import("vitest/config").UserConfig} */
module.exports = {
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    globals: true,
    pool: "threads",
  },
};

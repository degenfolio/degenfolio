import {
  expect,
  testLogger,
} from "./testUtils";

const log = testLogger.child({
  // level: "debug",
  module: "TestAave",
});

describe("Aave", () => {
  it("should handle a deposit", async () => {
    log.info(`Will it work?`);
    expect("ok").to.be.ok;
  });
});

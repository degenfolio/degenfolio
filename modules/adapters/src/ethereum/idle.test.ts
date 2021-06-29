import {
  parseEthTx,
  expect,
  testLogger,
} from "../testUtils";

import { idleSource } from "./idle";

const logger = testLogger.child({ module: `Test${idleSource}`,
  level: "debug", // Uncomment to enable verbose logging
});

describe(idleSource, () => {
  it("should handle deposits to idle DAI", async () => {
    const tx = await parseEthTx({
      selfAddress: "0x2b4d4a660cddae942c26821a5512c32023719476",
      hash: "0xbf0ddcf082109eb0431e2d244c7d27eb1b3ae653411ba35f4288979e63a8dfb0",
      logger,
    });
    expect(tx.sources).to.include(idleSource);
  });
});

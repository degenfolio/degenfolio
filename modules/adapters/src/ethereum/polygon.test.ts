import {
  parseEthTx,
  expect,
  testLogger,
} from "../testUtils";

import { polygonSource } from "./polygon";

const logger = testLogger.child({ module: `Test${polygonSource}`,
  level: "debug", // Uncomment to enable verbose logging
});

describe(polygonSource, () => {

  it("should handle deposits to polygon", async () => {
    const tx = await parseEthTx({
      selfAddress: "0xada083a3c06ee526f827b43695f2dcff5c8c892b",
      hash: "0xafe41962f39cf25034aecd3f3278e8f7ed0b4dc60e612c10c68c8599a29dad45",
      logger,
    });
    expect(tx.sources).to.include(polygonSource);
  });

});

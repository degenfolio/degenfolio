import { TransactionSources } from "../enums";

import {
  parseEthTx,
  expect,
  testLogger,
} from "./testUtils";

const source = TransactionSources.Harmony;
const logger = testLogger.child({ module: `Test${source}`,
  level: "debug", // Uncomment to enable verbose logging
});

describe("Harmony Bridge", () => {

  it.only("should handle deposits to harmony", async () => {
    const tx = await parseEthTx({
      selfAddress: "0xb2bd8c736568b6eb67bca6f269f9761e9e813176",
      hash: "0x70ff2f47c9c57a306aca32f916235c933a53d4ea945e9070122b5a79ac7b1859",
      logger,
    });
    logger.info(tx);
    expect(tx.sources).to.include(source);
    // And expect the deposit to be handled properly
  });

});

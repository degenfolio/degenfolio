import {
  TransferCategories,
} from "@valuemachine/types";

import { aaveSource } from "./aave";
import {
  parseEthTx,
  expect,
  testLogger,
} from "./testUtils";

const { Expense, SwapIn, SwapOut } = TransferCategories;
const logger = testLogger.child({ module: `Test${aaveSource}`,
  level: "debug", // Uncomment to enable verbose logging
});

describe(aaveSource, () => {
  it("should handle deposits to v2", async () => {
    const tx = await parseEthTx({
      selfAddress: "0x7d12d0d36f8291e8f7adec4cf59df6cc01d0ab97",
      hash: "0x23219928262c3933be579182cf8b466585b84d5e249413d3c9613837d51393e0",
      logger,
    });
    expect(tx.sources).to.include(aaveSource);
    expect(tx.transfers.length).to.equal(3);
    const fee = tx.transfers[0];
    expect(fee.category).to.equal(Expense);
    const deposit = tx.transfers[1];
    expect(deposit.category).to.equal(SwapOut);
    const aToken = tx.transfers[1];
    expect(aToken.category).to.equal(SwapIn);
  });
});

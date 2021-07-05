import { TransferCategories } from "@valuemachine/types";

import { TransactionSources } from "../enums";

import {
  parseEthTx,
  expect,
  testLogger,
} from "./testUtils";

const source = TransactionSources.Harmony;
const logger = testLogger.child({ module: `Test${source}`,
  // level: "debug", // Uncomment to enable verbose logging
});

describe("Harmony Bridge", () => {

  it("should handle erc20 deposits to harmony", async () => {
    const tx = await parseEthTx({
      selfAddress: "0xb2bd8c736568b6eb67bca6f269f9761e9e813176",
      hash: "0x70ff2f47c9c57a306aca32f916235c933a53d4ea945e9070122b5a79ac7b1859",
      logger,
    });
    expect(tx.sources).to.include(source);
    expect(tx.transfers.length).to.equal(2);
    expect(tx.transfers[0].category).to.equal(TransferCategories.Expense);
    expect(tx.transfers[1].category).to.equal(TransferCategories.Deposit);
    expect(tx.transfers[1].to).to.match(/^one/);
  });

  it("should handle erc20 withdraws from harmony", async () => {
    const tx = await parseEthTx({
      selfAddress: "0xf8dead4d72d458b22b76c8b536c3e7b22e91c0d8",
      hash: "0x61e72e6a3971cdb7baa5f995293b78830232db7353bcd0c30b98e645d4e6436a",
      logger,
    });
    expect(tx.sources).to.include(source);
    expect(tx.transfers.length).to.equal(1);
    expect(tx.transfers[0].category).to.equal(TransferCategories.Withdraw);
    expect(tx.transfers[0].from).to.match(/^one/);
  });

});

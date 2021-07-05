import { ChainData } from "@valuemachine/types";
import { getTransactionsError } from "@valuemachine/utils";

import { Guards } from "../enums";

import { getHarmonyData } from "./harmonyData";
import {
  expect,
  getTestAddressBook,
  testStore,
  testLogger,
  parseHarmonyTx,
} from "./testUtils";

const logger = testLogger.child({ module: `TestHarmony`,
  level: "debug", // Uncomment to enable verbose logging
});

describe("Harmony Data", () => {
  let harmonyData: ChainData;
  const testAddress = "one1z6n67znt38cpuxlufrs6cmarc4pmvgslaghfrh";
  const addressBook = getTestAddressBook(testAddress);
  beforeEach(() => {
    harmonyData = getHarmonyData({
      store: testStore,
      logger,
    });
  });

  it("should sync & parse a transaction", async () => {
    const tx = await parseHarmonyTx({
      selfAddress: testAddress,
      hash: "0xbab506616a52f8c80a5f8aa4976dcb91528e67c596b480cb4725d299b3219ee2",
      logger,
    });
    logger.info(tx, `Got harmony transaction`);
    expect(tx).to.be.ok;
    expect(tx.sources).to.include(Guards.ONE);
    expect(getTransactionsError([tx])).to.be.null;
  });

  it("should sync & parse an address book", async () => {
    await harmonyData.syncAddressBook(addressBook);
    const transactions = harmonyData.getTransactions(addressBook);
    expect(transactions[0].sources).to.include(Guards.ONE);
    expect(getTransactionsError(transactions)).to.be.null;
  });

});


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

describe.only("Harmony Data", () => {
  let harmonyData: ChainData;
  const testAddress = "0xada083a3c06ee526F827b43695F2DcFf5C8C892B";
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
      hash: "0xecd2d68981ed77625828d6f588babe6633fcb5968b10332bbfdc0aa74b13f5c8",
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


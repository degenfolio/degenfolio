import { HashZero } from "@ethersproject/constants";
import { ChainData } from "@valuemachine/types";

import {
  expect,
  getTestAddressBook,
  testLogger,
} from "../testUtils";

import { getPolygonData } from "./polygonData";

const logger = testLogger.child({ module: `TestPolygon`,
  level: "debug", // Uncomment to enable verbose logging
});

describe("Polygon", () => {
  let polygonData: ChainData;
  // const testAddress1 = "0x1057Bea69c9ADD11c6e3dE296866AFf98366CFE3";
  const addressBook = getTestAddressBook("0xada083a3c06ee526F827b43695F2DcFf5C8C892B");

  beforeEach(() => {
    polygonData = getPolygonData({
      covalentKey: process.env.covalentKey,
      logger,
    });
  });

  it("should create a polygon data manager", async () => {
    expect(polygonData).to.be.ok;
  });

  it.skip("should sync a transaction", async () => {
    await polygonData.syncTransaction(HashZero);
  });

  it.skip("should parse a transaction", async () => {
    polygonData.getTransaction(HashZero);
  });

  it.skip("should sync an address book", async () => {
    await polygonData.syncAddressBook(addressBook);
  });

  it.skip("should parse an address book", async () => {
    polygonData.getTransactions(addressBook);
  });

});

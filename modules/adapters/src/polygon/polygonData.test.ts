import { ChainData } from "@valuemachine/types";

import {
  env,
  expect,
  getTestAddressBook,
  testStore,
  testLogger,
} from "../testUtils";

import { getPolygonData } from "./polygonData";

const logger = testLogger.child({ module: `TestPolygon`,
  // level: "debug", // Uncomment to enable verbose logging
});

describe("Polygon Data", () => {
  let polygonData: ChainData;
  // const testAddress1 = "0x1057Bea69c9ADD11c6e3dE296866AFf98366CFE3";
  const testAddress = "0xada083a3c06ee526F827b43695F2DcFf5C8C892B";
  const testHash = "0x292ec1392e758f33e77bd077334b413e5337f86698e99396befc123f8579f9fa";
  const addressBook = getTestAddressBook(testAddress);
  beforeEach(() => {
    polygonData = getPolygonData({
      covalentKey: env.covalentKey,
      store: testStore,
      logger,
    });
  });

  it("should create a polygon data manager", async () => {
    expect(polygonData).to.be.ok;
  });

  it("should sync & parse a transaction", async () => {
    await polygonData.syncTransaction(testHash);
    polygonData.getTransaction(testHash, addressBook);
  });

  it("should sync & parse an address book", async () => {
    await polygonData.syncAddressBook(addressBook);
    polygonData.getTransactions(addressBook);
  });

});

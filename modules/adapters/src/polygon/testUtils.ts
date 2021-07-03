import {
  Address,
  Bytes32,
  Logger,
  Transaction,
} from "@valuemachine/types";

import { env, getTestAddressBook, testStore } from "../testUtils";

import { getPolygonData } from "./polygonData";

export * from "../testUtils";

export const parsePolygonTx = async ({
  hash,
  selfAddress,
  logger,
}: {
  hash: Bytes32;
  selfAddress: Address;
  logger?: Logger;
}): Promise<Transaction> => {
  const addressBook = getTestAddressBook(selfAddress);
  const polygonData = getPolygonData({
    covalentKey: env.covalentKey,
    logger,
    store: testStore,
  });
  await polygonData.syncTransaction(hash);
  return polygonData.getTransaction(hash, addressBook);
};

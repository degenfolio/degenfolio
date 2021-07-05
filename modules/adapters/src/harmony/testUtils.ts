import {
  Address,
  Bytes32,
  Logger,
  Transaction,
} from "@valuemachine/types";

import { getTestAddressBook, testStore } from "../testUtils";

import { getHarmonyData } from "./harmonyData";

export * from "../testUtils";

export const parseHarmonyTx = async ({
  hash,
  selfAddress,
  logger,
}: {
  hash: Bytes32;
  selfAddress: Address;
  logger?: Logger;
}): Promise<Transaction> => {
  const addressBook = getTestAddressBook(selfAddress);
  const harmonyData = getHarmonyData({
    // apiKey: env.apiKey, // maybe?
    logger,
    store: testStore,
  });
  await harmonyData.syncTransaction(hash);
  return harmonyData.getTransaction(hash, addressBook);
};

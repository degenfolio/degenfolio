import fs from "fs";
import path from "path";

import { AddressZero } from "@ethersproject/constants";
import {
  Address,
  AddressBook,
  AddressCategories,
  Bytes32,
  EthCall,
  Logger,
  Transaction,
} from "@valuemachine/types";
import {
  getEmptyChainData,
  getFileStore,
  getLogger,
} from "@valuemachine/utils";
import { getAddressBook, getChainData } from "valuemachine";
import { use } from "chai";
import promised from "chai-as-promised";

import { appAddresses, appParsers } from ".";

use(promised);

export { expect } from "chai";

export const env = {
  logLevel: process.env.LOG_LEVEL || "error",
  etherscanKey: process.env.ETHERSCAN_KEY || "",
  covalentKey: process.env.COVALENT_KEY || "",
};

export const testStore = getFileStore(path.join(__dirname, "./testData"), fs);

export const testLogger = getLogger(env.logLevel).child({ module: "TestUtils" });

export const getTestAddressBook = (address: Address): AddressBook => getAddressBook({
  json: [
    { address, name: "test-self", category: AddressCategories.Self },
  ],
  hardcoded: appAddresses,
  logger: testLogger
});

export const parseEthTx = async ({
  hash,
  selfAddress,
  calls,
  logger,
}: {
  hash: Bytes32;
  selfAddress: Address;
  calls?: EthCall[];
  logger?: Logger;
}): Promise<Transaction> => {
  const addressBook = getTestAddressBook(selfAddress);
  const chainData = getChainData({
    json: {
      ...getEmptyChainData(),
      calls: !calls ? [] : calls.map(call => ({
        block: 1,
        from: AddressZero,
        timestamp: "2000-01-01T01:00:00.000Z",
        to: AddressZero,
        value: "0.1",
        ...call,
        hash
      })),
    },
    logger,
    store: testStore,
  });
  await chainData.syncTransaction(hash, env.etherscanKey);
  return chainData.getTransaction(hash, addressBook, appParsers);
};

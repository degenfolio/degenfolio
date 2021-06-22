import fs from "fs";
import path from "path";

import { AddressZero } from "@ethersproject/constants";
import {
  Address,
  AddressCategories,
  Bytes32,
  emptyChainData,
  EthCall,
  Logger,
  Transaction,
} from "@valuemachine/types";
import { getFileStore, getLogger } from "@valuemachine/utils";
import { getAddressBook, getChainData } from "valuemachine";
import { use } from "chai";
import promised from "chai-as-promised";

use(promised);

export { expect } from "chai";

export const env = {
  logLevel: process.env.LOG_LEVEL || "error",
  etherscanKey: process.env.ETHERSCAN_KEY || "",
};

export const testLogger = getLogger(env.logLevel).child({ module: "TestUtils" });

export const parseEthTx = async ({
  hash,
  selfAddress,
  calls,
  logger,
  storePath,
}: {
  hash: Bytes32;
  selfAddress: Address;
  calls?: EthCall[];
  logger?: Logger;
  storePath: string;
}): Promise<Transaction> => {
  const addressBook = getAddressBook({
    json: [{ address: selfAddress, name: "test-self", category: AddressCategories.Self }],
    logger: testLogger,
  });
  const testStore = getFileStore(path.join(__dirname, storePath || "./testData"), fs);
  const chainData = getChainData({
    json: {
      ...emptyChainData,
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
  return chainData.getTransaction(hash, addressBook);
};

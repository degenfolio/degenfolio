import { AddressZero } from "@ethersproject/constants";
import {
  Address,
  Bytes32,
  EthCall,
  Logger,
  Transaction,
} from "@valuemachine/types";
import {
  getEmptyChainData,
} from "@valuemachine/utils";
import { getChainData } from "valuemachine";

import { env, getTestAddressBook, testStore } from "../testUtils";

import { ethParsers } from ".";

export * from "../testUtils";

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
  return chainData.getTransaction(hash, addressBook, ethParsers);
};

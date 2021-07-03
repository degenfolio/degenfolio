import fs from "fs";
import path from "path";

import {
  Address,
  AddressBook,
  AddressCategories,
} from "@valuemachine/types";
import {
  getFileStore,
  getLogger,
} from "@valuemachine/utils";
import { getAddressBook } from "valuemachine";
import { use } from "chai";
import promised from "chai-as-promised";

import { appAddresses } from ".";

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

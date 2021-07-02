import {
  AddressBook,
  AddressCategories,
  EthTransaction,
  Logger,
  Transaction,
} from "@valuemachine/types";
import {
  setAddressCategory,
} from "@valuemachine/utils";

export const polygonSource = "Polygon";

export const polygonAddresses = [
].map(setAddressCategory(AddressCategories.ERC20));

export const polygonParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: polygonSource });
  log.info(`Let's parse ${polygonSource}`);

  for (const ethTxLog of ethTx.logs) {
    const address = ethTxLog.address;
    if (polygonAddresses.map(e => e.address).includes(address)) {
      const asset = addressBook.getName(address);
      log.info(`Checking for polyon interactions in ${address} aka ${asset}`);
    }
  }

  return tx;
};


import { toBech32 } from "@harmony-js/crypto";
import {
  AddressBook,
  AddressCategories,
  EthTransaction,
  Logger,
  Transaction,
  TransferCategories,
} from "@valuemachine/types";
import {
  rmDups,
  setAddressCategory,
} from "@valuemachine/utils";

import { TransactionSources } from "../enums";

const source = TransactionSources.Harmony;

////////////////////////////////////////
/// Addresses

const OneERC20Bridge = "OneERC20Bridge";

const bridgeAddresses = [
  { name: OneERC20Bridge, address: "0x2dccdb493827e15a5dc8f8b72147e6c4a5620857" },
].map(setAddressCategory(AddressCategories.Defi));

export const harmonyAddresses = [
  ...bridgeAddresses,
];

/* where can we find this?
const erc20BridgeInterface = new Interface([
]);
*/

export const harmonyParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  _addressBook: AddressBook,
  _logger: Logger,
): Transaction => {

  tx.transfers.forEach(transfer => {
    if (bridgeAddresses.some(e => e.address === transfer.from)) {
      tx.sources = rmDups([source, ...tx.sources]);
      transfer.category = TransferCategories.Withdraw;
      transfer.from = toBech32(transfer.to);
      tx.method = source;
    }

    if (bridgeAddresses.some(e => e.address === transfer.to)) {
      tx.sources = rmDups([source, ...tx.sources]);
      transfer.category = TransferCategories.Deposit;
      transfer.to = toBech32(transfer.from);
      tx.method = source;
    }
  });

  for (const txLog of ethTx.logs) {
    const address = txLog.address;
    if (harmonyAddresses.map(e => e.address).includes(address)) {
      tx.sources = rmDups([source, ...tx.sources]);
    }
  }

  // log.debug(tx, `parsed harmony tx`);
  return tx;
};

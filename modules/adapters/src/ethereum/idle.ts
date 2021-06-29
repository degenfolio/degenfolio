import {
  AddressBook,
  AddressCategories,
  EthTransaction,
  Logger,
  Transaction,
  TransactionSource,
} from "@valuemachine/types";
import {
  rmDups,
  setAddressCategory,
} from "@valuemachine/utils";

export const idleSource = "Idle";

const govAddresses = [
  { name: "IDLE", address: "0x875773784Af8135eA0ef43b5a374AaD105c5D39e" },
].map(setAddressCategory(AddressCategories.ERC20));

const marketAddresses = [
  { name: "idleDAI", address: "0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1" },
].map(setAddressCategory(AddressCategories.ERC20));

export const idleAddresses = [
  ...govAddresses,
  ...marketAddresses,
];

////////////////////////////////////////
/// Parser

export const idleParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  _addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: idleSource });

  log.info(`Parser activated`);

  if (idleAddresses.some(entry => ethTx.from === entry.address)) {
    tx.sources = rmDups([idleSource, ...tx.sources]) as TransactionSource[];
  }

  return tx;
};

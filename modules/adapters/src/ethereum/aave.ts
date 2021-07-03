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

import { Assets } from "../assets";

export const aaveSource = "Aave";

const { AAVE, stkAAVE, aWETH, aDAI, aAAVE, aBAT } = Assets;

const govAddresses = [
  { name: AAVE, address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9" },
  { name: stkAAVE, address: "0x4da27a545c0c5b758a6ba100e3a049001de870f5" },
].map(setAddressCategory(AddressCategories.ERC20));

const coreAddresses = [
  { name: "LendingPool", address: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9" },
].map(setAddressCategory(AddressCategories.Defi));

// https://docs.aave.com/developers/deployed-contracts/deployed-contracts
const marketAddresses = [
  { name: aWETH, address: "0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04" },
  { name: aDAI, address: "0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d" },
  { name: aDAI, address: "0x028171bca77440897b824ca71d1c56cac55b68a3" },
  { name: aAAVE, address: "0xffc97d72e13e01096502cb8eb52dee56f74dad7b" },
  { name: aBAT, address: "0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1" },
].map(setAddressCategory(AddressCategories.ERC20));

export const aaveAddresses = [
  ...govAddresses,
  ...coreAddresses,
  ...marketAddresses,
];

////////////////////////////////////////
/// Parser

export const aaveParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  _addressBook: AddressBook,
  _logger: Logger,
): Transaction => {
  //const log = logger.child({ module: aaveSource });
  //log.info(`Parser activated`);

  if (aaveAddresses.some(entry => ethTx.from === entry.address)) {
    tx.sources = rmDups([aaveSource, ...tx.sources]) as TransactionSource[];
  }

  // Incorporating aave adapter
  return tx;
};

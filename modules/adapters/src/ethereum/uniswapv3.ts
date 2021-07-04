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

const source = TransactionSources.Uniswap;

////////////////////////////////////////
/// Addresses

export const routerAddresses = [
  { name: "UniswapV3Router", address: "0xE592427A0AEce92De3Edee1F18E0157C05861564" },
].map(setAddressCategory(AddressCategories.Defi));

export const marketAddresses = [
  { name: "UniV3_MATIC_USDT", address: "0x972f43Bb94B76B9e2D036553d818879860b6A114" },
].map(setAddressCategory(AddressCategories.Defi));

export const uniswapAddresses = [
  ...routerAddresses,
  ...marketAddresses,
];

////////////////////////////////////////
/// Parser

export const uniswapParser = (
  tx: Transaction,
  _ethTx: EthTransaction,
  _addressBook: AddressBook,
  _logger: Logger,
): Transaction => {
  tx.transfers.forEach(transfer => {
    if (uniswapAddresses.some(e => e.address === transfer.from)) {
      transfer.category = TransferCategories.SwapIn;
      tx.method = source;
      tx.sources = rmDups([...tx.sources, source]);
    }
    if (uniswapAddresses.some(e => e.address === transfer.to)) {
      transfer.category = TransferCategories.SwapOut;
      tx.method = source;
      tx.sources = rmDups([...tx.sources, source]);
    }
  });
  return tx;
};

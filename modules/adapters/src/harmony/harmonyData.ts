import {
  Address,
  AddressBook,
  Bytes32,
  ChainData,
  ChainDataParams,
  emptyChainData,
  EthParser,
  StoreKeys,
  Transaction,
  TransactionsJson,
} from "@valuemachine/types";
import {
  getLogger,
} from "@valuemachine/utils";

export const getHarmonyData = (params?: ChainDataParams): ChainData => {
  const { json: chainDataJson, logger, store } = params || {};

  const log = (logger || getLogger()).child?.({ module: "ChainData" });
  const json = chainDataJson || store?.load(StoreKeys.ChainData) || emptyChainData;
  const save = () => store
    ? store.save(StoreKeys.ChainData, json)
    : log.warn(`No store provided, can't save chain data`);

  if (!json.addresses) json.addresses = {};
  if (!json.calls) json.calls = [];
  if (!json.transactions) json.transactions = [];

  log.info(`Loaded harmony data containing ${
    json.transactions.length
  } transactions from ${chainDataJson ? "input" : store ? "store" : "default"}`);

  /* TODO: implement
  const syncAddress = async (address: Address, key?: string): Promise<void> => {
    log.info(`address=${address}, key=${key}`);
    save();
    return;
  };
  */

  ////////////////////////////////////////
  // Exported Methods

  const syncTransaction = async (
    txHash: string,
    key?: string,
  ): Promise<void> => {
    if (!txHash) {
      throw new Error(`Cannot sync an invalid tx hash: ${txHash}`);
    }
    log.info(`txHash=${txHash}, key=${key}`);
    // TODO: implement
    save();
    return;
  };

  const syncAddressBook = async (addressBook: AddressBook, key?: string): Promise<void> => {
    log.info(`addressBook has ${addressBook.json.length} entries, key=${key}`);
    save();
    return;
  };

  const getTransactions = (
    addressBook: AddressBook,
    extraParsers?: EthParser[],
  ): TransactionsJson => {
    // TODO: implement
    log.info(`${addressBook.json.length} address entries & ${extraParsers?.length} parsers`);
    return [];
  };

  const getTransaction = (
    hash: Bytes32,
    addressBook: AddressBook,
    extraParsers?: EthParser[],
  ): Transaction => {
    // TODO: implement
    log.info(`hash=${hash}, ${addressBook.json.length} addresses, ${extraParsers?.length} parsers`);
    return {} as any;
  };

  ////////////////////////////////////////
  // One more bit of init code before returning

  return {
    getTransaction,
    getTransactions,
    json,
    syncAddressBook,
    syncTransaction,
  };
};

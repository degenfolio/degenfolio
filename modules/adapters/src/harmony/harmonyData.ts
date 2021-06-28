import {
  Address,
  AddressBook,
  Bytes32,
  ChainData,
  ChainDataParams,
  EthParser,
  StoreKeys,
  Transaction,
  TransactionsJson,
} from "@valuemachine/types";
import {
  getEmptyChainData,
  getLogger,
} from "@valuemachine/utils";
import axios from "axios";

export const getHarmonyData = (params?: ChainDataParams): ChainData => {
  const { json: chainDataJson, logger, store } = params || {};

  const log = (logger || getLogger()).child?.({ module: "ChainData" });
  const json = chainDataJson || store?.load(StoreKeys.ChainData) || getEmptyChainData();
  const save = () => store
    ? store.save(StoreKeys.ChainData, json)
    : log.warn(`No store provided, can't save chain data`);

  if (!json.addresses) json.addresses = {};
  if (!json.calls) json.calls = [];
  if (!json.transactions) json.transactions = [];

  log.info(`Loaded harmony data containing ${
    json.transactions.length
  } transactions from ${chainDataJson ? "input" : store ? "store" : "default"}`);

  ////////////////////////////////////////
  // Internal Heleprs

  // TODO: rm key param?
  const syncAddress = async (address: Address, _key?: string): Promise<void> => {
    const databc = {
      jsonrpc: "2.0",
      id: 1,
      method: "hmyv2_getTransactionsHistory",
      params: [
        {
          address, // : "one1rvaqpfukjsxz5gaqtjr8hz9mtqevr9p4gfuncs",
          pageIndex: 0,
          pageSize: 20,
          fullTx: true,
          txType: "ALL",
          order: "ASC"
        }
      ]
    };
    const response = await axios.post("https://rpc.s0.b.hmny.io", databc);
    console.log(response.data);
    // TODO: save result to json
    // save();
    return;
  };

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
    syncAddress(addressBook[0].address); // TODO: implement for real
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

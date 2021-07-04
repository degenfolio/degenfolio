import { getAddress, isAddress } from "@ethersproject/address";
import { formatEther } from "@ethersproject/units";
import {
  Address,
  AddressBook,
  Bytes32,
  ChainData,
  ChainDataParams,
  EthParser,
  StoreKeys,
  Transaction,
  TransactionsJson
} from "@valuemachine/types";
import {
  getEmptyChainData,
  getLogger,
  getEthTransactionError
} from "@valuemachine/utils";
import axios from "axios";
import { parseHarmonyTx } from "./parser";

export const getHarmonyData = (params?: ChainDataParams): ChainData => {
  const formatCovalentTx = (rawTx, TxReceipt) => ({
    block: rawTx.blockNumber,
    data: "0x", // not available?
    from: rawTx.from,
    gasLimit: rawTx.gas + 20,
    gasPrice: rawTx.gasPrice,
    gasUsed: rawTx.gas,
    hash: rawTx.hash,
    index: rawTx.transactionIndex,
    logs: TxReceipt.logs.map(evt => ({
      address: evt.address,
      index: evt.log_offset,
      topics: evt.raw_log_topics,
      data: evt.raw_log_data || "0x"
    })),
    nonce: 0, // not available?
    status: 1,
    timestamp: rawTx.timestamp,
    to: rawTx.to,
    value: formatEther(rawTx.value)
  });

  const { json: chainDataJson, logger, store } = params || {};

  const log = (logger || getLogger()).child?.({ module: "ChainData" });
  const json =
    chainDataJson || store?.load(StoreKeys.ChainData) || getEmptyChainData();
  const save = () =>
    store
      ? store.save(StoreKeys.ChainData, json)
      : log.warn(`No store provided, can't save chain data`);

  if (!json.addresses) json.addresses = {};
  if (!json.calls) json.calls = [];
  if (!json.transactions) json.transactions = [];

  log.info(
    `Loaded harmony data containing ${
      json.transactions.length
    } transactions from ${
      chainDataJson ? "input" : store ? "store" : "default"
    }`
  );

  ////////////////////////////////////////
  // Internal Heleprs

  // TODO: rm key param?
  const syncAddress = async (
    address: Address,
    _key?: string
  ): Promise<void> => {
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
    const response = await axios.post("https://api.harmony.one", databc);
    console.log(response.data);
    // TODO: save result to json
    const yesterday = Date.now() - 1000 * 60 * 60 * 24;
    if (
      new Date(json.addresses[address]?.lastUpdated || 0).getTime() > yesterday
    ) {
      log.info(`Info for address ${address} is up to date`);
      return;
    }
    let data = response.data;
    const items = data.result;
    const history = items.sort();
    json.addresses[address] = {
      lastUpdated: new Date().toISOString(),
      history
    };
    save();
    for (const txHash of history) {
      const harmonyTx = formatCovalentTx(fetchTx(txHash), fetchReceipt(txHash));
      const error = getEthTransactionError(harmonyTx);
      if (error) throw new Error(error);
      json.transactions.push(harmonyTx);
      save();
    }
    return;
  };
  const fetchTx = async (txHash: String): Promise<Transaction> => {
    const databc = {
      jsonrpc: "2.0",
      id: 1,
      method: "hmyv2_getTransactionByHash",
      params: [txHash]
    };
    const response = await axios.post("https://api.harmony.one", databc);
    console.log(response.data);
    if (response.data) logger.info("GOTIT");
    else logger.info("FAILED");
    // TODO: save result to json
    // save();
    return response.data.result;
  };
  const fetchReceipt = async (txHash: String): Promise<Transaction> => {
    const databc = {
      jsonrpc: "2.0",
      id: 1,
      method: "hmyv2_getTransactionReceipt",
      params: [txHash]
    };
    const response = await axios.post("https://api.harmony.one", databc);
    console.log(response.data.result.logs[2]);
    if (response.data) logger.info("GOTIT");
    else logger.info("FAILED");
    // TODO: save result to json
    // save();
    return response.data.result;
  };
  ////////////////////////////////////////
  // Exported Methods

  const syncTransaction = async (txHash: string): Promise<void> => {
    if (!txHash) {
      throw new Error(`Cannot sync an invalid tx hash: ${txHash}`);
    }
    logger.info("CHCEKCIN");
    const existing = json.transactions.find(
      existing => existing.hash === txHash
    );
    if (!getEthTransactionError(existing)) {
      return;
    }
    log.info(`Fetching polygon data for tx ${txHash}`);
    const harmony = await fetchTx(txHash);
    const TxReceipt = await fetchReceipt(txHash);
    const harmonyTx = formatCovalentTx(harmony, TxReceipt);
    const error = getEthTransactionError(harmonyTx);
    if (error) throw new Error(error);
    // log.debug(polygonTx, `Parsed raw polygon tx to a valid evm tx`);
    json.transactions.push(harmonyTx);
    save();
    return;
  };

  const syncAddressBook = async (
    addressBook: AddressBook,
    key?: string
  ): Promise<void> => {
    log.info(`addressBook has ${addressBook.json.length} entries, key=${key}`);
    addressBook.addresses.forEach(function(e) {
      syncAddress(e);
    }); // TODO: implement for real
    save();
    return;
  };

  const getTransactions = (
    addressBook: AddressBook,
    extraParsers?: EthParser[]
  ): TransactionsJson => {
    // TODO: implement
    log.info(
      `${addressBook.json.length} address entries & ${extraParsers?.length} parsers`
    );
    return [];
  };

  const getTransaction = (
    hash: Bytes32,
    addressBook: AddressBook,
    extraParsers?: EthParser[]
  ): Transaction =>
    parseHarmonyTx(
      json.transactions.find(tx => tx.hash === hash),
      addressBook,
      logger
    );

  ////////////////////////////////////////
  // One more bit of init code before returning

  return {
    getTransaction,
    getTransactions,
    json,
    syncAddressBook,
    syncTransaction
  };
};

import { formatEther } from "@ethersproject/units";
import { hexlify } from "@ethersproject/bytes";
import {
  Address,
  AddressBook,
  Bytes32,
  ChainData,
  ChainDataParams,
  EthParser,
  Transaction,
  TransactionsJson
} from "@valuemachine/types";
import {
  chrono,
  getEmptyChainData,
  getLogger,
  getEthTransactionError
} from "@valuemachine/utils";
import axios from "axios";

import { parseHarmonyTx } from "./parser";

const HarmonyStoreKey = "HarmonyData";

export const getHarmonyData = (params?: ChainDataParams): ChainData => {
  const { json: chainDataJson, logger, store } = params || {};
  const log = (logger || getLogger()).child?.({ module: "ChainData" });
  const json =
    chainDataJson || store?.load(HarmonyStoreKey as any) || getEmptyChainData();
  const save = () =>
    store
      ? store.save(HarmonyStoreKey as any, json)
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

  const formatHarmonyTx = (rawTx, TxReceipt) => ({
    block: rawTx.blockNumber,
    data: "0x", // not available?
    from: rawTx.from,
    gasLimit: "0x100000000000",
    gasPrice: hexlify(rawTx.gasPrice),
    gasUsed: hexlify(rawTx.gas),
    hash: rawTx.hash,
    index: rawTx.transactionIndex,
    logs: TxReceipt.logs.map(evt => ({
      address: evt.address,
      index: parseInt(evt.transactionIndex.slice(2), 16),
      topics: evt.topics,
      data: evt.data || "0x"
    })),
    nonce: rawTx.nonce, // not available?
    status: 1,
    timestamp: new Date(rawTx.timestamp).toISOString(),
    to: rawTx.to,
    value: formatEther(rawTx.value.toString())
  });

  // TODO: rm key param?
  const syncAddress = async (address: Address): Promise<void> => {
    const yesterday = Date.now() - 1000 * 60 * 60 * 24;
    if (
      new Date(json.addresses[address]?.lastUpdated || 0).getTime() > yesterday
    ) {
      log.info(`Info for address ${address} is up to date`);
      return;
    }

    log.info(address);
    const databc = {
      jsonrpc: "2.0",
      id: 1,
      method: "hmyv2_getTransactionsHistory",
      params: [
        {
          address, // : "one1rvaqpfukjsxz5gaqtjr8hz9mtqevr9p4gfuncs",
          pageIndex: 0,
          pageSize: 4,
          fullTx: false,
          txType: "ALL",
          order: "ASC"
        }
      ]
    };
    const response = await axios.post("https://api.s0.t.hmny.io", databc);
    log.info(response.data);
    // TODO: save result to json

    const data = response.data;
    log.info(data);
    const items = data.result.transactions;
    const history = items.sort();

    json.addresses[address] = {
      lastUpdated: new Date().toISOString(),
      history
    };
    save();
    log.info("sync here");
    for (const txHash of history) syncTransaction(txHash);

    return;
  };

  async function fetchTx(txHash: String): Promise<Transaction> {
    const databc = {
      jsonrpc: "2.0",
      id: 1,
      method: "hmyv2_getTransactionByHash",
      params: [txHash]
    };
    let response;
    try {
      response = await axios.post("https://api.s0.t.hmny.io", databc);
    } catch (e) {
      log.warn(`Axios error: ${e.message}`);
    }
    log.info(response.data);
    if (response.data) logger.info("GOTIT");
    else logger.info("FAILED");
    return response.data.result;
  }

  const fetchReceipt = async (txHash: String): Promise<Transaction> => {
    const databc = {
      jsonrpc: "2.0",
      id: 1,
      method: "hmyv2_getTransactionReceipt",
      params: [txHash]
    };
    const response = await axios.post("https://api.harmony.one", databc);
    log.info(response.data.result.logs[1]);
    if (response.data) logger.info("GOTIT");
    else logger.info("FAILED");
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
    if (existing && !getEthTransactionError(existing)) {
      return;
    }
    log.info(`Fetching harmony data for tx ${txHash} (existing: ${existing})`);
    const harmony = await fetchTx(txHash);
    const TxReceipt = await fetchReceipt(txHash);
    const harmonyTx = formatHarmonyTx(harmony, TxReceipt);
    logger.info("UNREAChED");
    const error = getEthTransactionError(harmonyTx);
    if (error) throw new Error(error);
    json.transactions.push(harmonyTx);
    log.info("CHECK HERE");
    for (const entry of json.transactions) {
      const address = entry.hash;
      log.info(address);
    }
    save();
    return;
  };

  const syncAddressBook = async (addressBook: AddressBook): Promise<void> => {
    log.info(`addressBook has ${addressBook.json.length} entries`);
    for (const entry of addressBook.json) {
      const address = entry.address;
      if (addressBook.isSelf(address)) {
        await syncAddress(address);
      }
    }
    save();
    return;
  };

  const getTransactions = (addressBook: AddressBook): TransactionsJson => {
    const selfAddresses = addressBook.json
      .map(entry => entry.address)
      .filter(address => addressBook.isSelf(address));

    log.info("addresses");
    const selfTransactionHashes = Array.from(
      new Set(
        selfAddresses.reduce((all, address) => {
          return all.concat(json.addresses[address]?.history || []);
        }, [])
      )
    );
    log.info(`Parsing ${selfTransactionHashes.length} harmony transactions`);
    log.debug(selfTransactionHashes);
    for (const entry of json.transactions) {
      const address = entry.hash;
      log.info("JSONS", address);
    }

    const selfTransactionHashestoParse = selfTransactionHashes
      .map(hash => json.transactions.find(tx => tx.hash === hash))
      .filter(e => !!e);
    log.info("sef", selfTransactionHashestoParse);
    return selfTransactionHashestoParse
      .map(tx => parseHarmonyTx(tx, addressBook, logger))
      .sort(chrono);
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

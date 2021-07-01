import { formatEther } from "@ethersproject/units";
import { hexlify } from "@ethersproject/bytes";
import {
  Address,
  AddressBook,
  Bytes32,
  ChainData,
  ChainDataJson,
  EthParser,
  Logger,
  Store,
  StoreKeys,
  Transaction,
  TransactionsJson,
} from "@valuemachine/types";
import {
  getEmptyChainData,
  getEthTransactionError,
  getLogger,
} from "@valuemachine/utils";
import axios from "axios";

export const getPolygonData = (params?: {
  covalentKey: string;
  json?: ChainDataJson;
  logger?: Logger,
  store?: Store,
}): ChainData => {
  const { covalentKey, json: chainDataJson, logger, store } = params || {};
  const chainId = "137";

  const log = (logger || getLogger()).child?.({ module: "ChainData" });
  const json = chainDataJson || store?.load(StoreKeys.ChainData) || getEmptyChainData();
  const save = () => store
    ? store.save(StoreKeys.ChainData, json)
    : log.warn(`No store provided, can't save chain data`);

  if (!covalentKey) throw new Error(`A covalent api key is required to sync polygon data`);

  log.info(`Loaded harmony data containing ${
    json.transactions.length
  } transactions from ${chainDataJson ? "input" : store ? "store" : "default"}`);

  ////////////////////////////////////////
  // Internal Heleprs

  const covalentUrl = "https://api.covalenthq.com/v1";

  // TODO: rm key param?
  const syncAddress = async (address: Address, _key?: string): Promise<void> => {
    log.warn(`syncAddress not implemented. address=${address}`);
    return;
  };

  const fetchTx = async (txHash: Bytes32): Promise<any> => {
    const url = `${covalentUrl}/${chainId}/transaction_v2/${txHash}/?key=${covalentKey}`;
    let res;
    try {
      res = await axios(url);
    } catch (e) {
      log.warn(`Axios error: ${e.message}`);
      return;
    }
    if (res.status !== 200) {
      log.warn(`Failed to fetch polygon tx ${txHash}`);
      return;
    }
    if (res.data.error) {
      log.warn(`Covalent error: ${res.data.error_message}`);
      return;
    }
    return res.data.data?.items?.[0];
  };

  ////////////////////////////////////////
  // Exported Methods

  /*
  export const EthTransactionLog = Type.Object({
    address: Address,
    data: HexString,
    index: Type.Number(),
    topics: Type.Array(Bytes32),
  });
  export const EthTransaction = Type.Object({
    block: Type.Number(),
    data: HexString,
    from: Address,
    gasLimit: HexString,
    gasPrice: HexString,
    gasUsed: HexString,
    hash: Bytes32,
    index: Type.Number(),
    logs: Type.Array(EthTransactionLog),
    nonce: Type.Number(),
    status: Type.Optional(Type.Number()),
    timestamp: TimestampString,
    to: Type.Union([Address, Type.Null()]),
    value: DecimalString,
  });
  */

  const syncTransaction = async (
    txHash: string,
  ): Promise<void> => {
    if (!txHash) {
      throw new Error(`Cannot sync an invalid tx hash: ${txHash}`);
    }
    const existing = json.transactions.find(existing => existing.hash === txHash);
    if (!getEthTransactionError(existing)) {
      return;
    }
    log.info(`Fetching polygon data for tx ${txHash}`);
    const rawPolygonTx = await fetchTx(txHash);
    const polygonTx = {
      block: rawPolygonTx.block_height,
      data: "0x", // not available from covalent?
      from: rawPolygonTx.from_address,
      gasLimit: hexlify(rawPolygonTx.gas_offered),
      gasPrice: hexlify(rawPolygonTx.gas_price),
      gasUsed: hexlify(rawPolygonTx.gas_spent),
      hash: rawPolygonTx.tx_hash,
      index: rawPolygonTx.tx_offset,
      logs: rawPolygonTx.log_events.map(evt => ({
        address: evt.sender_address,
        index: evt.log_offset,
        topics: evt.raw_log_topics,
        data: evt.raw_log_data || "0x",
      })),
      nonce: 0, // not available?
      status: rawPolygonTx.successful ? 1 : 0,
      timestamp: rawPolygonTx.block_signed_at,
      to: rawPolygonTx.to_address,
      value: formatEther(rawPolygonTx.value),
    };
    const error = getEthTransactionError(polygonTx);
    if (error) throw new Error(error);
    // log.debug(polygonTx, `Parsed raw polygon tx to a valid evm tx`);
    json.transactions.push(polygonTx);
    save();
    return;
  };

  const syncAddressBook = async (addressBook: AddressBook): Promise<void> => {
    log.info(`addressBook has ${addressBook.json.length} entries`);
    log.warn(`syncAddressBook not implemented`);
    syncAddress(addressBook[0].address);
    return;
  };

  const getTransactions = (
    addressBook: AddressBook,
    extraParsers?: EthParser[],
  ): TransactionsJson => {
    // TODO: implement
    log.info(`${addressBook.json.length} address entries & ${extraParsers?.length} parsers`);
    log.warn(`syncTransaction not implemented`);
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

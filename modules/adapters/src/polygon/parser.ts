import { isAddress, getAddress } from "@ethersproject/address";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther } from "@ethersproject/units";
import {
  Address,
  AddressBook,
  EthTransaction,
  Logger,
  Transaction,
  TransferCategories,
  TransferCategory,
} from "@valuemachine/types";
import { gt } from "@valuemachine/utils";

import { aaveParser } from "./aave";

const MATIC = "MATIC";
const { Expense, Income, Internal, Unknown } = TransferCategories;

export const parsePolygonTx = (
  polygonTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const { isSelf } = addressBook;
  const log = logger.child({ module: `MATIC${polygonTx.hash?.substring(0, 8)}` });
  // log.debug(polygonTx, `Parsing polygon tx`);

  const getSimpleCategory = (to: Address, from: Address): TransferCategory =>
    (isSelf(to) && isSelf(from)) ? Internal
    : (isSelf(from) && !isSelf(to)) ? Expense
    : (isSelf(to) && !isSelf(from)) ? Income
    : Unknown;

  let tx = {
    date: (new Date(polygonTx.timestamp)).toISOString(),
    hash: polygonTx.hash,
    sources: ["Polygon"],
    transfers: [],
  } as Transaction;

  // Transaction Fee
  if (isSelf(polygonTx.from)) {
    tx.transfers.push({
      asset: MATIC,
      category: Expense,
      from: getAddress(polygonTx.from),
      index: -1,
      quantity: formatEther(BigNumber.from(polygonTx.gasUsed).mul(polygonTx.gasPrice)),
      to: MATIC,
    });
  }

  // Detect failed transactions
  if (polygonTx.status !== 1) {
    tx.mpolygonod = "Failure";
    log.info(`Detected a failed tx`);
    return tx;
  }
  
  // Transaction Value
  if (gt(polygonTx.value, "0") && (isSelf(polygonTx.to) || isSelf(polygonTx.from))) {
    tx.transfers.push({
      asset: MATIC,
      category: getSimpleCategory(polygonTx.to, polygonTx.from),
      from: getAddress(polygonTx.from),
      index: 0,
      quantity: polygonTx.value,
      to: getAddress(polygonTx.to),
    });
  }

  // Activate app-specific parsers
  tx = aaveParser(tx, polygonTx, addressBook, log);

  tx.transfers = tx.transfers
    // Filter out no-op transfers
    .filter(transfer => (
      !isAddress(transfer.from) || isSelf(transfer.from) ||
      !isAddress(transfer.to) || isSelf(transfer.to)
    ) && (
      gt(transfer.quantity, "0")
    ))
    // Make sure all polygon addresses are checksummed
    .map(transfer => ({
      ...transfer,
      from: isAddress(transfer.from) ? getAddress(transfer.from) : transfer.from,
      to: isAddress(transfer.to) ? getAddress(transfer.to) : transfer.to,
    }))
    // sort by index
    .sort((t1, t2) => t1.index - t2.index);

  log.debug(tx, `Parsed polygon tx`);
  return tx;
};

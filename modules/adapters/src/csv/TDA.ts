import {
  Transaction,
  Logger,
  TransferCategories,
  TransferCategory,
} from "@valuemachine/types";
import csv from "csv-parse/lib/sync";
import { gt } from "@valuemachine/utils";

import { TransactionSources } from "../enums";

const { Expense, SwapIn, SwapOut, Unknown } = TransferCategories;

export const mergeTDATransactions = (
  oldTransactions: Transaction[],
  csvData: string,
  logger: Logger,
): Transaction[] => {
  const source = TransactionSources.TDA;
  const log = logger.child({ module: source }); 
  log.info(`Processing ${csvData.split(`\n`).length - 2} rows of TDA data`);
  csv(csvData, { columns: true, skip_empty_lines: true }).forEach(row => {

    const {
      ["DATE"]: date,
      ["DESCRIPTION"]: description,
      ["SYMBOL"]: asset,
      ["QUANTITY"]: quantity,
      ["AMOUNT"]: usdQuantity,
      ["REG FEE"]: fees,
    } = row;
    log.info(date);
    const account = `${source}-account`;
    const exchange = `${source}-exchange`;

    const transaction = {
      date: (new Date(date)).toISOString(),
      sources: [source],
      transfers: [],
    } as Transaction;

    let [from, to, category] = ["", "", Unknown as TransferCategory];

    if (description.startsWith("Bought")) {
      [from, to, category] = [exchange, account, SwapIn];
      transaction.transfers.push({
        asset: "USD",
        category: SwapOut,
        from: account,
        quantity: usdQuantity,
        to: exchange,
      });
      transaction.method = "Buy";
    }

    if (description.startsWith("Sold")) {
      [from, to, category] = [account, exchange, SwapOut];
      transaction.transfers.push({
        asset: "USD",
        category: SwapIn,
        from: exchange,
        quantity: usdQuantity,
        to: account,
      }); 
      transaction.method = "Sell";
    }

    transaction.transfers.push({ asset, category, from, quantity, to });

    if (gt(fees, "0")) {
      transaction.transfers.push({
        asset: "USD",
        category: Expense,
        from: account,
        quantity: fees,
        to: exchange,
      });
    }

    log.debug(transaction, "Parsed row into transaction:");
    oldTransactions.push(transaction);
  });
  return oldTransactions;
};

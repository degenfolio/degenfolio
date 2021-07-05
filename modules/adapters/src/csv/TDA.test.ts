import { AddressZero } from "@ethersproject/constants";
import { Transactions } from "@valuemachine/types";
import { getTransactionsError } from "@valuemachine/utils";
import { getTransactions } from "valuemachine";

import {
  expect,
  getTestAddressBook,
  testLogger,
} from "../testUtils";

import { mergeTDATransactions } from "./TDA";

const log = testLogger.child({ module: "TestTDA",
  // level: "debug",
});

const exampleTDACsv =
`
DATE,TRANSACTION ID,DESCRIPTION,QUANTITY,SYMBOL,PRICE,COMMISSION,AMOUNT,REG FEE,SHORT-TERM RDM FEE,FUND REDEMPTION FEE, DEFERRED SALES CHARGE
11/11/2020,,Bought 10 AMGN @ 245.145,10,AMGN,245.145,0,-2451.45,,,,
11/11/2020,,Bought 1000 ITUB @ 5.35,1000,ITUB,5.35,0,-5350,,,,
11/11/2020,,Bought 100 AAPL @ 118.365,100,AAPL,118.365,0,-11836.5,,,,
11/11/2020,,Sold 3 AAPL @ 118.215,3,AAPL,118.215,0,354.64,0.01,,,
11/11/2020,,Sold 97 AAPL @ 118.2101,97,AAPL,118.2101,0,11466.12,0.26,,,
`;

describe("TDA", () => {
  let addressBook;
  let txns: Transactions;

  beforeEach(() => {
    addressBook = getTestAddressBook(AddressZero);
    txns = getTransactions({ addressBook, logger: log });
  });

  it.only("should merge TDA data", async () => {
    txns.mergeCsv(exampleTDACsv, mergeTDATransactions);
    expect(getTransactionsError(txns.json)).to.be.null;
  });
});

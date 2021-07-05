import { CsvSources, Guards, mergeTDATransactions } from "@degenfolio/adapters";
import {
  AddressBookJson,
  AddressCategories,
} from "@valuemachine/types";
import { getEmptyAddressBook } from "@valuemachine/utils";

export const Examples = {
  Polygon: "Polygon",
  Idle: "Idle",
  TDA: "TDA",
  Coinbase: "Coinbase",
  Aave: "Aave",
  Custom: "Custom",
  
};

export const getExampleAddressBook = (example: string): AddressBookJson =>
  example === Examples.Idle ? [{
    name: "IdleUser",
    address: "0x5bCfC2dee33fBD19771d4063C15cFB6dD555bb4C",
    category: AddressCategories.Self,
    guard: Guards.ETH,
  }] :example === Examples.Aave ? [{
    name: "AaveUser",
    address: "0xeE0c753f1ea84b0aDDe35FD45D1bA3691174010b",
    category: AddressCategories.Self,
    guard: Guards.ETH,
  }]: example === Examples.Polygon ? [{
    name: "PolygonUser",
    address: "0x8266C20Cb25A5E1425cb126D78799B2A138B6c46",
    category: AddressCategories.Self,
    guard: Guards.ETH,
  }] : getEmptyAddressBook();

export type CsvFile = {
  name: string; // eg coinbase.csv
  type: any; // CsvSource eg Coinbase or a csv parser
  data: string; // raw csv data eg "col1,col2\nrow1,row2\n"
};
const emptyCsv = [] as CsvFile[];

const coinbaseData = `
Timestamp,           Transaction Type,Asset,Quantity Transacted,      USD Spot Price at Transaction,USD Subtotal,USD Total (inclusive of fees),USD Fees,Notes
2018-01-01T01:00:00Z, Buy,             BTC,  0.1,                      1500.00,                      150.00,      165.00,                       15.00,   Bought 0.0300 BTC for $165.00 USD
2018-01-01T01:20:00Z, Receive, ETH, 1.314156295,650.00,                  "",          "",                           "",      Received 1.0000 ETH from an external account
2018-01-03T01:00:00Z, Sell,            ETH,  1.0,                      600.00,                       600.00,      590.00,                       10.00,   Sold 1.0000 ETH for $590.00 USD
`.replace(/, +/g, ",");

const TDAData = `
DATE,TRANSACTION ID,DESCRIPTION,QUANTITY,SYMBOL,PRICE,COMMISSION,AMOUNT,REG FEE,SHORT-TERM RDM FEE,FUND REDEMPTION FEE, DEFERRED SALES CHARGE
11/11/2020,,Bought 10 AMGN @ 245.145,10,AMGN,245.145,0,-2451.45,,,,
11/11/2020,,Bought 1000 ITUB @ 5.35,1000,ITUB,5.35,0,-5350,,,,
11/11/2020,,Bought 100 AAPL @ 118.365,100,AAPL,118.365,0,-11836.5,,,,
11/11/2020,,Sold 3 AAPL @ 118.215,3,AAPL,118.215,0,354.64,0.01,,,
11/11/2020,,Sold 97 AAPL @ 118.2101,97,AAPL,118.2101,0,11466.12,0.26,,,
11/11/2020,,Bought 1000 ITUB @ 5.32,1000,ITUB,5.32,0,-5320,,,,
11/11/2020,,Bought 50 AAPL @ 117.9909,50,AAPL,117.9909,0,-5899.55,,,,
11/11/2020,,Bought 50 AAPL @ 118.1302,50,AAPL,118.1302,0,-5906.51,,,,
11/11/2020,,Sold 2000 ITUB @ 5.32,2000,ITUB,5.32,0,10639.52,0.48,,,
11/11/2020,,Sold 100 AAPL @ 117.955,100,AAPL,117.955,0,11795.23,0.27,,,
11/11/2020,,Bought 100 DOCU @ 204.9936,100,DOCU,204.9936,0,-20499.36,,,,
11/11/2020,,Sold 50 DOCU @ 205.32,50,DOCU,205.32,0,10265.76,0.24,,,
11/11/2020,,Sold 50 DOCU @ 205.31,50,DOCU,205.31,0,10265.26,0.24,,,
11/11/2020,,Bought 100 AAPL @ 118.0452,100,AAPL,118.0452,0,-11804.52,,,,
11/11/2020,,Sold 50 AAPL @ 118.13,50,AAPL,118.13,0,5906.36,0.14,,,
`;

export const getExampleCsv = (example: string): CsvFile[] =>
  example === Examples.Coinbase ? [{
    name: "coinbase.csv",
    type: CsvSources.Coinbase,
    data: coinbaseData,
  }] :  example === Examples.TDA ? [{
    name: "TDA.csv",
    type: mergeTDATransactions,
    data: TDAData,
  }] : emptyCsv;

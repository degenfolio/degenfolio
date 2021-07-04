import { CsvSources, Guards } from "@degenfolio/adapters";
import {
  AddressBookJson,
  AddressCategories,
} from "@valuemachine/types";
import { getEmptyAddressBook } from "@valuemachine/utils";

export const Examples = {
  Polygon: "Polygon",
  Idle: "Idle",
  Coinbase: "Coinbase",
  Custom: "Custom",
};

export const getExampleAddressBook = (example: string): AddressBookJson =>
  example === Examples.Idle ? [{
    name: "IdleUser",
    address: "0x5bCfC2dee33fBD19771d4063C15cFB6dD555bb4C",
    category: AddressCategories.Self,
    guard: Guards.ETH,
  }] : example === Examples.Polygon ? [{
    name: "PolygonUser",
    address: "0x8266C20Cb25A5E1425cb126D78799B2A138B6c46",
    category: AddressCategories.Self,
    guard: Guards.ETH,
  }] : getEmptyAddressBook();

export type CsvFile = {
  name: string; // eg coinbase.csv
  type: string; // CsvSource eg Coinbase
  data: string; // raw csv data eg "col1,col2\nrow1,row2\n"
};
const emptyCsv = [] as CsvFile[];

const csvData = 
`Timestamp,           Transaction Type,Asset,Quantity Transacted,      USD Spot Price at Transaction,USD Subtotal,USD Total (inclusive of fees),USD Fees,Notes
2018-01-01T01:00:00Z, Buy,             BTC,  0.1,                      1500.00,                      150.00,      165.00,                       15.00,   Bought 0.0300 BTC for $165.00 USD
2018-01-01T01:20:00Z, Receive, ETH, 1.314156295,650.00,                  "",          "",                           "",      Received 1.0000 ETH from an external account
2018-01-03T01:00:00Z, Sell,            ETH,  1.0,                      600.00,                       600.00,      590.00,                       10.00,   Sold 1.0000 ETH for $590.00 USD
`.replace(/, +/g, ",");

export const getExampleCsv = (example: string): CsvFile[] =>
  example === Examples.Coinbase ? [{
    name: "coinbase.csv",
    type: CsvSources.Coinbase,
    data: csvData,
  }] : emptyCsv;

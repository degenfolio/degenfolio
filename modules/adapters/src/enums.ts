import {
  Assets as DefaultAssets,
  Guards as DefaultGuards,
  CsvSources as DefaultCsvSources,
  TransactionSources as DefaultSources,
} from "@valuemachine/types";

export const CsvSources = {
  ...DefaultCsvSources,
  TDAmeritrade: "TDAmeritrade",
};

export const Guards = {
  ...DefaultGuards,
  MATIC: "MATIC",
  ONE: "ONE",
};

export const TransactionSources = {
  ...DefaultSources,
  ...Guards,
  Aave: "Aave",
  Idle: "Idle",
  Polygon: "Polygon",
  Quickswap: "Quickswap",
};

export const Assets = {
  ...DefaultAssets,

  ONE: "ONE",

  AAVE: "AAVE",
  stkAAVE: "stkAAVE",

  aAAVE: "aAAVE",
  aBAT: "aBAT",
  aDAI: "aDAI",
  aMATIC: "aMATIC",
  aUSDC: "aUSDC",
  aUSDT: "aUSDT",
  aWBTC: "aWBTC",
  aWETH: "aWETH",

  amAAVE: "amAAVE",
  amDAI: "amDAI",
  amMATIC: "amMATIC",
  amUSDC: "amUSDC",
  amUSDT: "amUSDT",
  amWBTC: "amWBTC",
  amWETH: "amWETH",

  IDLE: "IDLE",
  idleDAISafe: "idleDAISafe",
  idleDAIYield: "idleDAIYield",
  idleRAIYield: "idleRAIYield",
  idleSUSDYield: "idleSUSDYield",
  idleTUSDYield: "idleTUSDYield",
  idleUSDCSafe: "idleUSDCSafe",
  idleUSDCYield: "idleUSDCYield",
  idleUSDTSafe: "idleUSDTSafe",
  idleUSDTYield: "idleUSDTYield",
  idleWBTCYield: "idleWBTCYield",
  idleWETHYield: "idleWETHYield",

  MATIC: "MATIC",
  WMATIC: "WMATIC",

};


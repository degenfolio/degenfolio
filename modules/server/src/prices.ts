import { getLogger } from "@valuemachine/utils";
import express from "express";
import { getPrices } from "valuemachine";
import axios from "axios";

import { env } from "./env";
import {
  getLogAndSend,
  store,
  STATUS_YOUR_BAD,
} from "./utils";

const log = getLogger(env.logLevel).child({
  // level: "debug",
  module: "Prices",
});

const fetchPrice = async (rawDate: string, unit: string, asset: string): Promise<string> => {
  const covalentUrl = "https://api.covalenthq.com/v1";
  const date = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
  const url = `${covalentUrl}/pricing/historical/${unit}/${asset
  }/?from=${date
  }&to=${date
  }&key=${env.covalentKey}`;
  log.info(`GET ${url}`);
  try {
    const response = await axios.get(url);
    if (response.status !== 200) {
      log.warn(`Bad Status: ${response.status}`);
      return "";
    } else if (response.data.error) {
      log.warn(`Covalent Error: ${response.data.error_message}`);
      return "";
    } else {
      return response.data.data.prices[0].price.toString();
    }
  } catch (e) {
    log.warn(`${e.message}: ${
      url.replace(covalentUrl, "covalent").replace(/&key=.*/, "")
    }`);
    return "";
  }
};

const syncPrice = async (rawDate: string, unit: string, asset: string): Promise<string> => {
  const prices = getPrices({ store, logger: log, unit: unit });
  const date = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
  let price = prices.getPrice(date, asset);
  if (price) { return price; }
  // fetch price from Covalent
  price = await fetchPrice(date, unit, asset);
  if (price) { prices.setPrice(price, date, asset, unit); return price; }
  price = await prices.syncPrice(date, asset);
  if (price) { prices.setPrice(price, date, asset, unit); return price; }
  throw new Error(`Couldn't get price of ${asset} on ${date}`);
};

export const pricesRouter = express.Router();

pricesRouter.get("/:unit/:asset/:date", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const { asset, date, unit } = req.params;
  log.info(`Got request for ${unit} price of ${asset} on ${date}`);
  try {
    return logAndSend(await syncPrice(date, unit, asset));
  } catch (e) {
    log.error(e.message);
    logAndSend(e.message, STATUS_YOUR_BAD);
  }
});

pricesRouter.post("/:unit/:date", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const { unit, date } = req.params;
  const { assets } = req.body;
  if (!assets?.length) logAndSend("A list of assets is required", STATUS_YOUR_BAD);
  log.info(`Got request for ${unit} prices on ${date} for assets: [${assets?.join(", ")}]`);
  const output = {};
  for (const asset of assets) {
    try {
      output[asset] = await syncPrice(date, unit, asset);
    } catch (e) {
      log.warn(e.message);
    }
  }
  log.info(`Success, returning ${Object.keys(output).length} prices`);
  logAndSend({ [date]: { [unit]: output } });
});

pricesRouter.post("/chunks/:unit", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const { unit } = req.params;
  const { chunks } = req.body;
  log.info(`Getting ${unit} prices for ${chunks.length} chunks`);
  const prices = getPrices({ store, logger: log, unit: unit });
  try {
    const pricesJson = await prices.syncChunks(chunks);
    logAndSend(pricesJson);
  } catch (e) {
    log.error(e.message);
    logAndSend(e.message, STATUS_YOUR_BAD);
  }
});

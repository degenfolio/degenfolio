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

const covalentUrl = "https://api.covalenthq.com/v1";
const fetchPrice = async (date: string, unit: string, asset: string): Promise<string> => {
  const url = `${covalentUrl}/pricing/historical/${unit}/${asset
  }/?from=${date
  }&to=${date
  }&key=${env.covalentKey}`;
  log.info(`GET ${url}`);
  const response = await axios.get(url);
  if (response.status !== 200) throw new Error(`Bad Status: ${response.status}`);
  if (response.data.error) throw new Error(`Covalent Error: ${response.data.error_message}`);
  return response.data.data.prices[0].price.toString();
};

export const pricesRouter = express.Router();

pricesRouter.get("/:unit/:asset/:date", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const { asset, date, unit } = req.params;
  log.info(`Got request for ${unit} price of ${asset} on ${date}`);
  const prices = getPrices({ store, logger: log, unit: unit });
  try {
    let price = prices.getPrice(date, asset);
    if (price) {
      return logAndSend(price);
    } else {
      price = await fetchPrice(date, unit, asset);
      if (!price) {
        return logAndSend(`Couldn't get price for unit=${unit} asset=${asset} date=${date}`);
      } else {
        prices.setPrice(price, date, asset, unit);
        return logAndSend(price);
      }
    }
  } catch (e) {
    log.error(e.stack);
    logAndSend(e.message, STATUS_YOUR_BAD);
  }
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
    log.error(e.stack);
    logAndSend(e.message, STATUS_YOUR_BAD);
  }
});

pricesRouter.post("/:unit/:date", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const { unit, date } = req.params;
  const { assets } = req.body;
  log.info(`Got request for ${unit} prices on ${date} for assets: [${assets.join(", ")}]`);
  const prices = getPrices({ store, logger: log, unit: unit });
  const output = {};
  try {
    for (const asset of assets) {
      output[asset] = await prices.syncPrice(date, asset);
    }
    res.json({ [date]: { [unit]: output } });
  } catch (e) {
    log.error(e.stack);
    logAndSend(e.message, STATUS_YOUR_BAD);
  }
});

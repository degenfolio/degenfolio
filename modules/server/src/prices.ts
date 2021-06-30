import { getLogger } from "@valuemachine/utils";
import express from "express";
import { getPrices } from "valuemachine";

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

export const pricesRouter = express.Router();

pricesRouter.get("/:unit/:asset/:date", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const { asset, date, unit } = req.params;
  log.info(`Got request for ${unit} price of ${asset} on ${date}`);
  const prices = getPrices({ store, logger: log, unit: unit });
  try {
    const price = await prices.syncPrice(date, asset);
    logAndSend(price);
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

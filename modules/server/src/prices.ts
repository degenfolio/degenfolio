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

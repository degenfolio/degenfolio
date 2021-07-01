import { appAddresses, appParsers } from "@degenfolio/adapters";
import { isAddress as isEthAddress } from "@ethersproject/address";
import { getAddressBookError, chrono, getLogger } from "@valuemachine/utils";
import express from "express";
import { getAddressBook, getChainData } from "valuemachine";

import { env } from "./env";
import { getLogAndSend, store, STATUS_YOUR_BAD, STATUS_MY_BAD } from "./utils";

const log = getLogger(env.logLevel).child({ module: "Transactions" });

const chainData = getChainData({ etherscanKey: env.etherscanKey, logger: log, store });

export const ethereumRouter = express.Router();

let syncing = [];
ethereumRouter.post("/", async (req, res) => {
  const logAndSend = getLogAndSend(res);
  const addressBookJson = req.body.addressBook;
  const addressBookError = getAddressBookError(addressBookJson);
  if (addressBookError) {
    return logAndSend("Invalid AddressBook" + addressBookError, STATUS_YOUR_BAD);
  }
  const addressBook = getAddressBook({
    json: addressBookJson,
    hardcoded: appAddresses,
    logger: log,
  });
  const selfAddresses = addressBook.json
    .map(entry => entry.address)
    .filter(address => isEthAddress(address))
    .filter(address => addressBook.isSelf(address));
  if (selfAddresses.every(address => syncing.includes(address))) {
    return logAndSend(`Eth data for ${selfAddresses.length} addresses is already syncing.`);
  }
  selfAddresses.forEach(address => syncing.push(address));
  const sync = new Promise(res => chainData.syncAddressBook(addressBook).then(() => {
    log.warn(`Successfully synced history for ${selfAddresses.length} addresses`);
    syncing = syncing.filter(address => !selfAddresses.includes(address));
    res(true);
  }).catch((e) => {
    log.warn(`Failed to sync history for ${selfAddresses.length} addresses: ${e.stack}`);
    syncing = syncing.filter(address => !selfAddresses.includes(address));
    res(false);
  }));
  Promise.race([
    sync,
    new Promise((res, rej) => setTimeout(() => rej("TimeOut"), 10000)),
  ]).then(
    (didSync: boolean) => {
      if (didSync) {
        try {
          const start = Date.now();
          const transactionsJson = chainData.getTransactions(addressBook, appParsers);
          res.json(transactionsJson.sort(chrono));
          log.info(`Returned ${transactionsJson.length} transactions at a rate of ${
            Math.round((100000 * transactionsJson.length)/(Date.now() - start)) / 100
          } tx/sec`);
        } catch (e) {
          log.warn(e);
          logAndSend("Error syncing transactions", STATUS_MY_BAD);
        }
        return;
      } else {
        return logAndSend(
          `Ethereum data for ${selfAddresses.length} addresses failed to sync`,
          STATUS_MY_BAD
        );
      }
    },
    (error: any) => {
      if (error === "TimeOut") {
        return logAndSend(
          `Ethereum data for ${selfAddresses.length} addresses has started syncing, please wait`
        );
      } else {
        return logAndSend(
          `Ethereum data for ${selfAddresses.length} addresses failed to sync ${error}`,
          STATUS_MY_BAD
        );
      }
    },
  ).catch((e) => {
    log.warn(`Encountered an error while syncing history for ${selfAddresses}: ${e.message}`);
    syncing = syncing.filter(address => selfAddresses.includes(address));
  });
  log.info(`Synced ${selfAddresses.length} addresses successfully? ${await sync}`);
});


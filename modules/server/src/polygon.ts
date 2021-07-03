import { appAddresses, getPolygonData, Guards } from "@degenfolio/adapters";
import { isAddress as isEthAddress } from "@ethersproject/address";
import { getLogger, getAddressBookError } from "@valuemachine/utils";
import express from "express";
import { getAddressBook } from "valuemachine";

import { env } from "./env";
import { getPollerHandler } from "./poller";
import { getLogAndSend, store, STATUS_YOUR_BAD } from "./utils";

const log = getLogger(env.logLevel).child({ module: `${Guards.MATIC}Transactions` });

const polygonData = getPolygonData({ covalentKey: env.covalentKey, logger: log, store });
const handlePoller = getPollerHandler(
  polygonData.syncAddressBook,
  polygonData.getTransactions,
  Guards.MATIC,
);

export const polygonRouter = express.Router();

polygonRouter.post("/", async (req, res) => {
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
  await handlePoller(
    addressBook,
    addressBook.json.map(entry => entry.address).filter(addressBook.isSelf).filter(isEthAddress),
    res,
  );
});

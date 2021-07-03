import {
  AddressBook,
  EthTransaction,
  Logger,
  Transaction,
} from "@valuemachine/types";

import { Assets } from "../enums";
import { parseEvmTx } from "../evmParser";

import { aaveParser } from "./aave";

export const parsePolygonTx = (
  polygonTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction =>
  parseEvmTx(
    polygonTx,
    addressBook,
    logger,
    Assets.MATIC,
    [aaveParser],
  );

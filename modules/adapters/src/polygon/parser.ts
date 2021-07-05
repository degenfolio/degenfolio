import {
  AddressBook,
  EthTransaction,
  Logger,
  Transaction,
} from "@valuemachine/types";

import { Assets } from "../enums";
import { parseEvmTx } from "../evmParser";

import { erc20Parser } from "./erc20";
//import { aaveParser } from "./aave";
import { quickswapParser } from "./quickswap";

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
    [erc20Parser, quickswapParser],
  );

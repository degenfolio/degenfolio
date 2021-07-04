import {
  AddressBook,
  EthTransaction,
  Logger,
  Transaction
} from "@valuemachine/types";

import { Assets } from "../enums";
import { parseEvmTx } from "../evmParser";

export const parseHarmonyTx = (
  harmonyTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger
): Transaction => parseEvmTx(harmonyTx, addressBook, logger, Assets.ONE, []);

import { Interface } from "@ethersproject/abi";
import { formatUnits } from "@ethersproject/units";
import { AddressZero } from "@ethersproject/constants";
import {
  AddressBook,
  AddressEntry,
  AddressCategories,
  AddressCategory,
  EthTransaction,
  Logger,
  Transaction,
  TransactionSource,
  TransferCategories,
} from "@valuemachine/types";
import {
  parseEvent,
  rmDups,
  setAddressCategory,
} from "@valuemachine/utils";

import { Assets } from "../assets";

const { AAVE, amAAVE, amDAI, amUSDC, amWBTC, amWETH, amUSDT, amMATIC, MATIC } = Assets;

export const aaveSource = "Aave";

const { Expense, Income, Internal, Unknown } = TransferCategories;

const setCategory = (category: AddressCategory) =>
  (entry: Partial<AddressEntry>): AddressEntry => ({
    ...setAddressCategory(category)(entry),
    guard: MATIC,
  });

const govAddresses = [
  { name: AAVE, address: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B" },
].map(setCategory(AddressCategories.ERC20));

const coreAddresses = [
  { name: "LendingPool", address: "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf" },
].map(setCategory(AddressCategories.Defi));

// https://docs.aave.com/developers/deployed-contracts/deployed-contracts
const marketAddresses = [
  { name: amAAVE, address: "0x1d2a0E5EC8E5bBDCA5CB219e649B565d8e5c3360" },
  { name: amDAI, address: "0x27F8D03b3a2196956ED754baDc28D73be8830A6e" },
  { name: amUSDC, address: "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F" },
  { name: amUSDT, address: "0x60D55F02A771d515e077c9C2403a1ef324885CeC" },
  { name: amWETH, address: "0x28424507fefb6f7f8E9D3860F56504E4e5f5f390" },
  { name: amWBTC, address: "0x5c2ed810328349100A66B82b78a1791B101C9D61" },
  { name: amMATIC, address: "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4" },
].map(setCategory(AddressCategories.ERC20));

export const aaveAddresses = [
  ...govAddresses,
  ...coreAddresses,
  ...marketAddresses,
];

////////////////////////////////////////
/// Interfaces

const erc20Interface = new Interface([
  "event Approval(address indexed from, address indexed to, uint amount)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
]);

////////////////////////////////////////
/// Parser

export const aaveParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: aaveSource });
  log.info(`Parser activated`);
  const { getDecimals, getName, isSelf, isToken } = addressBook;

  if (aaveAddresses.some(entry => ethTx.from === entry.address)) {
    tx.sources = rmDups([aaveSource, ...tx.sources]) as TransactionSource[];
  }

  for (const txLog of ethTx.logs) {
    const address = txLog.address;

    // Parse ERC20 compliant tokens
    if (isToken(address)) {
      const source = "ERC20";
      const event = parseEvent(erc20Interface, txLog);
      if (!event.name) continue;
      tx.sources = rmDups([source, ...tx.sources]);
      const asset = getName(address);
      // Skip transfers that don't concern self accounts
      if (!isSelf(event.args.from) && !isSelf(event.args.to)) {
        log.debug(`Skipping ${asset} ${event.name} that doesn't involve us`);
        continue;
      }
      const amount = formatUnits(event.args.amount, getDecimals(address));
      if (event.name === "Transfer") {
        log.debug(`Parsing ${source} ${event.name} of ${amount} ${asset}`);
        const from = event.args.from === AddressZero ? address : event.args.from;
        const to = event.args.to === AddressZero ? address : event.args.to;
        const category = isSelf(from) && isSelf(to) ? Internal
          : isSelf(from) && !isSelf(to) ? Expense
          : isSelf(to) && !isSelf(from) ? Income
          : Unknown;
        tx.transfers.push({ asset, category, from, index: txLog.index, quantity: amount, to });
        if (ethTx.to === address) {
          tx.method = `${asset} ${event.name}`;
        }
      } else if (event.name === "Approval") {
        log.debug(`Parsing ${source} ${event.name} event for ${asset}`);
        if (ethTx.to === address) {
          tx.method = `${asset} ${event.name}`;
        }
      } else {
        log.warn(event, `Unknown ${asset} event`);
      }
    }

  }

  // Incorporating aave adapter
  return tx;
};


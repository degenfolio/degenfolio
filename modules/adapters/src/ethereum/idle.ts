import { AddressZero } from "@ethersproject/constants";
import { formatUnits } from "@ethersproject/units";
import { Interface } from "@ethersproject/abi";
import {
  Address,
  AddressBook,
  AddressCategories,
  EthTransaction,
  Logger,
  Transaction,
  TransferCategories,
} from "@valuemachine/types";
import {
  rmDups,
  setAddressCategory,
  parseEvent,
} from "@valuemachine/utils";
import { publicAddresses } from "valuemachine";

import { Assets, TransactionSources } from "../enums";

const source = TransactionSources.Idle;
const { Deposit, Withdraw, SwapIn, SwapOut } = TransferCategories;
const {
  IDLE, idleDAISafe, idleDAIYield, idleRAIYield, idleSUSDYield, idleTUSDYield,
  idleUSDCSafe, idleUSDCYield, idleUSDTSafe, idleUSDTYield, idleWBTCYield, idleWETHYield,
} = Assets;

////////////////////////////////////////
/// Addresses

const stkIDLE = "stkIDLE";

const govAddresses = [
  { name: IDLE, address: "0x875773784Af8135eA0ef43b5a374AaD105c5D39e" },
  { name: stkIDLE, address: "0xaAC13a116eA7016689993193FcE4BadC8038136f" },
].map(setAddressCategory(AddressCategories.ERC20));

const marketAddresses = [
  { name: idleDAIYield, address: "0x3fe7940616e5bc47b0775a0dccf6237893353bb4" },
  { name: idleRAIYield, address: "0x5C960a3DCC01BE8a0f49c02A8ceBCAcf5D07fABe" },
  { name: idleSUSDYield, address: "0xF52CDcD458bf455aeD77751743180eC4A595Fd3F" },
  { name: idleTUSDYield, address: "0xc278041fDD8249FE4c1Aad1193876857EEa3D68c" },
  { name: idleUSDCYield, address: "0x5274891bEC421B39D23760c04A6755eCB444797C" },
  { name: idleUSDTYield, address: "0xF34842d05A1c888Ca02769A633DF37177415C2f8" },
  { name: idleWBTCYield, address: "0x8C81121B15197fA0eEaEE1DC75533419DcfD3151" },
  { name: idleWETHYield, address: "0xC8E6CA6E96a326dC448307A5fDE90a0b21fd7f80" },
  { name: idleDAISafe, address: "0xa14ea0e11121e6e951e87c66afe460a00bcd6a16" },
  { name: idleUSDCSafe, address: "0x3391bc034f2935eF0E1e41619445F998b2680D35" },
  { name: idleUSDTSafe, address: "0x28fAc5334C9f7262b3A3Fe707e250E01053e07b5" },
].map(setAddressCategory(AddressCategories.ERC20));

export const idleAddresses = [
  ...govAddresses,
  ...marketAddresses,
];

////////////////////////////////////////
/// Interfaces

const stkIDLEInterface = new Interface([
  "event ApplyOwnership(address admin)",
  "event CommitOwnership(address admin)",
  "event Deposit(address indexed provider, uint256 value, uint256 indexed locktime, int128 type, uint256 ts)",
  "event Supply(uint256 prevSupply, uint256 supply)",
  "event Withdraw(address indexed provider, uint256 value, uint256 ts)",
]);

////////////////////////////////////////
/// Parser

export const idleParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: source });
  const { isSelf } = addressBook;

  const idleTokenToUnderlyingAddress = (idleAddress: Address): Address => {
    const idleName = idleAddresses.find(entry => entry.address === idleAddress)?.name || "";
    if (!idleName) return AddressZero;
    const underlyingName = idleName.replace(/^idle/, "").replace(/(Yield|Safe)$/, "");
    const underlyingAddress = publicAddresses.find(entry => entry.name === underlyingName)?.address;
    log.info(`Mapped ${idleName} to underlying ${underlyingName} w address ${underlyingAddress}`);
    return underlyingAddress;
  };

  for (const ethTxLog of ethTx.logs) {
    const address = ethTxLog.address;
    const asset = addressBook.getName(address);

    ////////////////////
    // Stake/Unstake
    if (govAddresses.some(e => e.address === address)) {
      tx.sources = rmDups([source, ...tx.sources]);
      const name = addressBook.getName(address);
      if (name === stkIDLE) {
        const event = parseEvent(stkIDLEInterface, ethTxLog);
        const account = `${stkIDLE}-${event.args.provider}`;

        if (event.name === "Deposit") {
          const value = formatUnits(
            event.args.value,
            addressBook.getDecimals(govAddresses.find(e => e.name === IDLE).address),
          );
          log.info(`Found ${event.name} ${name} event for ${value} ${IDLE}`);
          const deposit = tx.transfers.find(transfer =>
            transfer.asset === IDLE && transfer.quantity === value && isSelf(transfer.from)
          );
          if (deposit) {
            deposit.category = Deposit;
            deposit.to = account;
            tx.method = "Stake";
          } else {
            log.warn(`Couldn't find an outgoing transfer of ${value} ${IDLE}`);
          }

        } else if (event.name === "Withdraw") {
          const value = formatUnits(
            event.args.value,
            addressBook.getDecimals(govAddresses.find(e => e.name === IDLE).address),
          );
          log.info(`Found ${event.name} ${name} event for ${value} ${IDLE}`);
          const withdraw = tx.transfers.find(transfer =>
            transfer.asset === IDLE && transfer.quantity === value && isSelf(transfer.to)
          );
          if (withdraw) {
            withdraw.category = Withdraw;
            withdraw.from = account;
            tx.method = "Unstake";
          } else {
            log.warn(`Couldn't find an outgoing transfer of ${value} ${IDLE}`);
          }

        }
      }

    ////////////////////
    // Deposit/Withdraw
    } else if (marketAddresses.some(e => e.address === address)) {
      tx.sources = rmDups([source, ...tx.sources]);
      log.info(`Found interaction with Idle ${addressBook.getName(address)}`);

      const underlyingAddress = idleTokenToUnderlyingAddress(address);
      const underlyingAsset = addressBook.getName(underlyingAddress);

      log.info(`Looking for associated ${underlyingAsset} transfer`);
      const tokenTransfer = tx.transfers.find(transfer => transfer.asset === underlyingAsset);
      if (isSelf(tokenTransfer?.to)) {
        const iTokenTransfer = tx.transfers.find(transfer =>
          transfer.asset === asset && isSelf(transfer.from)
        );
        if (iTokenTransfer) {
          tokenTransfer.category = SwapIn;
          iTokenTransfer.category = SwapOut;
          tx.method = "Withdrawal";
        } else {
          log.warn(`Couldn't find an outgoing ${asset} transfer`);
        }
      } else if (isSelf(tokenTransfer?.from)) {
        const iTokenTransfer = tx.transfers.find(transfer =>
          transfer.asset === asset && isSelf(transfer.to)
        );
        if (iTokenTransfer) {
          tokenTransfer.category = SwapOut;
          iTokenTransfer.category = SwapIn;
          tx.method = "Deposit";
        } else {
          log.warn(`Couldn't find an outgoing ${asset} transfer`);
        }

      } else {
        log.warn(`Couldn't find a valid ${underlyingAsset} transfer`);
      }
    }
  }

  return tx;
};

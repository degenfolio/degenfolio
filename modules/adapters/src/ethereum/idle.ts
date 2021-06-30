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
  TransactionSource,
  TransferCategories,
} from "@valuemachine/types";
import {
  rmDups,
  setAddressCategory,
  parseEvent,
} from "@valuemachine/utils";
import { publicAddresses } from "valuemachine";

const { Deposit, Withdraw, SwapIn, SwapOut } = TransferCategories;

export const idleSource = "Idle";

////////////////////////////////////////
/// Addresses

const IDLE = "IDLE";
const stkIDLE = "stkIDLE";

const govAddresses = [
  { name: IDLE, address: "0x875773784Af8135eA0ef43b5a374AaD105c5D39e" },
  { name: stkIDLE, address: "0xaAC13a116eA7016689993193FcE4BadC8038136f" },
].map(setAddressCategory(AddressCategories.ERC20));

const marketAddresses = [
  { name: "idleDAIYield", address: "0x3fe7940616e5bc47b0775a0dccf6237893353bb4" },
  { name: "idleDAISafe", address: "0xa14ea0e11121e6e951e87c66afe460a00bcd6a16" },
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
  const log = logger.child({ module: idleSource });
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
      tx.sources = rmDups([idleSource, ...tx.sources]) as TransactionSource[];
      const name = addressBook.getName(address);
      if (name === stkIDLE) {
        const event = parseEvent(stkIDLEInterface, ethTxLog);
        log.info(event);
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
      tx.sources = rmDups([idleSource, ...tx.sources]) as TransactionSource[];
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

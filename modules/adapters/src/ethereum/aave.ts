import {
  AddressBook,
  AddressCategories,
  EthTransaction,
  Logger,
  Transaction,
  TransactionSource,
} from "@valuemachine/types";
import {
  rmDups,
  setAddressCategory,
} from "@valuemachine/utils";

export const aaveSource = "Aave";

const govAddresses = [
  { name: "AAVE", address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9" },
].map(setAddressCategory(AddressCategories.ERC20));

const coreAddresses = [
  { name: "LendingPool", address: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9" },
].map(setAddressCategory(AddressCategories.Defi));

// https://docs.aave.com/developers/deployed-contracts/deployed-contracts
const marketAddresses = [
  { name: "aETHv1", address: "0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04" },
  { name: "aDAIv1", address: "0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d" },
  { name: "aDAI", address: "0x028171bca77440897b824ca71d1c56cac55b68a3" },
  { name: "aAAVE", address: "0xffc97d72e13e01096502cb8eb52dee56f74dad7b" },
  { name: "aBAT", address: "0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1" },
].map(setAddressCategory(AddressCategories.ERC20));

export const aaveAddresses = [
  ...govAddresses,
  ...coreAddresses,
  ...marketAddresses,
];


////////////////////////////////////////
/// Interfaces

const lendingPoolInterface = new Interface([
  "event LiquidationCall(address collateralAsset,address debtAsset,address user,uint256 debtToCover,uint256 liquidatedCollateralAmount,address liquidator,bool receiveAToken )",
  "event ReserveDataUpdated(address asset,uint256 liquidityRate,uint256 stableBorrowRate,uint256 variableBorrowRate,uint256 liquidityIndex,uint256 variableBorrowIndex )",
  "event ReserveUsedAsCollateralEnabled(address _reserve,address _user )",
  "event ReserveUsedAsCollateralDisabled(address _reserve,address _user )",
  "event Deposit(address reserve,address user,address onBehalfOf,uint256 amount,uint16 referral )",
  "event Withdraw(address vault,address owner,address reserve,uint256 amount )",
  "event Repay(address vault,address owner,address reserve,uint256 amount )",
  "event Deposit(address reserve,address user,address onBehalfOf,uint256 amount,uint16 referral )",
]);

const aTokenInterface = new Interface([
  "event Transfer(address from,address to,uint256 value )",
  "event Mint(address _to,uint256 _amount,uint256 _newTotalSupply )",
  "event Burn(address account,address burnAddress,uint256 tokens,uint256 time )",
  "event Approval(address owner,address spender,uint256 value )",
  "event Withdraw(address indexed provider, uint256 value, uint256 ts)",
]);

const aaveStakeInterface = new Interface([
  "event Staked(address indexed from, address indexed onBehalfOf, uint256 amount)",
  "event Redeem(address indexed from, address indexed to, uint256 amount)",
  "event BalanceTransfer(address from,address to,uint256 value,uint256 index )",
]);


////////////////////////////////////////
/// Parser

export const aaveParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  _addressBook: AddressBook,
  _logger: Logger,
): Transaction => {
  //const log = logger.child({ module: aaveSource });
  //log.info(`Parser activated`);

  if (aaveAddresses.some(entry => ethTx.from === entry.address)) {
    tx.sources = rmDups([aaveSource, ...tx.sources]) as TransactionSource[];
  }

  // Incorporating aave adapter
  return tx;
};

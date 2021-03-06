import { AddressZero } from "@ethersproject/constants";
import { formatUnits } from "@ethersproject/units";
import { Interface } from "@ethersproject/abi";


import {
	Asset,
  Address,
  AddressBook,
  AddressCategories,
  EthTransaction,
  EthTransactionLog,
  Logger,
  Transaction,
  Transfer,
  TransactionSource,
  TransferCategories,
} from "@valuemachine/types";
import {
  div,
  gt,
  parseEvent,
  rmDups,
  setAddressCategory,
  sub,
  valuesAreClose,
} from "@valuemachine/utils";

export const aaveSource = "Aave";

const { Income, Deposit, Withdraw, SwapIn, SwapOut, Borrow, Repay } = TransferCategories;

const govAddresses = [
  { name: "AAVE", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9" },
  { name: "stkAAVE", address: "0x4da27a545c0c5B758a6BA100e3a049001de870f5" },
].map(setAddressCategory(AddressCategories.ERC20));

const coreAddresses = [
  { name: "LendingPool", address: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9" },
].map(setAddressCategory(AddressCategories.Defi));

// https://docs.aave.com/developers/deployed-contracts/deployed-contracts
const marketAddresses = [
  { name: "aDAI", address: "0x028171bca77440897b824ca71d1c56cac55b68a3" },
  { name: "aAAVE", address: "0xffc97d72e13e01096502cb8eb52dee56f74dad7b" },
  { name: "aBAT", address: "0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1" },
  { name: "aUSDT", address: "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811", decimals:6 },
  { name: "aWBTC", address: "0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656", decimals:8 },
  { name: "aWETH", address: "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e" },
  { name: "aYFI", address: "0x5165d24277cD063F5ac44Efd447B27025e888f37" },
  { name: "aZRX", address: "0xDf7FF54aAcAcbFf42dfe29DD6144A69b629f8C9e" },
  { name: "aBUSD", address: "0xA361718326c15715591c299427c62086F69923D9" },
  { name: "aENJ", address: "0xaC6Df26a590F08dcC95D5a4705ae8abbc88509Ef" },
  { name: "aKNC", address: "0x39C6b3e42d6A679d7D776778Fe880BC9487C2EDA" },
  { name: "aLINK", address: "0xa06bC25B5805d5F8d82847D191Cb4Af5A3e873E0" },
  { name: "aMANA", address: "0xa685a61171bb30d4072B338c80Cb7b2c865c873E" },
  { name: "aMKR", address: "0xc713e5E149D5D0715DcD1c156a020976e7E56B88" },
  { name: "aREN", address: "0xCC12AbE4ff81c9378D670De1b57F8e0Dd228D77a" },
  { name: "aSNX", address: "0x35f6B052C598d933D69A4EEC4D04c73A191fE6c2" },
  { name: "aSUSD", address: "0x6C5024Cd4F8A59110119C56f8933403A539555EB" },
  { name: "aTUSD", address: "0x101cc05f4A51C0319f570d5E146a8C625198e636" },
  { name: "aUSDC", address: "0xBcca60bB61934080951369a648Fb03DF4F96263C", decimals:6 },
  { name: "aCRV", address: "0x8dAE6Cb04688C62d939ed9B68d32Bc62e49970b1" },
  { name: "aGUSD", address: "0xD37EE7e4f452C6638c96536e68090De8cBcdb583", decimals:2 },
  { name: "aBAL", address: "0x272F97b7a56a387aE942350bBC7Df5700f8a4576" },
  { name: "aXSUSHI", address: "0xF256CC7847E919FAc9B808cC216cAc87CCF2f47a" },
  { name: "aRENFIL", address: "0x514cd6756CCBe28772d4Cb81bC3156BA9d1744aa" },
  { name: "BUSD", address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53" },
  { name: "ENJ", address: "0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c" },
  { name: "KNC", address: "0xdd974D5C2e2928deA5F71b9825b8b646686BD200" },
  { name: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA" },
  { name: "MANA", address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942" },
  { name: "REN", address: "0x408e41876cCCDC0F92210600ef50372656052a38" },
  { name: "TUSD", address: "0x0000000000085d4780B73119b644AE5ecd22b376" },
  { name: "CRV", address: "0xD533a949740bb3306d119CC777fa900bA034cd52" },
  { name: "GUSD", address: "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd", decimals:2 },
  { name: "BAL", address: "0xba100000625a3754423978a60c9317c58a424e3D" },
  { name: "XSUSHI", address: "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272" },
  { name: "RENFIL", address: "0xD5147bc8e386d91Cc5DBE72099DAC6C9b99276F5" },
  { name: "RAI", address: "0x03ab458634910aad20ef5f1c8ee96f1d6ac54919" },
  { name: "ARAI", address: "0xc9bc48c72154ef3e5425641a3c747242112a46af" },
 
].map(setAddressCategory(AddressCategories.ERC20));

export const aaveAddresses = [
  ...govAddresses,
  ...coreAddresses,
  ...marketAddresses,
];

const aaveAddress = govAddresses.find(e => e.name === "AAVE").address;
const stkAAVEAddress = govAddresses.find(e => e.name === "stkAAVE").address;



////////////////////////////////////////
/// Interfaces

const lendingPoolInterface = new Interface([
  "event LiquidationCall(address indexed collateralAsset,address indexed debtAsset,address indexed user,uint256 debtToCover,uint256 liquidatedCollateralAmount,address liquidator,bool receiveAToken )",
  "event ReserveDataUpdated(address indexed reserve,uint256 liquidityRate,uint256 stableBorrowRate,uint256 variableBorrowRate,uint256 liquidityIndex,uint256 variableBorrowIndex )",
  "event ReserveUsedAsCollateralEnabled(address indexed reserve,address indexed user )",
  "event ReserveUsedAsCollateralDisabled(address indexed reserve,address indexed user )",
  "event Deposit(address indexed reserve,address user,address indexed onBehalfOf,uint256 amount,uint16 indexed referral )",
  "event Withdraw(address indexed reserve,address indexed user,address indexed to,uint256 amount )",
  "event Repay(address indexed reserve,address indexed user,address indexed repayer,uint256 amount )",
  "event Borrow(address indexed reserve,address user,address indexed onBehalfOf,uint256 amount,uint256 borrowRateMode,uint256 borrowRate,uint16 indexed referral )",
  "event FlashLoan(address indexed target,address indexed initiator,address indexed asset,uint256 amount,uint256 premium,uint16 referralCode )",
  "event RebalanceStableBorrowRate(address indexed reserve,address indexed user )",
  "event Swap(address indexed user,address indexed reserve,uint256 rateMode)",
]);

const aTokenInterface = new Interface([
  "event Transfer(address from,address to,uint256 value )",
  "event Mint(address _to,uint256 _amount,uint256 _newTotalSupply )",
  "event Burn(address account,address burnAddress,uint256 tokens,uint256 time )",
  "event Approval(address owner,address spender,uint256 value )",
  "event Withdraw(address indexed provider, uint256 value, uint256 ts)",
]);

const aaveStakeInterface = new Interface([
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event AssetConfigUpdated(address indexed asset, uint256 emission)",
  "event AssetIndexUpdated(address indexed asset, uint256 index )",
  "event Cooldown(address indexed user)",
  "event DelegateChanged(address indexed delegator,address indexed delegatee,uint8 delegationType )",
  "event DelegatedPowerChanged(address indexed user,uint256 amount,uint8 delegationType )",
  "event Redeem(address indexed from,address indexed to,uint256 amount)",
  "event RewardsAccrued(address user,uint256 amount)",
  "event RewardsClaimed(address indexed from,address indexed to,uint256 amount )",
  "event Staked(address indexed from,address indexed onBehalfOf,uint256 amount  )",
  "event Transfer(address indexed from,address indexed to,uint256 value )",
  "event UserIndexUpdated(address indexed user,address indexed asset,uint256 index )",
]);



////////////////////////////////////////
/// Parser
const associatedTransfer = (asset: string, quantity: string) =>
  (transfer: Transfer): boolean =>
    transfer.asset === asset && valuesAreClose(transfer.quantity, quantity, div(quantity, "100"));


export const aaveParser = (
  tx: Transaction,
  ethTx: EthTransaction,
  addressBook: AddressBook,
  logger: Logger,
): Transaction => {
  const log = logger.child({ module: aaveSource });
  //log.info(`Parser activated`);
  const { getDecimals, getName, isSelf, isToken } = addressBook;

  if (aaveAddresses.some(entry => ethTx.from === entry.address)) {
    tx.sources = rmDups([aaveSource, ...tx.sources]) as TransactionSource[];
  }
   for (const ethTxLog of ethTx.logs) {
	const address = ethTxLog.address;
	if (coreAddresses.some(e => e.address === address)) {
		const event = parseEvent(lendingPoolInterface, ethTxLog);
		
		if(event.name === "Deposit" && (event.args.user===event.args.onBehalfOf) ){
			log.debug("event is : " + event.name)
			const asset = getName(event.args.reserve) as Asset ;
			const amount = formatUnits(
				event.args.amount,
				addressBook.getDecimals(event.args.reserve),
			);
			const aasset = 'a'+asset
			const aTokenAddress = aaveAddresses.find(entry => entry.name === aasset)?.address;
			const amount2 = formatUnits(
				event.args.amount,
				addressBook.getDecimals(aTokenAddress),
			);
			const swapOut = tx.transfers.find(associatedTransfer(asset, amount));
			const swapIn = tx.transfers.find(associatedTransfer(aasset,amount2));
				if (!swapOut) {
					log.debug(`${event.name}: Can't find swapOut of ${amount} ${asset}`);
				} else if (!swapIn) {
					log.debug(`${event.name}: Can't find swapIn of ${amount2} ${aasset}`);
				} else {
					swapOut.category = SwapOut;
					swapOut.to = address;
					swapIn.category = SwapIn;
					swapIn.from = address;
					tx.method = "Deposit"; 
				}
		}
		
		else	if(event.name === "Withdraw" && (event.args.user===event.args.to)) {
			log.debug("event is : " + event.name)
			const asset = getName(event.args.reserve) as Asset ;
			const amount = formatUnits(
				event.args.amount,
				addressBook.getDecimals(event.args.reserve),
			);
			const aasset = 'a'+asset
			const aTokenAddress = aaveAddresses.find(entry => entry.name === aasset)?.address;
			const amount2 = formatUnits(
				event.args.amount,
				addressBook.getDecimals(aTokenAddress),
			);
			const swapOut = tx.transfers.find(associatedTransfer(aasset, amount2));
			const swapIn = tx.transfers.find(associatedTransfer(asset,amount));
			
			if (!swapOut) {
					log.debug(`${event.name}: Can't find swapOut of ${amount} ${aasset}`);
				} else if (!swapIn) {
					log.debug(`${event.name}: Can't find swapIn of ${amount} ${asset}`);
				} else {
					swapOut.category = SwapOut;
					swapOut.to = address;
					swapIn.category = SwapIn;
					swapIn.from = address;
					tx.method = "Withdraw"; 
				}
		}
		
		else if (event.name === "Borrow" && (event.args.user===event.args.onBehalfOf) ) {
			log.debug("event is : " + event.name)
			const asset = getName(event.args.reserve) as Asset ;
			const amount = formatUnits(
				event.args.amount,
				addressBook.getDecimals(event.args.reserve),
			);
			const borrow = tx.transfers.find(associatedTransfer(asset, amount));
			if (borrow) {
				borrow.category = Borrow;
				borrow.from = address; // should this be a non-address account?
			} else {
				log.debug(`${event.name}: Can't find borrow of ${amount} ${asset}`);
			}
				tx.method = "Borrow";	
		}
		
		else if (event.name === "Repay"&& (event.args.user===event.args.repayer) ) {
			log.debug("event is : " + event.name)
			const asset = getName(event.args.reserve) as Asset ;
			const amount = formatUnits(
				event.args.amount,
				addressBook.getDecimals(event.args.reserve),
			);
			const repay = tx.transfers.find(associatedTransfer(asset, amount));
			if (repay) {
				repay.category = Repay;
				repay.from = address; // should this be a non-address account?
			} else {
				log.debug(`${event.name}: Can't find repayment of ${amount} ${asset}`);
			}
				tx.method = "Repay";	
		}
		
		else {
			log.debug(`Skipping ${event.name} event`);
		}
		
	}
	
	else if (stkAAVEAddress === address) {
			const event = parseEvent(aaveStakeInterface, ethTxLog);
			if(event.name === "Staked"&& (event.args.from===event.args.onBehalfOf) ) {
				log.debug("event is : " + event.name)
				const asset1 = "AAVE" as Asset ;
				const asset2 = "stkAAVE" as Asset ;
				const amount = formatUnits(
					event.args.amount,
					addressBook.getDecimals(address),
				);
				const swapOut = tx.transfers.find(associatedTransfer(asset1, amount));
				const swapIn = tx.transfers.find(associatedTransfer(asset2,amount));
				if (!swapOut) {
					log.debug(`${event.name}: Can't find swapOut of ${amount} ${asset1}`);
				} else if (!swapIn) {
					log.debug(`${event.name}: Can't find swapIn of ${amount} ${asset2}`);
				} else {
					swapOut.category = SwapOut;
					swapOut.to = address;
					swapIn.category = SwapIn;
					swapIn.from = address;
					tx.method = "Deposit"; 
					log.debug(`${event.name}: for ${amount} ${asset1} has been processed`);
				}
				
				
			}
			
			else	if(event.name === "Redeem" && (event.args.from===event.args.to)) {
				log.debug("event is : " + event.name)
				const asset1 = "AAVE" as Asset ;
				const asset2 = "stkAAVE" as Asset ;
				const amount = formatUnits(
					event.args.amount,
					addressBook.getDecimals(address),
				);
				const swapOut = tx.transfers.find(associatedTransfer(asset2, amount));
				const swapIn = tx.transfers.find(associatedTransfer(asset1,amount));
				if (!swapOut) {
					log.debug(`${event.name}: Can't find swapOut of ${amount} ${asset2}`);
				} else if (!swapIn) {
					log.debug(`${event.name}: Can't find swapIn of ${amount} ${asset1}`);
				} else {
					swapOut.category = SwapOut;
					swapOut.to = address;
					swapIn.category = SwapIn;
					swapIn.from = address;
					tx.method = "Withdraw"; 
					log.debug(`${event.name}: for ${amount} ${asset1} has been processed`);
				}
			
		
			}
			
			else {
				log.debug(`Skipping ${event.name} event`);
			}
		
	}

   }

  return tx;
};


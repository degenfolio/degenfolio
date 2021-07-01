import {
  AddressEntry,
  AddressCategory,
  AddressCategories,
} from "@valuemachine/types";
import { fmtAddressEntry } from "@valuemachine/utils";

import { Assets } from "../assets";

const { DAI, USDC, USDT, WBTC, WETH, MATIC, WMATIC } = Assets;

const setAddressCategory = (category: AddressCategory) =>
  (entry: Partial<AddressEntry>): AddressEntry =>
    fmtAddressEntry({
      ...entry,
      category,
      guardian: MATIC,
    } as AddressEntry);

export const polygonAddresses = [
  { name: DAI, address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" },
  { name: USDC, address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
  { name: USDT, address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
  { name: WBTC, address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6" },
  { name: WBTC, address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6" },
  { name: WETH, address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" },
  { name: WMATIC, address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" },
].map(setAddressCategory(AddressCategories.ERC20));

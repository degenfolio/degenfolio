import { keccak256 } from "@ethersproject/keccak256";
import { hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings";
import { AddressBookJson, Asset, AssetChunks, Prices, PricesJson } from "@valuemachine/types";
import axios from "axios";

const skipAssets= ["GRT", "PETH", "SAI", "SPANK", "GEN", "DAI" ];

export const assetToColor = (asset: Asset): string => {
  const offset = 0;
  return !asset ? "black"
    : asset === "ETH" ? "blue"
    : asset === "WBTC" ? "yellow"
    : "#" + hexlify(keccak256(toUtf8Bytes(asset))).substring(2 + offset, 8 + offset);
};

export const fetchPricesForChunks = async (
  unit: string, chunks: AssetChunks
): Promise<PricesJson> => {
  if (chunks.length) {
    try {
      const res = await axios.post(`/api/prices/chunks/${unit}`, { chunks });
      if (res.status === 200 && typeof(res.data) === "object") {
        return res.data;
      }
    } catch (e) {
      console.warn(e);
    }
  }
  return {} as PricesJson;
};

export const fetchPriceForAssetsOnDate = async (
  unit: string,
  assets: string[],
  date: string,
  prices: Prices
): Promise<PricesJson> => {
  if (assets.length) {
    const missingAssets = [] as string[];
    assets.forEach((asset) => {
      if (!prices.getPrice(date, asset)){
        missingAssets.push(asset);
      }
    });

    if (
      !missingAssets.length ||
      missingAssets.reduce(
        (skip: boolean, asset) =>
          skip && ( skipAssets.includes(asset) || asset.startsWith("Uni") || asset.startsWith("c"))
        , true)
    ) return {} as PricesJson;

    try {
      const res = await axios.post(`/api/prices/assets/${unit}/${date}`, { assets: missingAssets });
      if (res.status === 200 && typeof(res.data) === "object") {
        return res.data;
      }
    } catch (e) {
      console.warn(e);
    }
  }
  return {} as PricesJson;
};

export const fetchPrice = async (unit: string, asset: string, date: string): Promise<string> => {
  const currentPrice = await axios.get(`/api/prices/${unit}/${asset}/${date}`);
  if (currentPrice.status === 200 && typeof(currentPrice.data) === "number") {
    return currentPrice.data.toString();
  }
  return "0";
};

export const mergeAddresses = (ab1: AddressBookJson, ab2: AddressBookJson): AddressBookJson => {
  // Create deep copy of addressBook and return new instance.
  const _addressBookJson = JSON.parse(JSON.stringify(ab1)) as AddressBookJson;
  for (const addEntry of ab2) {
    if (!_addressBookJson.some(entry => entry.address === addEntry.address)) {
      _addressBookJson.push(addEntry);
    }
  }
  return _addressBookJson;
};

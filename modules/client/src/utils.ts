import { AddressBookJson } from "@valuemachine/types";
import axios from "axios";

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

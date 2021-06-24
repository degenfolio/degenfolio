import { smeq } from "@valuemachine/utils";
import { AddressBookJson } from "@valuemachine/types";

export const mergeAddresses = (ab1: AddressBookJson, ab2: AddressBookJson): AddressBookJson => {
  // Create deep copy of addressBook and return new instance.
  const _addressBookJson = JSON.parse(JSON.stringify(ab1)) as AddressBookJson;
  for (const addEntry of ab2) {
    if (!_addressBookJson.some(entry => smeq(entry.address, addEntry.address))) {
      _addressBookJson.push(addEntry);
    }
  }
  return _addressBookJson;
};

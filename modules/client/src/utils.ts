import { appAddresses } from "@degenfolio/adapters";
import { smeq } from "@valuemachine/utils";
import { AddressBookJson } from "@valuemachine/types";

export const mergeAppAddresses = (addressBookJson: AddressBookJson): AddressBookJson => {
  for (const appEntry of appAddresses) {
    if (!addressBookJson.some(entry => smeq(entry.address, appEntry.address))) {
      addressBookJson.push(appEntry);
    }
  }
  return addressBookJson;
};


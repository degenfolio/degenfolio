import React, { createContext, useEffect } from "react";
import Typography from "@material-ui/core/Typography";
import {
  AddressBook,
  AddressBookJson,
  StoreKeys,
} from "@valuemachine/types";
import { appAddresses } from "@degenfolio/adapters";
import { getLogger, getLocalStore, smeq } from "@valuemachine/utils";
import { useState } from "react";


import { getAddressBook } from "valuemachine";

const store = getLocalStore(localStorage);

const logger = getLogger("warn");

// localstorage keys
const { AddressBook: AddressBookStore, } = StoreKeys;

export const AccountContext = createContext({} as {
  addressBook: AddressBook,
  setAddressBookJson: (val: AddressBookJson) => void,
})

const mergeAppAddresses = (addressBookJson: AddressBookJson): AddressBookJson => {
  for (const appEntry of appAddresses) {
    if (!addressBookJson.some(entry => smeq(entry.address, appEntry.address))) {
      addressBookJson.push(appEntry);
    }
  }
  return addressBookJson;
};

export const AccountManager = () => {

  // Load stored JSON data from localstorage
  const [addressBookJson, setAddressBookJson] = useState(store.load(AddressBookStore));

  // Parse JSON data into utilities
  const [addressBook, setAddressBook] = useState(getAddressBook({
    json: addressBookJson,
    logger,
  }));

  useEffect(() => {
    if (!addressBookJson) return;
    console.log(`Refreshing ${addressBookJson.length} address book entries`);
    const newAddressBookJson = mergeAppAddresses(addressBookJson);
    store.save(AddressBookStore, newAddressBookJson);
    setAddressBook(getAddressBook({
      json: newAddressBookJson,
      logger
    }));
  }, [addressBookJson]);

  if (addressBook) {
  return (<>
      <Typography>
        {`Our addressBook contains ${
          addressBook.addresses.length
        } addresses of which ${
          addressBook.addresses.filter(a => addressBook.isSelf(a)).length
        } are ours`}
      </Typography>

      <Typography>
        {`We are ${
          typeof setAddressBookJson === "function" ? "" : "NOT "
        }able to update the addressBook`}
      </Typography>
    </>);
  }
  else return <> Nothing </>
};

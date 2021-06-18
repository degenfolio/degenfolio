import { appAddresses } from "@degenfolio/adapters";
import { getLogger, getLocalStore, smeq } from "@valuemachine/utils";
import { AddressBookJson, StoreKeys } from "@valuemachine/types";
import React, { useState, useEffect } from "react";
import { getAddressBook } from "valuemachine";

import "./App.css";
import { AccountManager } from "./components/AccountManager";

const store = getLocalStore(localStorage);
const logger = getLogger("warn");

// localstorage keys
const {
  AddressBook: AddressBookStore,
} = StoreKeys;

const mergeAppAddresses = (addressBookJson: AddressBookJson): AddressBookJson => {
  for (const appEntry of appAddresses) {
    if (!addressBookJson.some(entry => smeq(entry.address, appEntry.address))) {
      addressBookJson.push(appEntry);
    }
  }
  return addressBookJson;
};

const App: React.FC = () => {

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

  return (
    <div className="App">
      <AccountManager addressBook={addressBook} setAddressBookJson={setAddressBookJson}/>
    </div>
  );
};

export default App;

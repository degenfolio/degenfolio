import { getLogger, getLocalStore } from "@valuemachine/utils";
import { StoreKeys } from "@valuemachine/types";
import React, { useState, useEffect } from "react";
import { getAddressBook } from "valuemachine";

import "./App.css";
import { AccountManager } from "./components/AccountManager";

const store = getLocalStore(localStorage as any);
const logger = getLogger("warn");

// localstorage keys
const {
  AddressBook: AddressBookStore,
} = StoreKeys;

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
    store.save(AddressBookStore, addressBookJson);
    setAddressBook(getAddressBook({
      json: addressBookJson,
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

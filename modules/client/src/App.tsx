import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { appAddresses } from "@degenfolio/adapters";
import { getLogger, getLocalStore, smeq } from "@valuemachine/utils";
import { AddressBookJson, StoreKeys } from "@valuemachine/types";
import React, { useState, useEffect, useMemo } from "react";
import { getAddressBook } from "valuemachine";

import "./App.css";
import { AccountManager } from "./components/AccountManager";
import { Home } from "./components/Home";

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

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Home />
      <div className="App">
        <AccountManager addressBook={addressBook} setAddressBookJson={setAddressBookJson}/>
      </div>
    </ThemeProvider>
  );
};

export default App;
